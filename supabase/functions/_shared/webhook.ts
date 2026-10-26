// Webhook de contato novo (Zapier, Make, RD Station, Google Planilhas). Partes puras testadas em tests/growth.test.ts.

export interface LeadPayload {
  event: "lead.created"; id: string; created_at: string;
  name: string | null; phone: string; email: string | null; source: string;
  utm: { source: string | null; medium: string | null; campaign: string | null; content: string | null; term: string | null };
  answer: string | null; message: string | null; temperature: string; score: number; widget: string | null; attendant: string | null;
}

type Touch = Record<string, unknown> | null | undefined;
const s = (v: unknown) => (typeof v === "string" && v ? v : null);

export function leadPayload(l: {
  id: string; name: string | null; phone: string; email: string | null; source: string; last: Touch; first: Touch;
  option: string | null; message: string | null; temperature: string; score: number; widget: string | null; attendant: string | null;
}, now = new Date()): LeadPayload {
  const u = (k: string) => s(l.last?.[k]) ?? s(l.first?.[k]);
  return {
    event: "lead.created", id: l.id, created_at: now.toISOString(),
    name: l.name, phone: "+" + l.phone, email: l.email, source: l.source,
    utm: { source: u("utm_source"), medium: u("utm_medium"), campaign: u("utm_campaign"), content: u("utm_content"), term: u("utm_term") },
    answer: l.option, message: l.message, temperature: l.temperature, score: l.score, widget: l.widget, attendant: l.attendant,
  };
}

/** Só https e nunca endereços internos (evita usar o servidor para acessar a rede privada). */
export function safeWebhookUrl(raw: string): boolean {
  let u: URL;
  try { u = new URL(raw); } catch { return false; }
  if (u.protocol !== "https:" || u.username || u.password) return false;
  const h = u.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal") || !h.includes(".") && !h.includes(":")) return false;
  if (/^(127\.|10\.|0\.|169\.254\.|192\.168\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.)/.test(h)) return false;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return false;
  if (/^(::1?|f[cd][0-9a-f]{2}:|fe80:)/.test(h) || h.startsWith("::ffff:")) return false;
  return true;
}

/** Assinatura HMAC-SHA256 do corpo, em hex: header X-Pinas-Signature: sha256=<hex>. */
export async function sign(body: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Envia (até 5 s, sem seguir redirecionamentos). Devolve o status HTTP, ou 0 se falhou. */
export async function deliver(url: string, secret: string, payload: LeadPayload): Promise<number> {
  if (!safeWebhookUrl(url)) return 0;
  const body = JSON.stringify(payload);
  try {
    const r = await fetch(url, {
      method: "POST", redirect: "manual", signal: AbortSignal.timeout(5000),
      headers: { "content-type": "application/json", "user-agent": "PinasKit-Webhook/1", "x-pinas-event": payload.event, "x-pinas-signature": `sha256=${await sign(body, secret)}` },
      body,
    });
    return r.status;
  } catch { return 0; }
}
