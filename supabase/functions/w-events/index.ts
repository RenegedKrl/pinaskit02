// POST /w-events → eventos em lote (pageview, widget_view, form_view, click, form_detected).
import { allow, BOT_UA, cors, db, ip, json, originAllowed, widgetByKey } from "../_shared/http.ts";
import { sourceLabel } from "../_shared/widget-config.ts";

const TYPES = new Set(["pageview", "widget_view", "form_view", "click", "form_detected"]);
const UUID = /^[0-9a-f-]{36}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ ok: false }, 405);
  const raw = await req.text();
  if (raw.length > 20_000) return json({ ok: false }, 413);
  if (BOT_UA.test(req.headers.get("user-agent") || "")) return json({ ok: true });
  if (!(await allow(`ev:${ip(req)}`, 60, 120))) return json({ ok: false }, 429);

  let b: any;
  try { b = JSON.parse(raw); } catch { return json({ ok: false }, 400); }
  if (!UUID.test(b?.vid || "") || !Array.isArray(b?.events)) return json({ ok: false }, 400);
  const w = await widgetByKey(b.k);
  if (!w) return json({ ok: false }, 404);

  const suspicious = !(await originAllowed(req, w.workspace_id));
  const last = b.attr?.last ?? {};
  const label = sourceLabel({ ...last, referrer: last.referrer ?? null });
  const utm = { source: last.utm_source, medium: last.utm_medium, campaign: last.utm_campaign, content: last.utm_content, term: last.utm_term };
  const device = /mobi|android|iphone/i.test(req.headers.get("user-agent") || "") ? "mobile" : "desktop";

  const rows = b.events.slice(0, 25).filter((e: any) => TYPES.has(e?.type)).map((e: any) => ({
    workspace_id: w.workspace_id, widget_id: w.id, visitor_id: b.vid,
    session_id: UUID.test(b.sid || "") ? b.sid : null, type: e.type,
    page_url: String(e.url || "").slice(0, 500), referrer: String(b.ref || "").slice(0, 500) || null,
    source_label: label, utm, click_ids: last.click_ids ?? null, device, suspicious,
    meta: e.meta && typeof e.meta === "object" ? e.meta : null,
  }));
  if (rows.length) {
    const { error } = await db().from("events").insert(rows);
    if (error) console.error("events", error.message);
  }
  if (!suspicious && rows.some((r: any) => r.type === "widget_view" || r.type === "pageview")) {
    const now = new Date().toISOString();
    await db().from("widgets").update(w.first_seen_at ? { last_seen_at: now } : { first_seen_at: now, last_seen_at: now }).eq("id", w.id);
  }
  return json({ ok: true });
});
