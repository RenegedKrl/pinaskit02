-- Pinas Kit — complementos: criação automática de workspace, limites, métricas e ciclo do plano.

alter table events add column if not exists meta jsonb;
alter table workspaces add column if not exists score_rules jsonb;
alter table workspaces add column if not exists whatsapp_support text;
alter table workspace_members add column if not exists email text;

-- Convites de equipe
create table if not exists invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces on delete cascade,
  email text not null,
  role text not null check (role in ('admin','member','viewer')),
  created_at timestamptz not null default now(),
  unique (workspace_id, email)
);
alter table invites enable row level security;
create policy invites_admin on invites for all using (is_member(workspace_id,'admin')) with check (is_member(workspace_id,'admin'));

-- Ao criar usuário: cria workspace e membro dono (o convite de equipe usa outro caminho)
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare ws uuid; inv record;
begin
  -- convite só vale se existir na tabela invites para este e-mail (metadados do usuário não são confiáveis)
  select * into inv from invites where lower(email) = lower(new.email) order by created_at desc limit 1;
  if found then
    insert into workspace_members (workspace_id, user_id, role, email) values (inv.workspace_id, new.id, inv.role, new.email);
    delete from invites where id = inv.id;
    return new;
  end if;
  insert into workspaces (name) values (coalesce(nullif(new.raw_user_meta_data->>'business_name', ''), 'Meu negócio'))
  returning id into ws;
  insert into workspace_members (workspace_id, user_id, role, email) values (ws, new.id, 'owner', new.email);
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function handle_new_user();

-- Limite de requisições para a API pública (chamado com service role)
create table if not exists rate_limits (
  key text not null,
  window_start timestamptz not null,
  count int not null default 0,
  primary key (key, window_start)
);
alter table rate_limits enable row level security; -- sem políticas: só service role

create or replace function hit_rate_limit(p_key text, p_window int, p_max int) returns boolean
language plpgsql security definer set search_path = public as $$
declare w timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window) * p_window);
declare c int;
begin
  insert into rate_limits (key, window_start, count) values (p_key, w, 1)
  on conflict (key, window_start) do update set count = rate_limits.count + 1
  returning count into c;
  return c <= p_max;
end $$;
revoke execute on function hit_rate_limit(text, int, int) from public, anon, authenticated;

-- Números da tela Início (respeita RLS porque roda como o usuário)
create or replace function dashboard_stats(p_ws uuid, p_from timestamptz, p_widget uuid default null)
returns json language sql stable security invoker set search_path = public as $$
  select json_build_object(
    'views', (select count(distinct (visitor_id, session_id, widget_id)) from events
              where workspace_id = p_ws and type = 'widget_view' and not suspicious and created_at >= p_from
              and (p_widget is null or widget_id = p_widget)),
    'clicks', (select count(distinct (visitor_id, session_id, widget_id)) from events where workspace_id = p_ws and type = 'click' and not suspicious
               and created_at >= p_from and (p_widget is null or widget_id = p_widget)),
    'leads', (select count(*) from leads where workspace_id = p_ws and created_at >= p_from
              and (p_widget is null or widget_id = p_widget)),
    'waiting', (select count(*) from leads where workspace_id = p_ws and status = 'novo'
                and created_at < now() - interval '24 hours'),
    'won', (select count(*) from leads where workspace_id = p_ws and status = 'ganho' and updated_at >= p_from),
    'sources', (select coalesce(json_agg(s order by s.total desc), '[]') from (
                 select coalesce(source_label, 'Acesso direto') as label, count(*) as total from leads
                 where workspace_id = p_ws and created_at >= p_from and (p_widget is null or widget_id = p_widget)
                 group by 1) s),
    'daily', (select coalesce(json_agg(d order by d.day), '[]') from (
                 select date_trunc('day', created_at at time zone 'America/Sao_Paulo')::date as day, count(*) as total
                 from leads where workspace_id = p_ws and created_at >= p_from
                 and (p_widget is null or widget_id = p_widget) group by 1) d)
  );
$$;

-- Fim do teste e da carência: roda 1x por hora (ative pg_cron no Supabase)
create or replace function expire_plans() returns void language sql security definer set search_path = public as $$
  update workspaces set plan_status = 'read_only'
   where (plan_status = 'trial' and trial_ends_at < now())
      or (plan_status = 'past_due' and current_period_end < now() - interval '5 days');
  update workspaces set plan_status = 'read_only'
   where plan_status = 'canceled' and coalesce(current_period_end, now()) < now();
  delete from rate_limits where window_start < now() - interval '2 days';
$$;
-- select cron.schedule('expire-plans', '5 * * * *', 'select expire_plans()');


-- Registro de exportações pelo próprio usuário
create policy audit_insert on audit_log for insert with check (is_member(workspace_id) and user_id = auth.uid());

-- Campos de cobrança só mudam pelo servidor (service role / webhook do Asaas).
-- Sem isto, um administrador poderia se dar plano "active" pelo navegador.
create or replace function protect_billing() returns trigger language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') and (
     new.plan_status is distinct from old.plan_status or new.trial_ends_at is distinct from old.trial_ends_at
     or new.current_period_end is distinct from old.current_period_end
     or new.asaas_customer_id is distinct from old.asaas_customer_id
     or new.asaas_subscription_id is distinct from old.asaas_subscription_id) then
    raise exception 'campos de cobrança só podem ser alterados pelo servidor';
  end if;
  return new;
end $$;
drop trigger if exists workspaces_protect_billing on workspaces;
create trigger workspaces_protect_billing before update on workspaces for each row execute function protect_billing();
