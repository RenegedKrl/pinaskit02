-- CRM completo (parte 1): visão restrita, tarefas, sequências, negócios e produtos, campos personalizados,
-- tempo de resposta, vários funis, automações e junção de contatos repetidos.

-- ---------- Ver só os meus contatos ----------
alter table workspace_members add column if not exists see_only_own boolean not null default false;

-- Quem vê o contato: membro da conta; com "só os meus", vê os seus e os sem responsável.
create or replace function can_see_lead(ws uuid, owner uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from workspace_members m where m.workspace_id = ws and m.user_id = auth.uid()
    and (not m.see_only_own or owner is null or owner = auth.uid()));
$$;
grant execute on function can_see_lead(uuid, uuid) to authenticated;

drop policy if exists leads_read on leads;
create policy leads_read on leads for select using (can_see_lead(workspace_id, owner_id));
drop policy if exists leads_write on leads;
create policy leads_write on leads for update using (is_member(workspace_id, 'member') and can_see_lead(workspace_id, owner_id))
  with check (is_member(workspace_id, 'member'));
drop policy if exists la_read on lead_activities;
create policy la_read on lead_activities for select using (is_member(workspace_id) and exists (select 1 from leads l where l.id = lead_id));

-- ---------- Campos do contato ----------
alter table leads add column if not exists custom jsonb not null default '{}'::jsonb;
alter table leads drop constraint if exists leads_custom_obj;
alter table leads add constraint leads_custom_obj check (jsonb_typeof(custom) = 'object' and pg_column_size(custom) < 8000);
alter table leads add column if not exists birthday date;
alter table leads add column if not exists first_response_at timestamptz;
alter table leads add column if not exists first_response_by uuid references auth.users on delete set null;
create index if not exists leads_waiting on leads (workspace_id, created_at) where first_response_at is null;
create index if not exists leads_birthday on leads (workspace_id, (extract(month from birthday)), (extract(day from birthday))) where birthday is not null;

alter table leads drop constraint if exists leads_capture_method_check;
alter table leads add constraint leads_capture_method_check
  check (capture_method in ('button_form', 'page_form', 'connected_form', 'direct_link', 'import', 'booking'));

-- ---------- Campos personalizados ----------
create table if not exists custom_fields (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces on delete cascade,
  key text not null check (key ~ '^[a-z0-9_]{2,30}$'),
  label text not null check (char_length(btrim(label)) between 1 and 40),
  type text not null default 'text' check (type in ('text', 'number', 'date', 'select')),
  options text[] not null default '{}' check (cardinality(options) <= 20),
  position int not null default 0,
  created_at timestamptz not null default now(),
  unique (workspace_id, key)
);
alter table custom_fields enable row level security;
drop policy if exists cf_read on custom_fields;
create policy cf_read on custom_fields for select using (is_member(workspace_id));
drop policy if exists cf_write on custom_fields;
create policy cf_write on custom_fields for all using (is_member(workspace_id, 'admin')) with check (is_member(workspace_id, 'admin'));
create or replace function guard_custom_fields() returns trigger language plpgsql as $$
begin
  if (select count(*) from custom_fields where workspace_id = new.workspace_id) >= 20 then raise exception 'limite de 20 campos'; end if;
  return new;
end $$;
drop trigger if exists custom_fields_limit on custom_fields;
create trigger custom_fields_limit before insert on custom_fields for each row execute function guard_custom_fields();

-- ---------- Tarefas ----------
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces on delete cascade,
  lead_id uuid references leads on delete cascade,
  assignee_id uuid references auth.users on delete set null,
  title text not null check (char_length(btrim(title)) between 1 and 140),
  kind text not null default 'other' check (kind in ('call', 'whatsapp', 'proposal', 'charge', 'meeting', 'followup', 'recall', 'birthday', 'other')),
  message text check (message is null or char_length(message) <= 1000),
  due_at timestamptz not null default now(),
  done_at timestamptz,
  source text not null default 'manual' check (source in ('manual', 'sequence', 'automation', 'booking', 'birthday')),
  sequence_id uuid,
  automation_id uuid,
  created_by uuid references auth.users on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists tasks_open on tasks (workspace_id, assignee_id, due_at) where done_at is null;
