-- Etapas do funil por conta: o cliente cria, renomeia, reordena e apaga colunas.
-- Três etapas são fixas (só renomear): 'novo' (todo contato entra nela), 'ganho' e 'perdido'
-- (os números de venda do Início dependem delas). leads.status guarda a "key" da etapa.

create table if not exists pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces on delete cascade,
  key text not null check (key ~ '^[a-z0-9_]{2,40}$'),
  name text not null check (char_length(btrim(name)) between 1 and 40),
  hint text check (hint is null or char_length(hint) <= 80),
  position int not null default 0,
  kind text not null default 'open' check (kind in ('new', 'open', 'won', 'lost')),
  created_at timestamptz not null default now(),
  unique (workspace_id, key)
);
create index if not exists pipeline_stages_ws on pipeline_stages (workspace_id, position);

alter table pipeline_stages enable row level security;
drop policy if exists stages_read on pipeline_stages;
create policy stages_read on pipeline_stages for select using (is_member(workspace_id));
drop policy if exists stages_write on pipeline_stages;
create policy stages_write on pipeline_stages for insert with check (is_member(workspace_id, 'admin'));
drop policy if exists stages_update on pipeline_stages;
create policy stages_update on pipeline_stages for update using (is_member(workspace_id, 'admin')) with check (is_member(workspace_id, 'admin'));
drop policy if exists stages_delete on pipeline_stages;
create policy stages_delete on pipeline_stages for delete using (is_member(workspace_id, 'admin'));

-- Regras: no máximo 10 etapas; fixas não podem ser apagadas; key e tipo nunca mudam.
create or replace function guard_stage() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    if new.kind <> 'open' and exists (select 1 from pipeline_stages where workspace_id = new.workspace_id and kind = new.kind) then
      raise exception 'etapa fixa já existe';
    end if;
    if (select count(*) from pipeline_stages where workspace_id = new.workspace_id) >= 10 then
      raise exception 'limite de 10 etapas no funil';
    end if;
    return new;
  elsif tg_op = 'UPDATE' then
    if new.key is distinct from old.key or new.kind is distinct from old.kind or new.workspace_id is distinct from old.workspace_id then
      raise exception 'não é possível mudar a identificação da etapa';
    end if;
    return new;
  else
    if old.kind <> 'open' and exists (select 1 from workspaces where id = old.workspace_id) then
      raise exception 'esta etapa é fixa: pode ser renomeada, mas não apagada';
    end if;
    return old;
  end if;
end $$;
drop trigger if exists pipeline_stages_guard on pipeline_stages;
create trigger pipeline_stages_guard before insert or update or delete on pipeline_stages
  for each row execute function guard_stage();

-- Etapas padrão (as mesmas de antes)
create or replace function seed_stages(ws uuid) returns void language sql security definer set search_path = public as $$
  insert into pipeline_stages (workspace_id, key, name, hint, position, kind) values
    (ws, 'novo', 'Novo', 'Ainda não foi atendido', 0, 'new'),
    (ws, 'em_atendimento', 'Em atendimento', 'Conversa em andamento', 1, 'open'),
    (ws, 'proposta', 'Proposta enviada', 'Orçamento ou proposta enviada', 2, 'open'),
    (ws, 'negociacao', 'Negociação', 'Ajustando condições', 3, 'open'),
    (ws, 'ganho', 'Venda concluída', 'Virou cliente', 100, 'won'),
    (ws, 'perdido', 'Não convertido', 'Desistiu ou não tinha perfil', 101, 'lost')
  on conflict (workspace_id, key) do nothing;
$$;
select seed_stages(id) from workspaces;

create or replace function seed_stages_trigger() returns trigger language plpgsql security definer set search_path = public as $$
begin perform seed_stages(new.id); return new; end $$;
drop trigger if exists workspaces_seed_stages on workspaces;
create trigger workspaces_seed_stages after insert on workspaces for each row execute function seed_stages_trigger();

-- leads.status passa a apontar para uma etapa da própria conta
alter table leads drop constraint if exists leads_status_check;
alter table leads drop constraint if exists leads_stage_fk;
alter table leads add constraint leads_stage_fk foreign key (workspace_id, status)
  references pipeline_stages (workspace_id, key) on delete no action; -- checado no fim do comando (apagar conta em cascata funciona)

-- Apagar etapa movendo os contatos dela para outra, numa operação só (só admin).
create or replace function delete_stage(p_stage uuid, p_move_to text) returns void
language plpgsql security definer set search_path = public as $$
declare st pipeline_stages;
begin
  select * into st from pipeline_stages where id = p_stage;
  if not found or not is_member(st.workspace_id, 'admin') then raise exception 'sem permissão'; end if;
  if st.kind <> 'open' then raise exception 'esta etapa é fixa: pode ser renomeada, mas não apagada'; end if;
  if p_move_to = st.key or not exists (select 1 from pipeline_stages where workspace_id = st.workspace_id and key = p_move_to) then
    raise exception 'escolha outra etapa para receber os contatos';
  end if;
  update leads set status = p_move_to, updated_at = now() where workspace_id = st.workspace_id and status = st.key;
  delete from pipeline_stages where id = p_stage;
end $$;
revoke all on function delete_stage(uuid, text) from public, anon;
grant execute on function delete_stage(uuid, text) to authenticated;
