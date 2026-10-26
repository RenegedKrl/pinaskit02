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

-- mensagens prontas, responsável, etiquetas e relatório (0006)
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', true);
insert into message_templates (workspace_id, name, body)
  select workspace_id, 'Oi', 'Olá {nome}!' from t_ws where user_id = '00000000-0000-0000-0000-00000000000a';
update leads set tags = array['vip'], next_followup_at = now(), owner_id = '00000000-0000-0000-0000-00000000000a';
do $$ begin
  if (select owner_id from leads) <> '00000000-0000-0000-0000-00000000000a' then raise exception 'não definiu responsável'; end if;
  begin update leads set owner_id = '00000000-0000-0000-0000-00000000000b'; raise exception 'responsável de outra conta';
  exception when raise_exception then if sqlerrm = 'responsável de outra conta' then raise; end if; end;
  if (select count(*) from report_by_source((select workspace_id from t_ws where user_id = '00000000-0000-0000-0000-00000000000a'), now() - interval '1 day')) <> 1 then
    raise exception 'relatório não trouxe o contato de A'; end if;
end $$;
select mark_notifications_seen();
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', true);
do $$ begin
  if (select count(*) from message_templates) <> 0 then raise exception 'B vê mensagens prontas de A'; end if;
  if (select count(*) from report_by_source((select workspace_id from t_ws where user_id = '00000000-0000-0000-0000-00000000000a'), now() - interval '1 day')) <> 0 then
    raise exception 'B vê o relatório de A'; end if;
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
-- ---------- Fase 2: importação, alertas, rodízio, webhook ----------
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', true);
do $$ declare ws_a uuid := (select workspace_id from t_ws where user_id = '00000000-0000-0000-0000-00000000000a');
               ws_b uuid := (select workspace_id from t_ws where user_id = '00000000-0000-0000-0000-00000000000b');
begin
  -- importação: o painel só insere com capture_method = 'import', e só na própria conta
  insert into leads (workspace_id, phone_e164, name, capture_method) values (ws_a, '5511900000001', 'Importado', 'import');
  begin insert into leads (workspace_id, phone_e164, capture_method) values (ws_a, '5511900000002', 'page_form'); raise exception 'painel inseriu contato sem ser importação';
  exception when insufficient_privilege then null; end;
  begin insert into leads (workspace_id, phone_e164, capture_method) values (ws_b, '5511900000003', 'import'); raise exception 'importou na conta B';
  exception when insufficient_privilege then null; end;
  -- alertas: cada um muda só os seus
  perform set_my_alerts(ws_a, false, false);
  perform set_my_alerts(ws_b, false, false);
  -- campos do servidor: navegador não mexe
  begin update workspaces set webhook_last_status = 200 where id = ws_a; raise exception 'navegador mudou webhook_last_status';
  exception when raise_exception then if sqlerrm = 'navegador mudou webhook_last_status' then raise; end if; end;
  begin update workspaces set digest_sent_on = current_date where id = ws_a; raise exception 'navegador mudou digest_sent_on';
  exception when raise_exception then if sqlerrm = 'navegador mudou digest_sent_on' then raise; end if; end;
  begin update workspaces set webhook_url = 'http://inseguro.com' where id = ws_a; raise exception 'aceitou webhook sem https';
  exception when check_violation then null; end;
  update workspaces set webhook_url = 'https://hooks.exemplo.com/x' where id = ws_a;
  -- fila do rodízio e segredo do webhook: só o servidor / só admin da própria conta
  begin perform next_attendant(ws_a); raise exception 'navegador chamou next_attendant';
  exception when insufficient_privilege then null; end;
  begin perform rotate_webhook_secret(ws_b); raise exception 'A trocou o segredo do B';
  exception when raise_exception then if sqlerrm = 'A trocou o segredo do B' then raise; end if; end;
  perform rotate_webhook_secret(ws_a);
