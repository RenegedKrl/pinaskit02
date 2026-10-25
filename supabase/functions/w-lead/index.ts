// POST /w-lead → cria ou atualiza o contato e devolve a ação (abrir WhatsApp, mensagem ou redirecionar).
import { adminEmails, allow, BOT_UA, canCapture, cors, db, ip, json, mask, originAllowed, widgetByKey } from "../_shared/http.ts";
import { newLeadEmail, sendEmail } from "../_shared/email.ts";
import { isPaid, mergeConfig, renderTemplate, score, sourceLabel } from "../_shared/widget-config.ts";

const UUID = /^[0-9a-f-]{36}$/i;
const METHODS = new Set(["button_form", "page_form", "connected_form"]);
const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ ok: false }, 405);
  let b: any;
  try { b = await req.json(); } catch { return json({ ok: false, error: "json" }, 400); }

  const w = await widgetByKey(b?.k);
  if (!w || !w.is_active) return json({ ok: false, error: "widget" }, 404);
  const cfg = mergeConfig(w.config);
  const fake = { ok: true, action: { type: "message", message: cfg.after.message } };

  // anti-spam: honeypot e envio rápido demais recebem resposta falsa de sucesso
  if (str(b.hp, 50) || (b.method !== "connected_form" && Number(b.t) < 2000)) return json(fake);
  if (!canCapture(w)) return json({ ok: false, error: "plano" }, 402);
  if (!(await originAllowed(req, w.workspace_id))) return json({ ok: false, error: "origem" }, 403);
  if (!(await allow(`ld:${ip(req)}`, 3600, 10))) return json({ ok: false, error: "limite" }, 429);

  const phone = str(b.phone, 20).replace(/\D/g, "");
  if (phone.length < 10 || phone.length > 15) return json({ ok: false, error: "telefone" }, 400);
  if (!(await allow(`lp:${w.id}:${phone}`, 86400, 3))) return json({ ok: false, error: "limite" }, 429);
  const email = str(b.email, 200);
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ ok: false, error: "email" }, 400);

  const name = str(b.name, 120);
  const option = str(b.option, 200);
  const message = str(b.message, 2000);
  const method = METHODS.has(b.method) ? b.method : "page_form";
  const vid = UUID.test(b.vid || "") ? b.vid : null;
  const first = b.attr?.first ?? null;
  const last = b.attr?.last ?? null;
  const label = sourceLabel({ ...(last ?? {}), referrer: last?.referrer ?? null });

  // jornada do visitante: páginas vistas e dias de retorno
  let pages = 1, returnDays = 0;
  if (vid) {
    const { data } = await db().from("events").select("created_at").eq("workspace_id", w.workspace_id)
      .eq("visitor_id", vid).eq("type", "pageview").limit(500);
    if (data?.length) {
      pages = data.length;
      returnDays = new Set(data.map((e: { created_at: string }) => e.created_at.slice(0, 10))).size - 1;
    }
  }
  const opt = cfg.form.question.options.find((o) => o.label === option);
  const { data: ws } = await db().from("workspaces").select("score_rules").eq("id", w.workspace_id).single();
  const sc = score({
    hasEmail: !!email, paid: isPaid(label), pages, returnDays, optionPoints: opt?.points ?? 0,
    bot: BOT_UA.test(req.headers.get("user-agent") || ""),
  }, ws?.score_rules ?? undefined);

  const answers = { option: option || null, message: message || null };
  const { data: existing } = await db().from("leads").select("id, email, name")
    .eq("workspace_id", w.workspace_id).eq("phone_e164", phone).maybeSingle();

  let leadId: string;
  if (existing) {
    leadId = existing.id;
    const { error } = await db().from("leads").update({
      name: name || existing.name, email: email || existing.email, answers, last_touch: last, source_label: label,
      score: sc.score, temperature: sc.temperature, updated_at: new Date().toISOString(),
    }).eq("id", leadId);
    if (error) { console.error("lead update", mask(error.message)); return json({ ok: false, error: "db" }, 500); }
  } else {
    const { data, error } = await db().from("leads").insert({
      workspace_id: w.workspace_id, widget_id: w.id, visitor_id: vid, name: name || null, phone_e164: phone,
      email: email || null, answers, first_touch: first, last_touch: last, source_label: label, capture_method: method,
      score: sc.score, temperature: sc.temperature, consent_at: b.consent ? new Date().toISOString() : null,
    }).select("id").single();
    if (error || !data) { console.error("lead insert", mask(error?.message || "")); return json({ ok: false, error: "db" }, 500); }
    leadId = data.id;
    // aviso por e-mail só para contato novo; roda depois da resposta para não atrasar o visitante
    const notify = adminEmails(w.workspace_id).then((to) => sendEmail(newLeadEmail(to, {
      name: name || null, phone, source: label, option: option || null, message: message || null, leadId,
    }, Deno.env.get("APP_URL") || "https://pinaskit.com.br"))).catch((e) => console.error("email lead", e));
    // @ts-ignore EdgeRuntime existe no Supabase
    globalThis.EdgeRuntime?.waitUntil?.(notify);
  }

  await db().from("lead_activities").insert({
    workspace_id: w.workspace_id, lead_id: leadId, type: "form_submit",
    body: { method, url: str(b.url, 500), option: option || null, source: label },
  });
  if (vid) {
    await db().from("events").insert({
      workspace_id: w.workspace_id, widget_id: w.id, visitor_id: vid, type: "form_submit",
      page_url: str(b.url, 500), source_label: label, suspicious: false, meta: { method },
    });
  }

  if (cfg.after.type === "message") return json({ ok: true, action: { type: "message", message: cfg.after.message } });
  if (cfg.after.type === "redirect" && /^https?:\/\//.test(cfg.after.url)) return json({ ok: true, action: { type: "redirect", url: cfg.after.url } });
  const text = renderTemplate(cfg.template, { nome: name, opcao: option, mensagem: message });
  return json({ ok: true, action: { type: "whatsapp", url: `https://wa.me/${w.whatsapp_e164}?text=${encodeURIComponent(text)}` } });
});
