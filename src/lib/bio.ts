// Página da bio e QR Code (puro, testado em tests/crm.test.ts).
export interface BioLink { label: string; url: string }

/** Até 8 links, só http(s), sem javascript: nem endereços quebrados. */
export function cleanLinks(raw: unknown): BioLink[] {
  if (!Array.isArray(raw)) return [];
  const out: BioLink[] = [];
  for (const l of raw.slice(0, 8)) {
    const label = String((l as BioLink)?.label ?? "").trim().slice(0, 40);
    let url = String((l as BioLink)?.url ?? "").trim().slice(0, 500);
    if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;
    try { const u = new URL(url); if (!label || !/^https?:$/.test(u.protocol)) continue; out.push({ label, url: u.toString() }); } catch { /* inválido */ }
  }
  return out;
}

/** Link do WhatsApp que registra a origem (bio ou QR Code) e abre a conversa, sem expor o número na página. */
export function trackedWhatsApp(apiBase: string, widgetKey: string, via: "bio" | "qrcode", source = via === "bio" ? "instagram" : "loja-fisica"): string {
  const p = new URLSearchParams({ k: widgetKey, utm_source: source, utm_medium: via, utm_campaign: via === "bio" ? "link-da-bio" : "qr-code" });
  return `${apiBase.replace(/\/$/, "")}/functions/v1/b-redirect?${p.toString()}`;
}
