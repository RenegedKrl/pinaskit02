-- CRM: etiquetas, lembrete de retorno, responsável, mensagens prontas, avisos (sininho) e relatório por origem.

-- Etiquetas e lembrete de retorno no contato (o responsável usa a coluna owner_id, que já existia)
alter table leads add column if not exists tags text[] not null default '{}';
alter table leads add column if not exists next_followup_at timestamptz;
alter table leads add column if not exists followup_note text check (followup_note is null or char_length(followup_note) <= 200);
alter table leads drop constraint if exists leads_tags_limit;
alter table leads add constraint leads_tags_limit check (cardinality(tags) <= 10);
create index if not exists leads_tags on leads using gin (tags);
create index if not exists leads_followup on leads (workspace_id, next_followup_at) where next_followup_at is not null;

-- Responsável precisa ser da mesma conta
create or replace function guard_lead_owner() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.owner_id is not null and new.owner_id is distinct from old.owner_id
     and not exists (select 1 from workspace_members where workspace_id = new.workspace_id and user_id = new.owner_id) then
    raise exception 'o responsável precisa ser da equipe desta conta';
  end if;
  return new;
end $$;
drop trigger if exists leads_guard_owner on leads;
create trigger leads_guard_owner before update on leads for each row execute function guard_lead_owner();

-- Mensagens prontas de WhatsApp (por conta)
create table if not exists message_templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 40),
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists message_templates_ws on message_templates (workspace_id, name);
alter table message_templates enable row level security;
drop policy if exists mt_read on message_templates;
create policy mt_read on message_templates for select using (is_member(workspace_id));
drop policy if exists mt_write on message_templates;
create policy mt_write on message_templates for all using (is_member(workspace_id, 'member')) with check (is_member(workspace_id, 'member'));

-- Sininho: cada pessoa da equipe marca até quando já viu os avisos
alter table workspace_members add column if not exists notifications_seen_at timestamptz not null default now();
create or replace function mark_notifications_seen() returns void language sql security definer set search_path = public as $$
  update workspace_members set notifications_seen_at = now() where user_id = auth.uid();
$$;
revoke all on function mark_notifications_seen() from public, anon;
grant execute on function mark_notifications_seen() to authenticated;

-- Relatório de vendas por origem. Roda com as permissões de quem chama (RLS vale).
-- p_group: 'origem' | 'campanha' | 'anuncio'. Filtros opcionais para descer de origem → campanha → anúncio.
create or replace function report_by_source(p_ws uuid, p_from timestamptz, p_group text default 'origem',
  p_source text default null, p_campaign text default null)
returns table (label text, leads bigint, open bigint, won bigint, lost bigint, revenue numeric)
language sql stable security invoker set search_path = public as $$
  with base as (
    select coalesce(nullif(l.source_label, ''), 'Acesso direto') as origem,
           coalesce(nullif(l.last_touch->>'utm_campaign', ''), nullif(l.first_touch->>'utm_campaign', ''), '(sem campanha)') as campanha,
           coalesce(nullif(l.last_touch->>'utm_content', ''), nullif(l.first_touch->>'utm_content', ''), '(sem anúncio)') as anuncio,
           coalesce(s.kind, 'open') as kind, l.deal_value
      from leads l
      left join pipeline_stages s on s.workspace_id = l.workspace_id and s.key = l.status
     where l.workspace_id = p_ws and l.created_at >= p_from
  )
  select case p_group when 'campanha' then campanha when 'anuncio' then anuncio else origem end,
         count(*),
         count(*) filter (where kind in ('new', 'open')),
         count(*) filter (where kind = 'won'),
         count(*) filter (where kind = 'lost'),
         coalesce(sum(deal_value) filter (where kind = 'won'), 0)
    from base
   where (p_source is null or origem = p_source) and (p_campaign is null or campanha = p_campaign)
   group by 1
   order by 4 desc, 2 desc;
$$;
grant execute on function report_by_source(uuid, timestamptz, text, text, text) to authenticated;
