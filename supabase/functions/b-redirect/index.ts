// GET /b-redirect?k=CHAVE → registra o clique e abre o WhatsApp. Usado no link direto (bio, anúncios).
import { allow, BOT_UA, db, ip, widgetByKey } from "../_shared/http.ts";
import { mergeConfig, sourceLabel } from "../_shared/widget-config.ts";

Deno.serve(async (req) => {
  const u = new URL(req.url);
  const w = await widgetByKey(u.searchParams.get("k"));
  if (!w || !w.is_active) return new Response("Link inválido", { status: 404 });
  const cfg = mergeConfig(w.config);
  // Rodízio: o link direto também reveza entre os atendentes (sem fila configurada, usa o número do botão).
  let phone = w.whatsapp_e164;
  if (cfg.rotation && !BOT_UA.test(req.headers.get("user-agent") || "")) {
    const { data } = await db().rpc("next_attendant", { p_ws: w.workspace_id });
    phone = (Array.isArray(data) ? data[0] : data)?.whatsapp_e164 ?? phone;
  }
  const target = `https://wa.me/${phone}?text=${encodeURIComponent(cfg.prefill)}`;

  // src=w: clique já registrado pelo widget
  if (u.searchParams.get("src") !== "w" && !BOT_UA.test(req.headers.get("user-agent") || "") && (await allow(`br:${ip(req)}`, 60, 30))) {
    const p = u.searchParams;
    const vid = /^[0-9a-f-]{36}$/i.test(p.get("vid") || "") ? p.get("vid")! : crypto.randomUUID();
    const utm = { source: p.get("utm_source"), medium: p.get("utm_medium"), campaign: p.get("utm_campaign"), content: p.get("utm_content"), term: p.get("utm_term") };
    const referrer = req.headers.get("referer");
    // o link direto conta visualização + clique, para a taxa nunca passar de 100%
    const base = {
      workspace_id: w.workspace_id, widget_id: w.id, visitor_id: vid, page_url: null, referrer,
      source_label: sourceLabel({ utm_source: utm.source, utm_medium: utm.medium, referrer }), utm, suspicious: false,
      device: /mobi|android|iphone/i.test(req.headers.get("user-agent") || "") ? "mobile" : "desktop",
      meta: { via: "direct_link" },
    };
    const { error } = await db().from("events").insert([{ ...base, type: "widget_view" }, { ...base, type: "click" }]);
    if (error) console.error("b-redirect", error.message);
  }
  return new Response(null, { status: 302, headers: { location: target, "cache-control": "no-store" } });
});