create index if not exists tasks_lead on tasks (lead_id);
alter table tasks enable row level security;
drop policy if exists tasks_read on tasks;
create policy tasks_read on tasks for select using (is_member(workspace_id) and (lead_id is null or exists (select 1 from leads l where l.id = lead_id)));
drop policy if exists tasks_write on tasks;
create policy tasks_write on tasks for all using (is_member(workspace_id, 'member') and (lead_id is null or exists (select 1 from leads l where l.id = lead_id)))
  with check (is_member(workspace_id, 'member') and (lead_id is null or exists (select 1 from leads l where l.id = lead_id and l.workspace_id = tasks.workspace_id)));

-- Responsável da tarefa precisa ser da conta
create or replace function guard_task() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.assignee_id is not null and not exists (select 1 from workspace_members where workspace_id = new.workspace_id and user_id = new.assignee_id) then
    raise exception 'o responsável precisa ser da equipe desta conta';
  end if;
  return new;
end $$;
drop trigger if exists tasks_guard on tasks;
create trigger tasks_guard before insert or update on tasks for each row execute function guard_task();

-- ---------- Sequências de acompanhamento ----------
create table if not exists sequences (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  steps jsonb not null check (jsonb_typeof(steps) = 'array' and jsonb_array_length(steps) between 1 and 10),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table sequences enable row level security;
drop policy if exists seq_read on sequences;
create policy seq_read on sequences for select using (is_member(workspace_id));
drop policy if exists seq_write on sequences;
create policy seq_write on sequences for all using (is_member(workspace_id, 'member')) with check (is_member(workspace_id, 'member'));

-- ---------- Produtos e negócios ----------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  price numeric(12, 2) not null default 0 check (price >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table products enable row level security;
drop policy if exists prod_read on products;
create policy prod_read on products for select using (is_member(workspace_id));
drop policy if exists prod_write on products;
create policy prod_write on products for all using (is_member(workspace_id, 'admin')) with check (is_member(workspace_id, 'admin'));

create table if not exists deals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces on delete cascade,
  lead_id uuid not null references leads on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  product_id uuid references products on delete set null,
  value numeric(12, 2) not null default 0 check (value >= 0),
  expected_close date,
  probability int not null default 50 check (probability between 0 and 100),
  status text not null default 'open' check (status in ('open', 'won', 'lost')),
  owner_id uuid references auth.users on delete set null,
  closed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists deals_ws on deals (workspace_id, status, expected_close);
create index if not exists deals_lead on deals (lead_id);
alter table deals enable row level security;
drop policy if exists deals_read on deals;
create policy deals_read on deals for select using (is_member(workspace_id) and exists (select 1 from leads l where l.id = lead_id));
drop policy if exists deals_write on deals;
create policy deals_write on deals for all using (is_member(workspace_id, 'member') and exists (select 1 from leads l where l.id = lead_id))
  with check (is_member(workspace_id, 'member') and exists (select 1 from leads l where l.id = lead_id and l.workspace_id = deals.workspace_id));

-- ---------- Vários funis ----------
create table if not exists pipelines (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 40),
  position int not null default 0,
  is_main boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index if not exists pipelines_one_main on pipelines (workspace_id) where is_main;
alter table pipelines enable row level security;
drop policy if exists pl_read on pipelines;
create policy pl_read on pipelines for select using (is_member(workspace_id));
drop policy if exists pl_write on pipelines;
create policy pl_write on pipelines for all using (is_member(workspace_id, 'admin')) with check (is_member(workspace_id, 'admin'));

insert into pipelines (workspace_id, name, position, is_main)
select id, 'Vendas', 0, true from workspaces w where not exists (select 1 from pipelines p where p.workspace_id = w.id and p.is_main);
alter table pipeline_stages add column if not exists pipeline_id uuid references pipelines on delete cascade;
update pipeline_stages s set pipeline_id = p.id from pipelines p where p.workspace_id = s.workspace_id and p.is_main and s.pipeline_id is null;

create or replace function guard_pipeline() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    if new.is_main and exists (select 1 from pipelines where workspace_id = new.workspace_id and is_main) then raise exception 'já existe o funil principal'; end if;
    if (select count(*) from pipelines where workspace_id = new.workspace_id) >= 5 then raise exception 'limite de 5 funis'; end if;
    return new;
  elsif tg_op = 'UPDATE' then
    if new.is_main is distinct from old.is_main or new.workspace_id is distinct from old.workspace_id then raise exception 'não é possível mudar o funil principal'; end if;
    return new;
  else
    if old.is_main and exists (select 1 from workspaces where id = old.workspace_id) then raise exception 'o funil principal não pode ser apagado'; end if;
    return old;
  end if;
end $$;
drop trigger if exists pipelines_guard on pipelines;
create trigger pipelines_guard before insert or update or delete on pipelines for each row execute function guard_pipeline();

-- Etapas: até 10 por funil; etapas fixas (novo, venda, não convertido) só no funil principal.
create or replace function guard_stage() returns trigger language plpgsql as $$
declare main boolean;
begin
  if tg_op = 'INSERT' then
    if new.pipeline_id is null then
      select id into new.pipeline_id from pipelines where workspace_id = new.workspace_id and is_main;
    end if;
    select is_main into main from pipelines where id = new.pipeline_id and workspace_id = new.workspace_id;
    if main is null then raise exception 'funil inválido'; end if;
    if new.kind <> 'open' and (not main or exists (select 1 from pipeline_stages where workspace_id = new.workspace_id and kind = new.kind)) then
      raise exception 'etapa fixa já existe';
    end if;
    if (select count(*) from pipeline_stages where pipeline_id = new.pipeline_id) >= 10 then
      raise exception 'limite de 10 etapas no funil';
    end if;
    return new;
  elsif tg_op = 'UPDATE' then
    if new.key is distinct from old.key or new.kind is distinct from old.kind or new.workspace_id is distinct from old.workspace_id
       or new.pipeline_id is distinct from old.pipeline_id then
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

-- Conta nova: cria o funil principal antes das etapas padrão.
create or replace function seed_stages(ws uuid) returns void language plpgsql security definer set search_path = public as $$
begin
  insert into pipelines (workspace_id, name, position, is_main)
    select ws, 'Vendas', 0, true where not exists (select 1 from pipelines where workspace_id = ws and is_main);
  insert into pipeline_stages (workspace_id, key, name, hint, position, kind) values
    (ws, 'novo', 'Novo', 'Ainda não foi atendido', 0, 'new'),
    (ws, 'em_atendimento', 'Em atendimento', 'Conversa em andamento', 1, 'open'),
    (ws, 'proposta', 'Proposta enviada', 'Orçamento ou proposta enviada', 2, 'open'),
    (ws, 'negociacao', 'Negociação', 'Ajustando condições', 3, 'open'),
    (ws, 'ganho', 'Venda concluída', 'Virou cliente', 100, 'won'),
    (ws, 'perdido', 'Não convertido', 'Desistiu ou não tinha perfil', 101, 'lost')
  on conflict (workspace_id, key) do nothing;
end $$;

-- ---------- Automações ----------
create table if not exists automations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  trigger text not null check (trigger in ('lead_created', 'lead_hot', 'stage_enter', 'stale')),
  stage_key text,
  days int not null default 3 check (days between 1 and 365),
  task_title text not null check (char_length(btrim(task_title)) between 1 and 140),
  task_kind text not null default 'followup' check (task_kind in ('call', 'whatsapp', 'proposal', 'charge', 'meeting', 'followup', 'recall', 'other')),
  task_days int not null default 0 check (task_days between 0 and 730),
  task_message text check (task_message is null or char_length(task_message) <= 1000),
  assign text not null default 'lead_owner' check (assign in ('lead_owner', 'workspace_owner')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (trigger <> 'stage_enter' or stage_key is not null)
);
alter table automations enable row level security;
drop policy if exists auto_read on automations;
create policy auto_read on automations for select using (is_member(workspace_id));
drop policy if exists auto_write on automations;
create policy auto_write on automations for all using (is_member(workspace_id, 'admin')) with check (is_member(workspace_id, 'admin'));

create or replace function automation_assignee(a automations, owner uuid) returns uuid language sql stable security definer set search_path = public as $$
  select case when a.assign = 'lead_owner' and owner is not null then owner
    else (select user_id from workspace_members where workspace_id = a.workspace_id and role = 'owner' limit 1) end;
$$;

-- Ao criar/mudar contato: encerra sequências ao fechar e roda as regras "quando → então".
create or replace function run_lead_automations() returns trigger language plpgsql security definer set search_path = public as $$
declare a automations; k text;
begin
  select kind into k from pipeline_stages where workspace_id = new.workspace_id and key = new.status;
  if tg_op = 'UPDATE' and new.status is distinct from old.status and k in ('won', 'lost') then
    delete from tasks where lead_id = new.id and source = 'sequence' and done_at is null;
  end if;
  for a in select * from automations where workspace_id = new.workspace_id and active and trigger <> 'stale' loop
    if (a.trigger = 'lead_created' and tg_op = 'INSERT' and new.capture_method is distinct from 'import')
       or (a.trigger = 'lead_hot' and new.temperature = 'quente' and (tg_op = 'INSERT' or old.temperature is distinct from 'quente'))
       or (a.trigger = 'stage_enter' and new.status = a.stage_key and (tg_op = 'INSERT' or old.status is distinct from new.status)) then
      insert into tasks (workspace_id, lead_id, assignee_id, title, kind, message, due_at, source, automation_id)
      values (new.workspace_id, new.id, automation_assignee(a, new.owner_id), a.task_title, a.task_kind, a.task_message,
              now() + make_interval(days => a.task_days), 'automation', a.id);
    end if;
  end loop;
  return new;
end $$;
drop trigger if exists leads_automations on leads;
create trigger leads_automations after insert or update of status, temperature on leads for each row execute function run_lead_automations();

-- Rotina diária: contatos parados (regra "stale") e aniversários do dia. Não repete tarefa já aberta.
create or replace function run_daily_crm() returns int language plpgsql security definer set search_path = public as $$
declare a automations; n int := 0; c int;
begin
  for a in select * from automations where active and trigger = 'stale' loop
    insert into tasks (workspace_id, lead_id, assignee_id, title, kind, message, due_at, source, automation_id)
    select l.workspace_id, l.id, automation_assignee(a, l.owner_id), a.task_title, a.task_kind, a.task_message, now(), 'automation', a.id
      from leads l join pipeline_stages s on s.workspace_id = l.workspace_id and s.key = l.status
     where l.workspace_id = a.workspace_id and s.kind in ('new', 'open') and l.updated_at < now() - make_interval(days => a.days)
       and not exists (select 1 from tasks t where t.lead_id = l.id and t.automation_id = a.id and t.done_at is null);
    get diagnostics c = row_count; n := n + c;
  end loop;
  insert into tasks (workspace_id, lead_id, assignee_id, title, kind, message, due_at, source)
  select l.workspace_id, l.id, coalesce(l.owner_id, (select user_id from workspace_members m where m.workspace_id = l.workspace_id and m.role = 'owner' limit 1)),
         'Aniversário de ' || coalesce(nullif(split_part(l.name, ' ', 1), ''), 'contato'), 'birthday',
         'Feliz aniversário' || coalesce(', ' || nullif(split_part(l.name, ' ', 1), ''), '') || '! 🎉 Desejamos um ótimo dia.', now(), 'birthday'
    from leads l
   where l.birthday is not null
     and extract(month from l.birthday) = extract(month from now() at time zone 'America/Sao_Paulo')
     and extract(day from l.birthday) = extract(day from now() at time zone 'America/Sao_Paulo')
     and not exists (select 1 from tasks t where t.lead_id = l.id and t.source = 'birthday' and t.created_at > now() - interval '300 days');
  get diagnostics c = row_count;
  return n + c;
end $$;
revoke all on function run_daily_crm() from public, anon, authenticated;