end $$;
reset role;
do $$ declare ws_a uuid := (select workspace_id from t_ws where user_id = '00000000-0000-0000-0000-00000000000a'); r record;
begin
  if (select alert_new_lead or alert_daily from workspace_members where user_id = '00000000-0000-0000-0000-00000000000a') then raise exception 'set_my_alerts não salvou'; end if;
  if not (select alert_new_lead and alert_daily from workspace_members where user_id = '00000000-0000-0000-0000-00000000000b') then raise exception 'A mudou os alertas do B'; end if;
  if (select webhook_url from workspaces where id = ws_a) <> 'https://hooks.exemplo.com/x' then raise exception 'webhook https não salvou'; end if;
  -- rodízio: sem ninguém na fila não devolve nada; com A na fila, devolve A e marca a vez
  if exists (select 1 from next_attendant(ws_a)) then raise exception 'rodízio sem fila devolveu alguém'; end if;
  update workspace_members set whatsapp_e164 = '5511988887777', in_rotation = true where user_id = '00000000-0000-0000-0000-00000000000a';
  select * into r from next_attendant(ws_a);
  if r.user_id is distinct from '00000000-0000-0000-0000-00000000000a' or r.whatsapp_e164 <> '5511988887777' then raise exception 'rodízio não escolheu A'; end if;
  if (select last_assigned_at from workspace_members where user_id = '00000000-0000-0000-0000-00000000000a') is null then raise exception 'rodízio não marcou a vez'; end if;
  begin update workspace_members set whatsapp_e164 = '12ab' where user_id = '00000000-0000-0000-0000-00000000000a'; raise exception 'aceitou WhatsApp inválido';
  exception when check_violation then null; end;
end $$;
-- ---------- CRM completo: tarefas, negócios, funis, automações, propostas, agenda, visão restrita ----------
insert into leads (workspace_id, phone_e164, name, owner_id)
select workspace_id, '5511955550001', 'Lead do A', user_id from t_ws where user_id = '00000000-0000-0000-0000-00000000000a';
insert into leads (workspace_id, phone_e164, name)
select workspace_id, '5511955550002', 'Lead sem dono' from t_ws where user_id = '00000000-0000-0000-0000-00000000000a';
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', true);
do $$ declare ws_a uuid := (select workspace_id from t_ws where user_id = '00000000-0000-0000-0000-00000000000a');
               lead_a uuid := (select id from leads where phone_e164 = '5511955550001');
               lead_b uuid := (select id from leads where workspace_id <> ws_a limit 1);
               pl uuid;
begin
  if lead_b is not null then raise exception 'A enxerga contato de B'; end if;
  insert into tasks (workspace_id, lead_id, title) values (ws_a, lead_a, 'Ligar');
  insert into deals (workspace_id, lead_id, title, value) values (ws_a, lead_a, 'Implante', 1500);
  insert into custom_fields (workspace_id, key, label) values (ws_a, 'cpf', 'CPF');
  insert into products (workspace_id, name, price) values (ws_a, 'Limpeza', 200);
  -- proposta: cria, mas a resposta só vem do cliente (servidor)
  insert into proposals (workspace_id, lead_id, title, items, total) values (ws_a, lead_a, 'Orçamento', '[{"name":"x","qty":1,"price":10}]', 10);
  begin update proposals set status = 'accepted' where lead_id = lead_a; raise exception 'navegador aceitou proposta';
  exception when raise_exception then if sqlerrm = 'navegador aceitou proposta' then raise; end if; end;
  -- funis: extra só com etapas livres, até 5 funis
  insert into pipelines (workspace_id, name) values (ws_a, 'Pós-venda') returning id into pl;
  insert into pipeline_stages (workspace_id, pipeline_id, key, name, kind) values (ws_a, pl, 'pos_1', 'Entrada', 'open');
  begin insert into pipeline_stages (workspace_id, pipeline_id, key, name, kind) values (ws_a, pl, 'pos_won', 'Ganhou', 'won'); raise exception 'etapa fixa em funil extra';
  exception when raise_exception then if sqlerrm = 'etapa fixa em funil extra' then raise; end if; end;
  begin delete from pipelines where workspace_id = ws_a and is_main; raise exception 'apagou funil principal';
  exception when raise_exception then if sqlerrm = 'apagou funil principal' then raise; end if; end;
  -- automação: entrar em "proposta" cria tarefa
  insert into automations (workspace_id, name, trigger, stage_key, task_title, task_days) values (ws_a, 'Cobrar', 'stage_enter', 'proposta', 'Cobrar resposta', 2);
  update leads set status = 'proposta' where id = lead_a;
  -- rotina diária e fila só no servidor
  begin perform run_daily_crm(); raise exception 'navegador rodou a rotina diária';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
