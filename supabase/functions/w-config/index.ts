// GET /w-config?k=CHAVE → aparência e regras do widget. Nunca devolve o telefone.
// Também marca o widget como "instalado": esta chamada sempre acontece quando o script carrega,
// ao contrário dos eventos (sendBeacon), que bloqueadores como o Brave Shields costumam barrar.
import { canCapture, cors, db, json, originAllowed, widgetByKey } from "../_shared/http.ts";
import { countsAsInstall } from "../_shared/install.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const w = await widgetByKey(new URL(req.url).searchParams.get("k"));
  if (!w || !w.is_active) return json({ ok: false }, 404);

  const origin = req.headers.get("origin") || req.headers.get("referer");
  if (!w.first_seen_at && countsAsInstall(origin, Deno.env.get("APP_ORIGIN_HOST") ?? null)) {
    const mark = originAllowed(req, w.workspace_id).then((ok) => {
      if (!ok) return;
      const now = new Date().toISOString();
      return db().from("widgets").update({ first_seen_at: now, last_seen_at: now }).eq("id", w.id).is("first_seen_at", null);
    }).catch((e) => console.error("w-config install", e));
    // @ts-ignore EdgeRuntime existe no Supabase
    globalThis.EdgeRuntime?.waitUntil?.(mark);
  }

  return json({ ok: true, mode: w.mode, capture: canCapture(w), config: w.config }, 200, {
    "cache-control": "public, max-age=60",
  });
});
