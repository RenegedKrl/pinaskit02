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

11. ~~Opção 2 + acabamento~~ 25/10: relatórios por origem/campanha/anúncio (0006, report_by_source), responsável, etiquetas, lembrete de retorno (Início + sininho), mensagens prontas (Configurações), sininho; /ajuda pública + botão de suporte (NEXT_PUBLIC_SUPPORT_WHATSAPP, sem número → leva à ajuda); landing nova com ilustrações; e2e com marcação de WordPress, Elementor e Wix (12 ok). Visual: menu escuro, largura total, fontes +6%, gráfico de área e rosca no Início

12. ~~Períodos~~ 25/10: mensal R$ 49,90, trimestral R$ 139,90 (-7%), semestral R$ 269,90 (-10%), anual R$ 499 (-17%) — CYCLES em lib/plan.ts; seletor na landing e 4 opções na Assinatura (Asaas QUARTERLY/SEMIANNUALLY). Suporte: NEXT_PUBLIC_SUPPORT_WHATSAPP=5511934726972 (na Vercel ainda não entrou no build)

13. ~~Landing estilo Kommo~~ 25/10: hero centralizado com ícones de canais → WhatsApp, vitrine com abas (Capte/Organize/Atenda/Analise, components/landing/showcase.tsx), bento colorido, preços com períodos, CTA escuro e rodapé em colunas. Sem logos/depoimentos inventados
14. ~~Painel estilo Livento~~ 25/10: menu lateral trocado por barra no topo (components/painel/topbar.tsx) com abas em pílula, avisos/ajuda redondos e menu da conta (assinatura, suporte, tema, sair); cards mais arredondados
16. ~~Escolha de layout~~ 25/10: Configurações › Aparência do painel (layout-picker.tsx) alterna menu no topo / lateral; fica no cookie pk-layout (por navegador), lido no layout do painel
15. ~~Velocidade~~ 25/10: Vercel (iad1) e Supabase (us-east-1) na mesma região — não mudar só um. Consultas de Contatos e ficha em paralelo; getSession usa getClaims (sem 2ª ida ao Auth). Contatos ~2,2 s → ~0,9 s no teste local

17. ~~Fase 2 (repo pinaskit02, pasta Pinas Kit 02)~~ 26/10: migração 0007 — motivo da perda + janela de valor/motivo ao fechar no funil e relatório de motivos; avisos por pessoa + resumo diário (função daily-digest, cron 11h UTC); pixels Meta/GA4/Ads/GTM, horário de atendimento e mapa de campos no widget; rodízio (next_attendant); webhook assinado + Planilhas; importar CSV; /painel/admin (SUPERADMIN_EMAILS, MRR do Asaas); e-mail dia 2 sem instalação + fim do teste no dia 6

## Decisões
- Um plano em 4 períodos (mensal, trimestral, semestral, anual), 7 dias grátis sem cartão. Asaas apenas.
- Fora do MVP: OAuth Meta/Google, CAPI, testes A/B, IA, criptografia por campo, inbox de conversas.

## Pendências do dono
- Asaas PRODUÇÃO ligado 24/10 (conta pessoa física): chave no .env.local e no Supabase; Vercel trocada e webhook de produção conferido (5 eventos). Falta: teste de cobrança real (adiado), trocar a chave (vazou no chat), confirmar webhook do sandbox desligado. Contas criadas no sandbox (poguerio9) têm IDs que não existem em produção · domínio do Pinas Kit · apagar teste no CentralKit · mover MOVER-PARA-.claude-settings.json para .claude/settings.json
