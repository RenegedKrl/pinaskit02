# Pagamentos (Asaas)

Plano Essencial (igual ao CentralKit): R$ 49,90/mês (MONTHLY) ou R$ 499,00/ano (YEARLY). Teste de 7 dias sem cartão. Cupom opcional via env `PINAS_COUPONS="PROMO10:10"`.

## Estados
trial → active (pagamento confirmado) → past_due (vencido; 5 dias de carência com aviso) → read_only (vê e exporta; sem captura) · canceled (capta até `current_period_end`, depois read_only). `expire_plans()` faz as viradas (pg_cron, 1x/hora).

## Checkout (`src/app/painel/assinatura`)
- Mensal/Anual · Cartão | PIX | Boleto · nome, CPF/CNPJ (validado), CEP, cupom.
- Servidor: POST /customers (ou PUT se já existe) → POST /subscriptions (nextDueDate = fim do teste se ainda em teste, senão hoje) → redireciona para `invoiceUrl` da 1ª cobrança. A página do Asaas recebe cartão/PIX/boleto: nunca tocamos em dado de cartão.
- Faturas: GET /subscriptions/{id}/payments. Cancelar: DELETE /subscriptions/{id} (só o dono).
- Grava asaas_customer_id/subscription_id com `supabaseAdmin()` (service role). O gatilho `protect_billing` impede o navegador de mexer nesses campos.

## Webhook (`supabase/functions/asaas-webhook`)
- Header `asaas-access-token` = ASAAS_WEBHOOK_TOKEN; sem token → 401.
- billing_events por id do evento (idempotente).
- PAYMENT_CONFIRMED / PAYMENT_RECEIVED → active + current_period_end; PAYMENT_OVERDUE → past_due; SUBSCRIPTION_DELETED/INACTIVATED → canceled.
- Testar tudo no sandbox antes de produção.
