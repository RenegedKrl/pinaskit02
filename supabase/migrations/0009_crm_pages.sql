-- CRM completo (parte 2): proposta com aceite, agendamento, página da bio, pesquisa de satisfação,
-- metas da equipe, junção de repetidos e rotina diária. As páginas públicas leem pelo servidor
-- (chave de serviço) só por token/slug e nunca mostram o telefone da conta.

create or replace function new_token() returns text language sql volatile as $$
  select replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
$$;

-- ---------- Proposta com aceite ----------
create table if not exists proposals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces on delete cascade,
  lead_id uuid not null references leads on delete cascade,
  deal_id uuid references deals on delete set null,
  token text not null unique default new_token(),
  title text not null check (char_length(btrim(title)) between 1 and 120),
  items jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 30),
  discount numeric(12, 2) not null default 0 check (discount >= 0),
  total numeric(12, 2) not null default 0 check (total >= 0),
  notes text check (notes is null or char_length(notes) <= 2000),
  valid_until date,
  status text not null default 'sent' check (status in ('sent', 'viewed', 'accepted', 'declined')),
  viewed_at timestamptz,
  answered_at timestamptz,
  answer_name text check (answer_name is null or char_length(answer_name) <= 120),
  decline_reason text check (decline_reason is null or char_length(decline_reason) <= 300),
  created_by uuid references auth.users on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists proposals_lead on proposals (lead_id);
alter table proposals enable row level security;
drop policy if exists prop_read on proposals;
create policy prop_read on proposals for select using (is_member(workspace_id) and exists (select 1 from leads l where l.id = lead_id));
drop policy if exists prop_write on proposals;
create policy prop_write on proposals for all using (is_member(workspace_id, 'member') and exists (select 1 from leads l where l.id = lead_id))
  with check (is_member(workspace_id, 'member') and exists (select 1 from leads l where l.id = lead_id and l.workspace_id = proposals.workspace_id));
-- Resposta do cliente (aceite/recusa/visto) só pelo servidor
create or replace function protect_proposal() returns trigger language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') and (new.status is distinct from old.status or new.answered_at is distinct from old.answered_at
     or new.answer_name is distinct from old.answer_name or new.viewed_at is distinct from old.viewed_at or new.token is distinct from old.token) then
    raise exception 'a resposta da proposta só vem do cliente';
  end if;
  return new;
end $$;
drop trigger if exists proposals_protect on proposals;
create trigger proposals_protect before update on proposals for each row execute function protect_proposal();

-- ---------- Agendamento ----------
create table if not exists booking_pages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{2,39}$'),
  title text not null check (char_length(btrim(title)) between 1 and 80),
  description text check (description is null or char_length(description) <= 300),
  duration_min int not null default 30 check (duration_min between 10 and 240),
  days int[] not null default '{1,2,3,4,5}',
  start_time text not null default '09:00' check (start_time ~ '^([01]\d|2[0-3]):[0-5]\d$'),
  end_time text not null default '18:00' check (end_time ~ '^([01]\d|2[0-3]):[0-5]\d$'),
  window_days int not null default 14 check (window_days between 1 and 60),
  min_notice_hours int not null default 2 check (min_notice_hours between 0 and 72),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table booking_pages enable row level security;
drop policy if exists bp_read on booking_pages;
create policy bp_read on booking_pages for select using (is_member(workspace_id));
drop policy if exists bp_write on booking_pages;
create policy bp_write on booking_pages for all using (is_member(workspace_id, 'admin')) with check (is_member(workspace_id, 'admin'));

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces on delete cascade,
  page_id uuid not null references booking_pages on delete cascade,
  lead_id uuid references leads on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  phone text not null check (phone ~ '^[0-9]{10,15}$'),
  note text check (note is null or char_length(note) <= 500),
  status text not null default 'booked' check (status in ('booked', 'canceled', 'done', 'no_show')),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create unique index if not exists appointments_slot on appointments (page_id, starts_at) where status = 'booked';
alter table tasks add column if not exists appointment_id uuid references appointments on delete cascade;
create index if not exists appointments_ws on appointments (workspace_id, starts_at);
alter table appointments enable row level security;
drop policy if exists ap_read on appointments;
create policy ap_read on appointments for select using (is_member(workspace_id) and (lead_id is null or exists (select 1 from leads l where l.id = lead_id)));
drop policy if exists ap_update on appointments;
create policy ap_update on appointments for update using (is_member(workspace_id, 'member')) with check (is_member(workspace_id, 'member'));

