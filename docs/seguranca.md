# Segurança (verificada por testes, não por checklist manual)

| Regra | Teste em tests/ |
| --- | --- |
| Workspace A nunca lê/altera dados do B (RLS) | rls.test.ts: dois workspaces, leitura/edição/exclusão cruzada falha |
| Service role nunca no navegador | build.test.ts: chave ausente do bundle |
| /w/config não expõe telefone | api.test.ts |
| Anti-spam /w/lead: honeypot, ≥ 2 s, 10/IP/hora, 3/telefone/dia | api.test.ts: rajada bloqueada |
| Origin fora dos domínios do workspace = suspeito, não conta nas métricas | api.test.ts |
| Logs mascaram telefone/e-mail | logger.test.ts |
| Webhook Asaas: token + idempotência | billing.test.ts |
| Headers HSTS, CSP, X-Frame-Options no painel | e2e |

LGPD: cliente = controlador, Pinas Kit = operador. Consentimento no formulário, `PinasKitConsent=false` bloqueia pixels, exclusão por tipo de dado, exportação sempre liberada ao dono (registrada em audit_log).
Fora do MVP: criptografia por campo (só se cliente de saúde exigir). Tokens de anúncio (Fase 3) no Supabase Vault.

Rodar `npm test` antes de todo commit que mexe em banco, API pública ou pagamento.
