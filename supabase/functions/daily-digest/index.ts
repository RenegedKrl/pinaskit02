// POST /daily-digest → resumo do dia anterior por e-mail (8h de Brasília, pelo pg_cron, header x-cron-secret).
import { alertEmails, db, json } from "../_shared/http.ts";
import { dailyDigestEmail, digestWorthSending, sendEmail, type Digest } from "../_shared/email.ts";

/** Início do dia em Brasília (UTC−3, sem horário de verão desde 2019). */
function brDayStart(d: Date): Date {
  const br = new Date(d.getTime() - 3 * 3600_000);
  return new Date(Date.UTC(br.getUTCFullYear(), br.getUTCMonth(), br.getUTCDate(), 3));
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ ok: false }, 405);
  const secret = Deno.env.get("CRON_SECRET");
  if (!secret || req.headers.get("x-cron-secret") !== secret) return json({ ok: false }, 401);

  const today = brDayStart(new Date()), yesterday = new Date(today.getTime() - 86_400_000), tomorrow = new Date(today.getTime() + 86_400_000);
  const todayKey = new Date(today.getTime() - 3 * 3600_000).toISOString().slice(0, 10);
  const { data: list } = await db().from("workspaces").select("id, digest_sent_on")
    .in("plan_status", ["trial", "active", "past_due"]).limit(1000);
  const appUrl = Deno.env.get("APP_URL") || "https://pinaskit.com.br";
  let sent = 0;

  for (const ws of list ?? []) {
    if (ws.digest_sent_on === todayKey) continue;
    const [{ data: leads }, { count: followups }, { data: won }, { data: wonStages }] = await Promise.all([
      db().from("leads").select("temperature, source_label").eq("workspace_id", ws.id).gte("created_at", yesterday.toISOString()).lt("created_at", today.toISOString()).limit(5000),
      db().from("leads").select("id", { count: "exact", head: true }).eq("workspace_id", ws.id).gte("next_followup_at", today.toISOString()).lt("next_followup_at", tomorrow.toISOString()),
      db().from("lead_activities").select("body").eq("workspace_id", ws.id).eq("type", "status_change").gte("created_at", yesterday.toISOString()).lt("created_at", today.toISOString()).limit(2000),
      db().from("pipeline_stages").select("key").eq("workspace_id", ws.id).eq("kind", "won"),
    ]);
    const wonKeys = new Set((wonStages ?? []).map((s: { key: string }) => s.key));
    const wins = (won ?? []).filter((a: { body: { to?: string } }) => wonKeys.has(a.body?.to ?? ""));
    const bySource = new Map<string, number>();
    (leads ?? []).forEach((l: { source_label: string | null }) => bySource.set(l.source_label || "Acesso direto", (bySource.get(l.source_label || "Acesso direto") ?? 0) + 1));
    const d: Digest = {
      newLeads: leads?.length ?? 0,
      hot: (leads ?? []).filter((l: { temperature: string }) => l.temperature === "quente").length,
      followupsToday: followups ?? 0,
      won: wins.length,
      revenue: wins.reduce((a: number, w: { body: { deal_value?: number } }) => a + (Number(w.body?.deal_value) || 0), 0),
      topSource: [...bySource.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
    };
    if (!digestWorthSending(d)) continue;
    const to = await alertEmails(ws.id, "daily");
    if (await sendEmail(dailyDigestEmail(to, d, appUrl))) {
      await db().from("workspaces").update({ digest_sent_on: todayKey }).eq("id", ws.id);
      sent++;
    }
  }
  return json({ ok: true, sent });
});