-- ---------- Página da bio (link na bio + QR Code) ----------
create table if not exists bio_pages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{2,39}$'),
  title text not null check (char_length(btrim(title)) between 1 and 60),
  subtitle text check (subtitle is null or char_length(subtitle) <= 160),
  color text not null default '#2563eb' check (color ~ '^#[0-9a-fA-F]{6}$'),
  widget_id uuid references widgets on delete set null,
  whatsapp_label text not null default 'Falar no WhatsApp' check (char_length(whatsapp_label) between 1 and 40),
  booking_page_id uuid references booking_pages on delete set null,
  links jsonb not null default '[]'::jsonb check (jsonb_typeof(links) = 'array' and jsonb_array_length(links) <= 8),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table bio_pages enable row level security;
drop policy if exists bio_read on bio_pages;
create policy bio_read on bio_pages for select using (is_member(workspace_id));
drop policy if exists bio_write on bio_pages;
create policy bio_write on bio_pages for all using (is_member(workspace_id, 'admin')) with check (is_member(workspace_id, 'admin'));

-- ---------- Pesquisa de satisfação ----------
alter table leads add column if not exists nps_token text unique;
create table if not exists nps_responses (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces on delete cascade,
  lead_id uuid references leads on delete set null,
  score int not null check (score between 0 and 10),
  comment text check (comment is null or char_length(comment) <= 1000),
  created_at timestamptz not null default now()
);
create index if not exists nps_ws on nps_responses (workspace_id, created_at desc);
alter table nps_responses enable row level security;
drop policy if exists nps_read on nps_responses;
create policy nps_read on nps_responses for select using (is_member(workspace_id));

-- ---------- Metas da equipe ----------
create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  month date not null check (extract(day from month) = 1),
  target_revenue numeric(12, 2) not null default 0 check (target_revenue >= 0),
  target_sales int not null default 0 check (target_sales >= 0),
  unique (workspace_id, user_id, month)
);
alter table goals enable row level security;
drop policy if exists goals_read on goals;
create policy goals_read on goals for select using (is_member(workspace_id));
drop policy if exists goals_write on goals;
create policy goals_write on goals for all using (is_member(workspace_id, 'admin')) with check (is_member(workspace_id, 'admin'));

-- ---------- Juntar contatos repetidos (só dono/admin) ----------
create or replace function merge_leads(p_keep uuid, p_drop uuid) returns void language plpgsql security definer set search_path = public as $$
declare k leads; d leads;
begin
  select * into k from leads where id = p_keep;
  select * into d from leads where id = p_drop;
  if k.id is null or d.id is null or k.id = d.id or k.workspace_id <> d.workspace_id then raise exception 'contatos inválidos'; end if;
  if not is_member(k.workspace_id, 'admin') then raise exception 'sem permissão'; end if;
  update lead_activities set lead_id = k.id where lead_id = d.id;
  update tasks set lead_id = k.id where lead_id = d.id;
  update deals set lead_id = k.id where lead_id = d.id;
  update proposals set lead_id = k.id where lead_id = d.id;
  update appointments set lead_id = k.id where lead_id = d.id;
  update nps_responses set lead_id = k.id where lead_id = d.id;
  update leads set
    name = coalesce(k.name, d.name), email = coalesce(k.email, d.email),
    tags = (select coalesce(array_agg(t), '{}') from (select distinct t from unnest(k.tags || d.tags) t limit 10) x),
    custom = d.custom || k.custom, birthday = coalesce(k.birthday, d.birthday),
    deal_value = coalesce(k.deal_value, d.deal_value), score = greatest(k.score, d.score),
    first_touch = case when d.created_at < k.created_at then coalesce(d.first_touch, k.first_touch) else coalesce(k.first_touch, d.first_touch) end,
    created_at = least(k.created_at, d.created_at), owner_id = coalesce(k.owner_id, d.owner_id),
    first_response_at = least(k.first_response_at, d.first_response_at),
    updated_at = now()
  where id = k.id;
  insert into lead_activities (workspace_id, lead_id, user_id, type, body)
  values (k.workspace_id, k.id, auth.uid(), 'merge', jsonb_build_object('phone', d.phone_e164, 'name', d.name));
  delete from leads where id = d.id;
end $$;
revoke all on function merge_leads(uuid, uuid) from public, anon;
grant execute on function merge_leads(uuid, uuid) to authenticated;

-- ---------- Rotina diária (7h de Brasília = 10h UTC): contatos parados e aniversários ----------
select cron.unschedule('daily-crm') where exists (select 1 from cron.job where jobname = 'daily-crm');
select cron.schedule('daily-crm', '0 10 * * *', 'select public.run_daily_crm()');
