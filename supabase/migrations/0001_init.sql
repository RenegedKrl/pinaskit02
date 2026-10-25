-- Pinas Kit v8 — migração inicial (rascunho do plano; revisar com Opus esforço alto antes de aplicar)

create table workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan_status text not null default 'trial'
    check (plan_status in ('trial','active','past_due','read_only','canceled')),
  trial_ends_at timestamptz not null default now() + interval '7 days',
  current_period_end timestamptz,
  asaas_customer_id text,
  asaas_subscription_id text,
  privacy_policy_url text,
  created_at timestamptz not null default now()
);

create table workspace_members (
  workspace_id uuid references workspaces on delete cascade,
  user_id uuid references auth.users on delete cascade,
  role text not null check (role in ('owner','admin','member','viewer')),
  primary key (workspace_id, user_id)
);

create table sites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces on delete cascade,
  domain text not null,
  unique (workspace_id, domain)
);

create table widgets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces on delete cascade,
  public_key text not null unique,
  name text not null,
  mode text not null default 'button' check (mode in ('button','form','both')),
  whatsapp_e164 text not null,
  is_active boolean not null default true,
  config jsonb not null default '{}',
  config_version int not null default 1,
  first_seen_at timestamptz,
  last_seen_at timestamptz,
  created_at timestamptz not null default now()
);

create table events (
  id bigint generated always as identity primary key,
  workspace_id uuid not null references workspaces on delete cascade,
  widget_id uuid not null references widgets on delete cascade,
  visitor_id uuid not null,
  session_id uuid,
  type text not null check (type in ('pageview','widget_view','form_view','click','form_submit','form_detected')),
  page_url text,
  referrer text,
  source_label text,
  utm jsonb,
  click_ids jsonb,
  device text,
  suspicious boolean not null default false,
  created_at timestamptz not null default now()
);
create index events_ws_created on events (workspace_id, created_at desc);
create index events_widget_type on events (widget_id, type, created_at desc);

create table leads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces on delete cascade,
  widget_id uuid references widgets on delete set null,
  visitor_id uuid,
  name text,
  phone_e164 text not null,
  email text,
  answers jsonb,
  first_touch jsonb,
  last_touch jsonb,
  source_label text,
  capture_method text check (capture_method in ('button_form','page_form','connected_form','direct_link')),
  score int not null default 0,
  temperature text not null default 'frio' check (temperature in ('frio','morno','quente')),
  status text not null default 'novo'
    check (status in ('novo','em_atendimento','proposta','negociacao','ganho','perdido')),
  owner_id uuid references auth.users,
  deal_value numeric(12,2),
  consent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, phone_e164)
);
create index leads_ws_created on leads (workspace_id, created_at desc);

create table lead_activities (
  id bigint generated always as identity primary key,
  workspace_id uuid not null references workspaces on delete cascade,
  lead_id uuid not null references leads on delete cascade,
  user_id uuid,
  type text not null,
  body jsonb,
  created_at timestamptz not null default now()
);

create table billing_events (
  provider_event_id text primary key,
  workspace_id uuid references workspaces on delete set null,
  type text not null,
  payload jsonb not null,
  processed_at timestamptz
);

create table audit_log (
  id bigint generated always as identity primary key,
  workspace_id uuid not null references workspaces on delete cascade,
  user_id uuid,
  action text not null,
  meta jsonb,
  created_at timestamptz not null default now()
);

-- RLS -----------------------------------------------------------------
create or replace function is_member(ws uuid, min_role text default 'viewer')
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from workspace_members m
    where m.workspace_id = ws and m.user_id = auth.uid()
      and case min_role
            when 'viewer' then true
            when 'member' then m.role in ('owner','admin','member')
            when 'admin'  then m.role in ('owner','admin')
            else m.role = 'owner' end
  );
$$;

alter table workspaces enable row level security;
alter table workspace_members enable row level security;
alter table sites enable row level security;
alter table widgets enable row level security;
alter table events enable row level security;
alter table leads enable row level security;
alter table lead_activities enable row level security;
alter table billing_events enable row level security; -- sem políticas: só service role
alter table audit_log enable row level security;

create policy ws_read on workspaces for select using (is_member(id));
create policy ws_update on workspaces for update using (is_member(id,'admin'));

create policy wm_read on workspace_members for select using (is_member(workspace_id));
create policy wm_write on workspace_members for all using (is_member(workspace_id,'admin')) with check (is_member(workspace_id,'admin'));

create policy sites_read on sites for select using (is_member(workspace_id));
create policy sites_write on sites for all using (is_member(workspace_id,'admin')) with check (is_member(workspace_id,'admin'));

create policy widgets_read on widgets for select using (is_member(workspace_id));
create policy widgets_write on widgets for all using (is_member(workspace_id,'member')) with check (is_member(workspace_id,'member'));

create policy events_read on events for select using (is_member(workspace_id));

create policy leads_read on leads for select using (is_member(workspace_id));
create policy leads_write on leads for update using (is_member(workspace_id,'member')) with check (is_member(workspace_id,'member'));
create policy leads_delete on leads for delete using (is_member(workspace_id,'admin'));

create policy la_read on lead_activities for select using (is_member(workspace_id));
create policy la_insert on lead_activities for insert with check (is_member(workspace_id,'member'));

create policy audit_read on audit_log for select using (is_member(workspace_id,'admin'));
