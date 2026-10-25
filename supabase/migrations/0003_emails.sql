-- Aviso de fim do teste: marca quando o e-mail foi enviado (1 vez por conta).
alter table workspaces add column if not exists trial_reminder_sent_at timestamptz;


-- O navegador também não pode mexer na marca do aviso (evita reenvio forçado).
create or replace function protect_billing() returns trigger language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') and (
     new.plan_status is distinct from old.plan_status or new.trial_ends_at is distinct from old.trial_ends_at
     or new.current_period_end is distinct from old.current_period_end
     or new.asaas_customer_id is distinct from old.asaas_customer_id
     or new.asaas_subscription_id is distinct from old.asaas_subscription_id
     or new.trial_reminder_sent_at is distinct from old.trial_reminder_sent_at) then
    raise exception 'campos de cobrança só podem ser alterados pelo servidor';
  end if;
  return new;
end $$;
