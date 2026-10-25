# STATUS (máx. ~60 linhas; a IA atualiza ao fim de cada tarefa)

## Fase atual
Fase 1 — código do MVP escrito. Falta: subir no Supabase/Vercel e testar com dados reais.

## Pronto (24/10)
- Banco: 0001 + 0002 (RLS, convites, limites, métricas, expirar plano, proteção de cobrança). `tests/rls.sql` passando.
- API pública: w-config, w-events, w-lead, b-redirect, asaas-webhook (`supabase/functions`).
- Widget `public/w.js` (6,6 KB gzip): botão, formulário antes do rodapé, ambos, conectar formulário existente. `npm run e2e` (7 cenários) passando.
- Painel: login (e-mail/Google), Início, Captação (editor, prévia, instalação, links UTM), Contatos (filtros, detalhe, exportar), Funil, Configurações (sites, equipe, apagar dados), Assinatura (Asaas).
- Landing, Termos e Privacidade (modelos: preencher dados da empresa).

## Próximas tarefas (em ordem)
1. ~~TypeScript~~ feito 24/10: `tsc` sem erros (tipos de cookies + `applyFilters` genérico); landing e /entrar abrem no `npm run dev`
2. ~~Supabase~~ feito 24/10: projeto qdpwawkeiyvggcfonfsa vinculado, 0001+0002 aplicadas, 5 funções publicadas, .env.local criado. Falta: `supabase secrets set` (Asaas, APP_ORIGIN_HOST)
3. ~~Ponta a ponta~~ ok 24/10: conta → botão+formulário → `public/teste/` (utm google/cpc) → lead em Contatos como "Google Ads". Contato de teste no banco: apagar depois
4. ~~Asaas sandbox~~ ok 24/10: assinar → PAYMENT_RECEIVED → active; cancelar → SUBSCRIPTION_DELETED → canceled. Webhook precisa do evento PAYMENT_RECEIVED (PIX/boleto). No .env.local a chave Asaas vai escapada como `\$aact...`. Revisar: cancelada sem current_period_end
5. E-mails: código pronto 24/10 (`_shared/email.ts`, aviso de novo contato no w-lead, função `trial-reminder` + migração 0003, testes). Chave Resend já no Supabase. Falta: testar chegada do e-mail (adiado; Resend de teste só envia p/ kaue.kfd@gmail.com), domínio verificado . Cron ok (0004): expire-plans 1x/h e trial-reminder 9h, segredos no Vault (cron_secret, project_url); chamada manual → 200. Auth do Supabase: limite de ~2 e-mails/h no SMTP padrão → configurar SMTP do Resend (Auth → SMTP) junto com o domínio
6. ~~Vercel~~ no ar 24/10: https://pinaskit.vercel.app (GitHub RenegedKrl/pinas_kit, main). APP_URL/APP_ORIGIN_HOST das funções apontam para lá. Falta: URLs no Supabase Auth, domínio próprio, Asaas de produção

## Decisões
- Um plano: R$ 49,90/mês ou R$ 499/ano, 7 dias grátis sem cartão. Asaas apenas.
- Fora do MVP: OAuth Meta/Google, CAPI, testes A/B, IA, criptografia por campo, inbox de conversas.

## Pendências do dono
- Conta Asaas com CNPJ · domínio do Pinas Kit · apagar teste no CentralKit · mover MOVER-PARA-.claude-settings.json para .claude/settings.json
