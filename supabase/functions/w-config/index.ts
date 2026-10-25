// GET /w-config?k=CHAVE → aparência e regras do widget. Nunca devolve o telefone.
import { canCapture, cors, json, widgetByKey } from "../_shared/http.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const w = await widgetByKey(new URL(req.url).searchParams.get("k"));
  if (!w || !w.is_active) return json({ ok: false }, 404);
  return json({ ok: true, mode: w.mode, capture: canCapture(w), config: w.config }, 200, {
    "cache-control": "public, max-age=60",
  });
});
