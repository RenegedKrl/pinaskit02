-- Rotinas automáticas (pg_cron + pg_net).
-- O segredo do aviso de fim do teste fica no Vault com o nome 'cron_secret' (igual ao CRON_SECRET das funções);
-- crie uma vez com: select vault.create_secret('<valor>', 'cron_secret');
-- A URL do projeto fica no Vault como 'project_url' (ex.: https://PROJETO.supabase.co).
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Fim do teste e da carência: 1x por hora
select cron.unschedule('expire-plans') where exists (select 1 from cron.job where jobname = 'expire-plans');
select cron.schedule('expire-plans', '5 * * * *', 'select public.expire_plans()');

-- Aviso de fim do teste: 1x por dia às 9h de Brasília (12h UTC)
select cron.unschedule('trial-reminder') where exists (select 1 from cron.job where jobname = 'trial-reminder');
select cron.schedule('trial-reminder', '0 12 * * *', $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/trial-reminder',
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')),
    body := '{}'::jsonb)
$$);
