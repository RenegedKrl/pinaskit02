// POST /trial-reminder → avisa por e-mail quem tem o teste grátis acabando em até 2 dias (1 vez por conta).
// Chamado pelo pg_cron 1x por dia com o header x-cron-secret = CRON_SECRET.
import { adminEmails, db, json } from "../_shared/http.ts";
import { sendEmail, trialEndingEmail } from "../_shared/email.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ ok: false }, 405);
  const secret = Deno.env.get("CRON_SECRET");
  if (!secret || req.headers.get("x-cron-secret") !== secret) return json({ ok: false }, 401);

  const now = new Date();
  const until = new Date(now.getTime() + 2 * 86_400_000).toISOString();
  const { data: list, error } = await db().from("workspaces").select("id, trial_ends_at")
    .eq("plan_status", "trial").is("trial_reminder_sent_at", null)
    .gt("trial_ends_at", now.toISOString()).lte("trial_ends_at", until).limit(200);
  if (error) { console.error("trial-reminder", error.message); return json({ ok: false }, 500); }

  const appUrl = Deno.env.get("APP_URL") || "https://pinaskit.com.br";
  let sent = 0;
  for (const ws of list ?? []) {
    const to = await adminEmails(ws.id);
    if (await sendEmail(trialEndingEmail(to, new Date(ws.trial_ends_at), appUrl, now))) {
      await db().from("workspaces").update({ trial_reminder_sent_at: now.toISOString() }).eq("id", ws.id);
      sent++;
    }
  }
  return json({ ok: true, found: list?.length ?? 0, sent });
});