do $$ declare ws_a uuid := (select workspace_id from t_ws where user_id = '00000000-0000-0000-0000-00000000000a');
               lead_a uuid := (select id from leads where phone_e164 = '5511955550001'); bp uuid; n int;
begin
  if not exists (select 1 from tasks where lead_id = lead_a and title = 'Cobrar resposta' and source = 'automation' and due_at > now() + interval '1 day') then
    raise exception 'automação de etapa não criou a tarefa'; end if;
  if (select count(*) from pipelines where workspace_id = ws_a) <> 2 then raise exception 'funil extra não criado'; end if;
  -- agenda: o mesmo horário não pode ser marcado duas vezes
  insert into booking_pages (workspace_id, slug, title) values (ws_a, 'teste-rls-agenda', 'Avaliação') returning id into bp;
  insert into appointments (workspace_id, page_id, starts_at, ends_at, name, phone) values (ws_a, bp, '2030-01-07 12:00+00', '2030-01-07 12:30+00', 'Ana', '5511900000000');
  begin insert into appointments (workspace_id, page_id, starts_at, ends_at, name, phone) values (ws_a, bp, '2030-01-07 12:00+00', '2030-01-07 12:30+00', 'Bia', '5511900000001'); raise exception 'horário duplo';
  exception when unique_violation then null; end;
  -- rotina diária: contato parado e aniversário viram tarefa (uma vez)
  insert into automations (workspace_id, name, trigger, days, task_title) values (ws_a, 'Parado', 'stale', 1, 'Retomar conversa');
  update leads set updated_at = now() - interval '5 days', birthday = (now() at time zone 'America/Sao_Paulo')::date - interval '30 years' where id = lead_a;
  perform run_daily_crm(); perform run_daily_crm();
  select count(*) into n from tasks where lead_id = lead_a and title = 'Retomar conversa';
  if n <> 1 then raise exception 'contato parado: esperava 1 tarefa, veio %', n; end if;
  if (select count(*) from tasks where lead_id = lead_a and source = 'birthday') <> 1 then raise exception 'aniversário não virou tarefa (ou repetiu)'; end if;
  -- visão restrita: C é membro de A com "só os meus"
  insert into auth.users (id, email) values ('00000000-0000-0000-0000-00000000000c', 'c@teste.com');
  insert into workspace_members (workspace_id, user_id, role, email, see_only_own) values (ws_a, '00000000-0000-0000-0000-00000000000c', 'member', 'c@teste.com', true);
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000c', true);
do $$ begin
  if exists (select 1 from leads where phone_e164 = '5511955550001') then raise exception 'C (só os meus) viu contato do A'; end if;
  if not exists (select 1 from leads where phone_e164 = '5511955550002') then raise exception 'C não viu contato sem responsável'; end if;
  if exists (select 1 from tasks where title = 'Ligar') then raise exception 'C viu tarefa de contato que não é dele'; end if;
  if exists (select 1 from deals where title = 'Implante') then raise exception 'C viu negociação de contato que não é dele'; end if;
  update leads set name = 'invadido' where phone_e164 = '5511955550001';
  begin perform merge_leads((select id from leads where phone_e164 = '5511955550002'), (select id from leads where phone_e164 = '5511955550002')); raise exception 'membro juntou contatos';
  exception when raise_exception then if sqlerrm = 'membro juntou contatos' then raise; end if; end;
end $$;
reset role;
do $$ begin
  if (select name from leads where phone_e164 = '5511955550001') = 'invadido' then raise exception 'C alterou contato do A'; end if;
end $$;
-- juntar repetidos (dono): histórico, tarefas e negociações passam para o que fica
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', true);
select merge_leads((select id from leads where phone_e164 = '5511955550001'), (select id from leads where phone_e164 = '5511955550002'));
reset role;
do $$ begin
  if exists (select 1 from leads where phone_e164 = '5511955550002') then raise exception 'merge não apagou o repetido'; end if;
  if not exists (select 1 from lead_activities where type = 'merge') then raise exception 'merge não registrou no histórico'; end if;
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
