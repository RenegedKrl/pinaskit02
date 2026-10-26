// POST /trial-reminder → e-mails do teste grátis (1x por dia, pelo pg_cron, header x-cron-secret = CRON_SECRET):
// • dia 2 sem instalação: "falta só um passo" · • dia 6: "seu teste termina amanhã". Cada um 1 vez por conta.
import { adminEmails, db, json } from "../_shared/http.ts";
import { installNudgeEmail, sendEmail, trialEndingEmail } from "../_shared/email.ts";
import { TRIAL_DAYS, nudgeDue } from "../_shared/trial.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ ok: false }, 405);
  const secret = Deno.env.get("CRON_SECRET");
  if (!secret || req.headers.get("x-cron-secret") !== secret) return json({ ok: false }, 401);

  const now = new Date();
  const appUrl = Deno.env.get("APP_URL") || "https://pinaskit.com.br";
  let ending = 0, nudges = 0;

  // Dia 6: termina em até 36 h
  const until = new Date(now.getTime() + 36 * 3600_000).toISOString();
  const { data: list, error } = await db().from("workspaces").select("id, trial_ends_at")
    .eq("plan_status", "trial").is("trial_reminder_sent_at", null)
    .gt("trial_ends_at", now.toISOString()).lte("trial_ends_at", until).limit(200);
  if (error) { console.error("trial-reminder", error.message); return json({ ok: false }, 500); }
  for (const ws of list ?? []) {
    if (await sendEmail(trialEndingEmail(await adminEmails(ws.id), new Date(ws.trial_ends_at), appUrl, now))) {
      await db().from("workspaces").update({ trial_reminder_sent_at: now.toISOString() }).eq("id", ws.id);
      ending++;
    }
  }

  // Dia 2: teste com 2+ dias de uso e nenhum botão detectado no site
  const startedBefore = new Date(now.getTime() + (TRIAL_DAYS - 2) * 86_400_000).toISOString();
  const { data: young } = await db().from("workspaces").select("id, trial_ends_at, widgets(first_seen_at)")
    .eq("plan_status", "trial").is("install_nudge_sent_at", null)
    .gt("trial_ends_at", now.toISOString()).lte("trial_ends_at", startedBefore).limit(200);
  for (const ws of young ?? []) {
    const installed = (ws.widgets ?? []).some((w: { first_seen_at: string | null }) => !!w.first_seen_at);
    if (!nudgeDue(new Date(ws.trial_ends_at), installed, now)) continue;
    if (await sendEmail(installNudgeEmail(await adminEmails(ws.id), appUrl))) {
      await db().from("workspaces").update({ install_nudge_sent_at: now.toISOString() }).eq("id", ws.id);
      nudges++;
    }
  }
  return json({ ok: true, ending, nudges });
});
