-- Teste de isolamento entre workspaces. Roda dentro de uma transação desfeita no fim (rollback),
-- então pode rodar até num banco com dados reais — só olha para as 2 contas de teste que cria:
--   psql -v ON_ERROR_STOP=1 -f tests/rls.sql    ou    npx supabase db query --linked -f tests/rls.sql
begin;
grant select, insert, update, delete on all tables in schema public to authenticated;
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'a@teste.com'),
  ('00000000-0000-0000-0000-00000000000b', 'b@teste.com');
create temp table t_ws on commit drop as
  select user_id, workspace_id from workspace_members
   where user_id in ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b');
grant select on t_ws to authenticated, anon;
-- o gatilho criou um workspace (com as 6 etapas padrão) para cada um
do $$ begin
  if (select count(*) from t_ws) <> 2 then raise exception 'gatilho não criou os workspaces'; end if;
  if (select count(*) from pipeline_stages where workspace_id in (select workspace_id from t_ws)) <> 12 then
    raise exception 'etapas padrão não foram criadas'; end if;
end $$;
insert into widgets (workspace_id, public_key, name, whatsapp_e164)
select workspace_id, 'chave_' || substr(user_id::text, 36), 'W', '5511999990000' from t_ws;
insert into leads (workspace_id, phone_e164, name)
select workspace_id, '55119' || substr(user_id::text, 36) || '000000', 'Lead' from t_ws;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', true);
do $$
declare ws_b uuid := (select workspace_id from workspace_members where user_id = '00000000-0000-0000-0000-00000000000b');
begin
  if (select count(*) from leads) <> 1 then raise exception 'A vê leads de outro workspace'; end if;
  if (select count(*) from widgets) <> 1 then raise exception 'A vê widgets de outro workspace'; end if;
  if (select count(*) from workspaces) <> 1 then raise exception 'A vê outro workspace'; end if;
  if (select count(*) from pipeline_stages) <> 6 then raise exception 'A vê etapas de outro workspace'; end if;
  if ws_b is not null then raise exception 'A enxerga membros do B'; end if;
end $$;
-- tentativas de escrita cruzada não afetam nada
update leads set name = 'hack' where name = 'Lead';
update pipeline_stages set name = 'hack';
reset role;
do $$ begin
  if (select count(*) from leads where name = 'hack' and workspace_id in (select workspace_id from t_ws)) <> 1 then
    raise exception 'update cruzado afetou o B'; end if;
  if (select count(*) from pipeline_stages where name = 'hack' and workspace_id in (select workspace_id from t_ws)) <> 6 then
    raise exception 'etapas: update cruzado afetou o B (ou não renomeou as de A)'; end if;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', true);
delete from widgets;
reset role;
do $$ begin
  if (select count(*) from widgets where workspace_id in (select workspace_id from t_ws)) <> 1 then
    raise exception 'delete esperado só no próprio workspace'; end if;
end $$;

-- etapas: criar, limite de 10, fixas não saem, apagar move os contatos
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', true);
insert into pipeline_stages (workspace_id, key, name, position)
  select workspace_id, 'visita', 'Visita marcada', 5 from t_ws where user_id = '00000000-0000-0000-0000-00000000000a';
update leads set status = 'visita';
do $$ begin
  begin delete from pipeline_stages where key = 'ganho'; raise exception 'apagou etapa fixa';
  exception when raise_exception then if sqlerrm = 'apagou etapa fixa' then raise; end if; end;
  begin update pipeline_stages set key = 'outra' where key = 'novo'; raise exception 'mudou key';
  exception when raise_exception then if sqlerrm = 'mudou key' then raise; end if; end;
  begin update leads set status = 'nao_existe'; raise exception 'status fora das etapas';
  exception when foreign_key_violation then null; end;
end $$;
select delete_stage((select id from pipeline_stages where key = 'visita'), 'proposta');
do $$ begin
  if exists (select 1 from pipeline_stages where key = 'visita') then raise exception 'delete_stage não apagou'; end if;
  if (select status from leads) <> 'proposta' then raise exception 'delete_stage não moveu os contatos'; end if;
  insert into pipeline_stages (workspace_id, key, name, position)
    select workspace_id, 'e' || g, 'Extra ' || g, 10 + g from workspace_members, generate_series(1, 4) g;
  begin
    insert into pipeline_stages (workspace_id, key, name, position) select workspace_id, 'e5', 'Extra 5', 20 from workspace_members;
    raise exception 'passou do limite de 10';
  exception when raise_exception then if sqlerrm = 'passou do limite de 10' then raise; end if; end;
end $$;
reset role;
-- B não apaga etapa de A
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', true);
do $$ begin
  begin perform delete_stage((select id from pipeline_stages p join t_ws t on t.workspace_id = p.workspace_id
                               where t.user_id = '00000000-0000-0000-0000-00000000000a' and p.key = 'e1'), 'novo');
    raise exception 'B apagou etapa de A';
  exception when raise_exception then if sqlerrm = 'B apagou etapa de A' then raise; end if; end;
end $$;
reset role;

-- viewer não edita
update workspace_members set role = 'viewer' where user_id = '00000000-0000-0000-0000-00000000000b';
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', true);
update leads set name = 'viewer';
update pipeline_stages set name = 'viewer';
reset role;
do $$ begin
  if exists (select 1 from leads where name = 'viewer') then raise exception 'viewer conseguiu editar'; end if;
  if exists (select 1 from pipeline_stages where name = 'viewer') then raise exception 'viewer editou etapas'; end if;
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
-- nem mexer na marca do aviso de fim do teste (forçaria reenvio ou bloquearia o aviso)
do $$ begin
  begin update workspaces set trial_reminder_sent_at = now(); raise exception 'admin mudou trial_reminder_sent_at';
  exception when raise_exception then
    if sqlerrm = 'admin mudou trial_reminder_sent_at' then raise; end if;
  end;
end $$;
update workspaces set name = 'Novo nome';
reset role;
do $$ begin
  if not exists (select 1 from workspaces where name = 'Novo nome' and id in (select workspace_id from t_ws)) then
    raise exception 'admin não conseguiu renomear'; end if;
end $$;
-- apagar a conta inteira leva junto etapas e contatos
delete from workspaces where id in (select workspace_id from t_ws where user_id = '00000000-0000-0000-0000-00000000000b');
-- anon não lê nada (no Supabase ele recebe lista vazia; sem a permissão, um erro — os dois servem)
select set_config('request.jwt.claim.sub', '', true); -- visitante sem login (sem isso herdaria o usuário A)
set local role anon;
do $$ declare n int; begin
  begin
    select (select count(*) from leads) + (select count(*) from widgets) + (select count(*) from pipeline_stages)
         + (select count(*) from workspaces) + (select count(*) from events) into n;
    if n > 0 then raise exception 'anon leu dados (% linhas)', n; end if;
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
