-- Teste de isolamento entre workspaces. Rodar num banco de teste após as migrações:
--   psql -v ON_ERROR_STOP=1 -f tests/rls.sql   (falha = erro)
begin;
grant select, insert, update, delete on all tables in schema public to authenticated;
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'a@teste.com'),
  ('00000000-0000-0000-0000-00000000000b', 'b@teste.com');
-- o gatilho criou um workspace para cada um
do $$ begin
  if (select count(*) from workspace_members) <> 2 then raise exception 'gatilho não criou os workspaces'; end if;
end $$;
insert into widgets (workspace_id, public_key, name, whatsapp_e164)
select workspace_id, 'chave_' || substr(user_id::text, 36), 'W', '5511999990000' from workspace_members;
insert into leads (workspace_id, phone_e164, name)
select workspace_id, '55119' || substr(user_id::text, 36) || '000000', 'Lead' from workspace_members;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', true);
do $$
declare ws_b uuid := (select workspace_id from workspace_members where user_id = '00000000-0000-0000-0000-00000000000b');
begin
  if (select count(*) from leads) <> 1 then raise exception 'A vê leads de outro workspace'; end if;
  if (select count(*) from widgets) <> 1 then raise exception 'A vê widgets de outro workspace'; end if;
  if (select count(*) from workspaces) <> 1 then raise exception 'A vê outro workspace'; end if;
  if ws_b is not null then raise exception 'A enxerga membros do B'; end if;
end $$;
-- tentativas de escrita cruzada não afetam nada
update leads set name = 'hack' where name = 'Lead';
reset role;
do $$ begin
  if (select count(*) from leads where name = 'hack') <> 1 then raise exception 'update cruzado afetou o B'; end if;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', true);
delete from widgets;
insert into widgets (workspace_id, public_key, name, whatsapp_e164)
  select id, 'x', 'x', '1' from workspaces where false;
reset role;
do $$ begin
  if (select count(*) from widgets) <> 1 then raise exception 'delete esperado só no próprio workspace'; end if;
end $$;
-- viewer não edita
update workspace_members set role = 'viewer' where user_id = '00000000-0000-0000-0000-00000000000b';
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', true);
update leads set name = 'viewer' ;
reset role;
do $$ begin
  if exists (select 1 from leads where name = 'viewer') then raise exception 'viewer conseguiu editar'; end if;
end $$;
-- admin não consegue se dar plano pago pelo navegador
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', true);
do $$ begin
  begin update workspaces set plan_status = 'active'; raise exception 'admin mudou plan_status';
  exception when raise_exception then
    if sqlerrm = 'admin mudou plan_status' then raise; end if;
  end;
end $$;
-- nem zerar a marca do aviso de fim do teste (forçaria reenvio)
do $$ begin
  begin update workspaces set trial_reminder_sent_at = null; raise exception 'admin mudou trial_reminder_sent_at';
  exception when raise_exception then
    if sqlerrm = 'admin mudou trial_reminder_sent_at' then raise; end if;
  end;
end $$;
update workspaces set name = 'Novo nome';
reset role;
do $$ begin
  if not exists (select 1 from workspaces where name = 'Novo nome') then raise exception 'admin não conseguiu renomear'; end if;
end $$;
-- anon não lê nada
set local role anon;
do $$ begin
  begin perform count(*) from leads; raise exception 'anon leu leads';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
-- limite de requisições
do $$ begin
  perform hit_rate_limit('t', 60, 2); perform hit_rate_limit('t', 60, 2);
  if hit_rate_limit('t', 60, 2) then raise exception 'rate limit não bloqueou'; end if;
end $$;
select 'RLS OK' as resultado;
rollback;
