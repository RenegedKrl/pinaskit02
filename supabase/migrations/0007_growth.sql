-- Fase 2: motivo da perda, alertas por pessoa, rodízio de atendentes, webhook, importação e e-mails do teste.

-- Motivo da perda (o valor da venda já existe em leads.deal_value)
alter table leads add column if not exists lost_reason text check (lost_reason is null or char_length(lost_reason) <= 120);

-- Contatos importados de planilha
alter table leads drop constraint if exists leads_capture_method_check;
alter table leads add constraint leads_capture_method_check
  check (capture_method in ('button_form', 'page_form', 'connected_form', 'direct_link', 'import'));
-- O painel só insere contato por importação (o resto entra pelas Edge Functions).
drop policy if exists leads_import on leads;
create policy leads_import on leads for insert with check (is_member(workspace_id, 'member') and capture_method = 'import');

-- Alertas por pessoa da equipe (cada um liga/desliga os seus)
alter table workspace_members add column if not exists alert_new_lead boolean not null default true;
alter table workspace_members add column if not exists alert_daily boolean not null default true;

create or replace function set_my_alerts(p_ws uuid, p_new_lead boolean, p_daily boolean) returns void
language sql security definer set search_path = public as $$
  update workspace_members set alert_new_lead = p_new_lead, alert_daily = p_daily
   where workspace_id = p_ws and user_id = auth.uid();
$$;
revoke all on function set_my_alerts(uuid, boolean, boolean) from public, anon;
grant execute on function set_my_alerts(uuid, boolean, boolean) to authenticated;

-- Rodízio: quem atende e por qual WhatsApp. Gerenciado por dono/admin (política wm_write).
alter table workspace_members add column if not exists whatsapp_e164 text
  check (whatsapp_e164 is null or whatsapp_e164 ~ '^[0-9]{10,15}$');
alter table workspace_members add column if not exists in_rotation boolean not null default false;
alter table workspace_members add column if not exists last_assigned_at timestamptz;

-- Próximo da fila: quem recebeu contato há mais tempo. Só o servidor (service role) chama.
create or replace function next_attendant(p_ws uuid) returns table (user_id uuid, whatsapp_e164 text)
language sql security definer set search_path = public as $$
  update workspace_members m set last_assigned_at = clock_timestamp()
   where m.workspace_id = p_ws and m.user_id = (
     select q.user_id from workspace_members q
      where q.workspace_id = p_ws and q.in_rotation and q.whatsapp_e164 is not null and q.role <> 'viewer'
      order by q.last_assigned_at nulls first, q.user_id
      limit 1 for update skip locked)
  returning m.user_id, m.whatsapp_e164;
$$;
revoke all on function next_attendant(uuid) from public, anon, authenticated;
grant execute on function next_attendant(uuid) to service_role;

-- Webhook (Zapier, Make, RD Station, Google Planilhas): só https; o segredo assina cada envio.
alter table workspaces add column if not exists webhook_url text
  check (webhook_url is null or (webhook_url ~ '^https://' and char_length(webhook_url) <= 500));
alter table workspaces add column if not exists webhook_secret text not null default replace(gen_random_uuid()::text, '-', '');
alter table workspaces add column if not exists webhook_last_status int;
alter table workspaces add column if not exists webhook_last_at timestamptz;

-- E-mails automáticos: marcas de envio (1 vez cada)
alter table workspaces add column if not exists install_nudge_sent_at timestamptz;
alter table workspaces add column if not exists digest_sent_on date;

-- Navegador não mexe nas marcas de envio nem no resultado do webhook (só o servidor).
create or replace function protect_billing() returns trigger language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') and (
     new.plan_status is distinct from old.plan_status or new.trial_ends_at is distinct from old.trial_ends_at
     or new.current_period_end is distinct from old.current_period_end
     or new.asaas_customer_id is distinct from old.asaas_customer_id
     or new.asaas_subscription_id is distinct from old.asaas_subscription_id
     or new.trial_reminder_sent_at is distinct from old.trial_reminder_sent_at
     or new.install_nudge_sent_at is distinct from old.install_nudge_sent_at
     or new.digest_sent_on is distinct from old.digest_sent_on
     or new.webhook_last_status is distinct from old.webhook_last_status
     or new.webhook_last_at is distinct from old.webhook_last_at) then
    raise exception 'campos de cobrança só podem ser alterados pelo servidor';
  end if;
  return new;
end $$;

-- Gera um segredo novo do webhook (dono/admin).
create or replace function rotate_webhook_secret(p_ws uuid) returns text
language plpgsql security definer set search_path = public as $$
declare s text := replace(gen_random_uuid()::text, '-', '');
begin
  if not is_member(p_ws, 'admin') then raise exception 'sem permissão'; end if;
  update workspaces set webhook_secret = s where id = p_ws;
  return s;
end $$;
revoke all on function rotate_webhook_secret(uuid) from public, anon;
grant execute on function rotate_webhook_secret(uuid) to authenticated;

-- Resumo diário às 8h de Brasília (11h UTC)
select cron.unschedule('daily-digest') where exists (select 1 from cron.job where jobname = 'daily-digest');
select cron.schedule('daily-digest', '0 11 * * *', $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/daily-digest',
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')),
    body := '{}'::jsonb)
$$);
