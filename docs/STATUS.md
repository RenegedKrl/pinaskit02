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
3. ~~Ponta a ponta~~ ok 24/10: conta → botão+formulário → `public/teste/` (utm google/cpc) → lead em Contatos como "Google Ads". Dados de teste apagados 25/10 (contatos, botão, public/teste); contas mantidas. ATENÇÃO: a limpeza apagou também o botão real 9z2g4gmasf (site BRUNA-COACH): recriar e trocar o data-pk lá
4. ~~Asaas sandbox~~ ok 24/10: assinar → PAYMENT_RECEIVED → active; cancelar → SUBSCRIPTION_DELETED → canceled. Webhook precisa do evento PAYMENT_RECEIVED (PIX/boleto). No .env.local a chave Asaas vai escapada como `\$aact...`. Cancelar no teste mantém acesso até o fim do teste (`_shared/billing.ts`, testes em tests/billing.test.ts)
5. E-mails: código pronto 24/10 (`_shared/email.ts`, aviso de novo contato no w-lead, função `trial-reminder` + migração 0003, testes). Chave Resend já no Supabase. Falta: testar chegada do e-mail (adiado; Resend de teste só envia p/ kaue.kfd@gmail.com), domínio verificado . Cron ok (0004): expire-plans 1x/h e trial-reminder 9h, segredos no Vault (cron_secret, project_url); chamada manual → 200. Auth do Supabase: limite de ~2 e-mails/h no SMTP padrão → configurar SMTP do Resend (Auth → SMTP) junto com o domínio
6. ~~Vercel~~ no ar 24/10: https://pinaskit.vercel.app (GitHub RenegedKrl/pinas_kit, main). APP_URL/APP_ORIGIN_HOST das funções apontam para lá. URLs do Auth ok. Login Google ok e publicado (Em produção, sem logo/verificação de marca). Widget publicado testado 25/10: pinaskit.vercel.app/w.js → lead "Instagram"/teste-producao no banco. Falta: domínio próprio, Asaas de produção. Código de instalação nunca usa localhost (fallback https://pinaskit.vercel.app). Ícone do botão = logo oficial do WhatsApp (w.js 7,0 KB). "Instalado" agora também é marcado pelo w-config (eventos via sendBeacon são barrados pelo Brave/bloqueadores); tests/install.test.ts

7. ~~Contatos + tema~~ 25/10: filtro por ponto de contato, etapa editável na lista, jornada do visitante na ficha (`components/contatos/`), tema claro/escuro (token `card`, `.dark` em globals.css, botão no menu e na landing)

8. 25/10: botões de etapa da ficha corrigidos (um form por etapa) e logo oficial do WhatsApp no "Abrir no WhatsApp" (`WhatsAppIcon` em ui.tsx). Próximo: telas de carregamento/erro, adaptar tests/rls.sql a banco com dados

8. ~~Checklist seção 11~~ 25/10: telas de carregamento (painel/loading), erro (painel/error, app/error) e não encontrado (not-found). Etapa agora muda na hora (componentes cliente + router.refresh). Falta: adaptar tests/rls.sql a banco com dados, WordPress/Wix, anual/cartão, simular fim do teste

9. ~~Funil editável + design + tutorial~~ 25/10: etapas por conta (0005_stages, máx 10, novo/ganho/perdido fixas, delete_stage move contatos), funil com arrastar, busca e filtros (components/funil), design azul profissional (Inter), tour guiado de 12 passos (escurece a tela, destaca o ponto, balão com seta, segue as páginas; 1ª visita ou botão Tutorial) e boas-vindas única ao ativar a assinatura. tests/rls.sql agora roda em banco com dados: RLS OK

10. ~~Logo~~ 25/10: nome "pinas" com pingo do i em balão + "kit" itálico (Instrument Serif) no menu/site; ícone da guia = monograma PK com estrela amarela (components/logo.tsx, app/icon.svg, public/brand/pinas-kit-icone.svg)

## Decisões
- Um plano: R$ 49,90/mês ou R$ 499/ano, 7 dias grátis sem cartão. Asaas apenas.
- Fora do MVP: OAuth Meta/Google, CAPI, testes A/B, IA, criptografia por campo, inbox de conversas.

## Pendências do dono
- Asaas PRODUÇÃO ligado 24/10 (conta pessoa física): chave no .env.local e no Supabase; Vercel trocada e webhook de produção conferido (5 eventos). Falta: teste de cobrança real (adiado), trocar a chave (vazou no chat), confirmar webhook do sandbox desligado. Contas criadas no sandbox (poguerio9) têm IDs que não existem em produção · domínio do Pinas Kit · apagar teste no CentralKit · mover MOVER-PARA-.claude-settings.json para .claude/settings.json
