// POST /asaas-webhook → atualiza o plano do workspace. Configure no Asaas: URL desta função +
// token de autenticação igual a ASAAS_WEBHOOK_TOKEN. Só este webhook muda plan_status.
import { db, json } from "../_shared/http.ts";
import { accessUntilOnCancel } from "../_shared/billing.ts";

const ASAAS = Deno.env.get("ASAAS_BASE_URL") || "https://api-sandbox.asaas.com/v3";

async function nextDue(subscriptionId: string): Promise<string | null> {
  const r = await fetch(`${ASAAS}/subscriptions/${subscriptionId}`, {
    headers: { access_token: Deno.env.get("ASAAS_API_KEY")! },
  });
  if (!r.ok) return null;
  const s = await r.json();
  return s.nextDueDate ? new Date(s.nextDueDate + "T23:59:59-03:00").toISOString() : null;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ ok: false }, 405);
  const token = Deno.env.get("ASAAS_WEBHOOK_TOKEN");
  if (!token || req.headers.get("asaas-access-token") !== token) return json({ ok: false }, 401);

  const ev = await req.json().catch(() => null);
  if (!ev?.id || !ev?.event) return json({ ok: false }, 400);

  // idempotência: o mesmo evento só é processado uma vez
  const { error: dup } = await db().from("billing_events").insert({ provider_event_id: ev.id, type: ev.event, payload: ev });
  if (dup) return json({ ok: true, duplicate: true });

  const sub: string | undefined = ev.payment?.subscription ?? ev.subscription?.id;
  const customer: string | undefined = ev.payment?.customer ?? ev.subscription?.customer;
  let q = db().from("workspaces").select("id, current_period_end, trial_ends_at");
  q = sub ? q.eq("asaas_subscription_id", sub) : q.eq("asaas_customer_id", customer ?? "-");
  const { data: ws } = await q.maybeSingle();
  if (!ws) return json({ ok: true, ignored: true });

  let patch: Record<string, unknown> | null = null;
  switch (ev.event) {
    case "PAYMENT_CONFIRMED":
    case "PAYMENT_RECEIVED":
      patch = { plan_status: "active", current_period_end: sub ? await nextDue(sub) : null };
      break;
    case "PAYMENT_OVERDUE":
      patch = { plan_status: "past_due" };
      break;
    case "SUBSCRIPTION_DELETED":
    case "SUBSCRIPTION_INACTIVATED":
      // quem cancela durante o teste mantém o acesso até o fim do teste (ou do período pago)
      patch = { plan_status: "canceled", current_period_end: accessUntilOnCancel(ws.current_period_end, ws.trial_ends_at) };
      break;
  }
  if (patch) await db().from("workspaces").update(patch).eq("id", ws.id);
  await db().from("billing_events").update({ workspace_id: ws.id, processed_at: new Date().toISOString() }).eq("provider_event_id", ev.id);
  return json({ ok: true });
});
