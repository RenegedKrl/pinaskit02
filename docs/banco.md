# Banco (Supabase Postgres)

Tabelas: workspaces, workspace_members, sites, widgets, events, leads, lead_activities, billing_events, audit_log. SQL completo em `supabase/migrations/0001_init.sql` (rascunho com RLS; revisar antes de aplicar).

## Pontos-chave
- workspaces.plan_status: trial | active | past_due | read_only | canceled; trial_ends_at = now() + 7 dias.
- widgets: public_key único (vai no script), mode button|form|both, whatsapp_e164 (só servidor), config jsonb + config_version, first_seen_at/last_seen_at (instalação detectada).
- events: bigint identity; índices (workspace_id, created_at desc) e (widget_id, type, created_at desc).
- leads: unique (workspace_id, phone_e164); first_touch/last_touch jsonb; capture_method button_form|page_form|connected_form|direct_link; status novo|em_atendimento|proposta|negociacao|ganho|perdido.
- billing_events.provider_event_id = PK (idempotência).

## RLS
- Função `is_member(ws uuid)` (security definer) checa workspace_members com auth.uid().
- select/insert/update/delete para membros; viewer só select; owner/admin gerenciam membros e plano.
- Edge Functions públicas usam service role e são o ÚNICO caminho de escrita vindo de sites.

## Fases futuras
Fase 2: deals, pipeline_stages, products, deal_items, webhooks. Fase 3: ad_integrations (tokens no Supabase Vault), ad_campaign_stats.
