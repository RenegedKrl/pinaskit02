// Utilidades do widget: atribuição, visitante, eventos, regras e envio de contatos.
import type { Rules, WidgetConfig } from "../../supabase/functions/_shared/widget-config";

export interface Touch {
  utm_source?: string; utm_medium?: string; utm_campaign?: string; utm_content?: string; utm_term?: string;
  click_ids?: Record<string, string>; referrer?: string; landing: string; ts: number;
}
export interface Ctx {
  key: string; api: string; vid: string; sid: string; cfg: WidgetConfig; capture: boolean; renderedAt: number;
}

const UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
const CLICK = ["gclid", "gbraid", "wbraid", "fbclid", "ttclid", "msclkid", "li_fat_id"];
const DAY = 864e5;

function store(k: string, v?: string, session?: boolean): string | null {
  try {
    const s = session ? sessionStorage : localStorage;
    if (v !== undefined) s.setItem(k, v);
    return s.getItem(k);
  } catch { return null; }
}

export function uuid(): string {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (+c ^ (Math.random() * 16) >> (+c / 4)).toString(16));
}

export function ids(): { vid: string; sid: string } {
  let vid = store("pk_vid");
  if (!vid) vid = store("pk_vid", uuid()) || uuid();
  let sid = store("pk_sid", undefined, true);
  if (!sid) sid = store("pk_sid", uuid(), true) || uuid();
  return { vid, sid };
}

/** Grava primeiro e último toque por 90 dias. */
export function attribution(): { first: Touch; last: Touch } {
  const p = new URLSearchParams(location.search);
  const cur: Touch = { landing: location.href.split("#")[0], ts: Date.now() };
  let tagged = false;
  UTM.forEach((k) => { const v = p.get(k); if (v) { cur[k] = v.slice(0, 200); tagged = true; } });
  CLICK.forEach((k) => { const v = p.get(k); if (v) { (cur.click_ids ||= {})[k] = v.slice(0, 300); tagged = true; } });
  let ext = false;
  try { ext = !!document.referrer && new URL(document.referrer).host !== location.host; } catch { /* ignore */ }
  if (ext) cur.referrer = document.referrer.slice(0, 500);
  let saved: { first?: Touch; last?: Touch } = {};
  try { saved = JSON.parse(store("pk_attr") || "{}"); } catch { /* ignore */ }
  const fresh = (t?: Touch) => t && Date.now() - t.ts < 90 * DAY;
  const first = fresh(saved.first) ? saved.first! : cur;
  const last = tagged || ext || !fresh(saved.last) ? cur : saved.last!;
  store("pk_attr", JSON.stringify({ first, last }));
  return { first, last };
}

let queue: Array<Record<string, unknown>> = [];
let timer: number | undefined;

export function track(ctx: Pick<Ctx, "api" | "key" | "vid" | "sid">, type: string, meta?: Record<string, unknown>) {
  queue.push({ type, url: location.href.split("#")[0], ts: Date.now(), meta });
  if (!timer) timer = window.setTimeout(() => flush(ctx), 800);
}

export function flush(ctx: Pick<Ctx, "api" | "key" | "vid" | "sid">) {
  timer = undefined;
  if (!queue.length) return;
  const body = JSON.stringify({ k: ctx.key, vid: ctx.vid, sid: ctx.sid, attr: attribution(), ref: document.referrer, events: queue });
  queue = [];
  const url = ctx.api + "/w-events";
  try {
    if (navigator.sendBeacon && navigator.sendBeacon(url, new Blob([body], { type: "text/plain" }))) return;
  } catch { /* ignore */ }
  fetch(url, { method: "POST", body, keepalive: true, headers: { "content-type": "text/plain" } }).catch(() => {});
}

export function rulesPass(r: Rules): boolean {
  if (r.mode === "all" || !r.items.length) return true;
  const url = location.href;
  const hit = r.items.some(({ match, value }) => {
    if (!value) return false;
    if (match === "exact") return url === value;
    if (match === "starts_with") return url.indexOf(value) === 0;
    if (match === "regex") { try { return new RegExp(value).test(url); } catch { return false; } }
    return url.indexOf(value) !== -1;
  });
  return r.mode === "include" ? hit : !hit;
}

export interface LeadData {
  name?: string; phone: string; email?: string; option?: string; message?: string; consent?: boolean;
  method: "button_form" | "page_form" | "connected_form"; hp?: string;
}

export interface LeadAction { type: "whatsapp" | "message" | "redirect"; url?: string; message?: string }

export async function sendLead(ctx: Ctx, d: LeadData): Promise<LeadAction> {
  const r = await fetch(ctx.api + "/w-lead", {
    method: "POST",
    headers: { "content-type": "application/json" },
    keepalive: d.method === "connected_form",
    body: JSON.stringify({ ...d, k: ctx.key, vid: ctx.vid, sid: ctx.sid, t: Date.now() - ctx.renderedAt, attr: attribution(), url: location.href }),
  });
  const j = await r.json();
  if (!r.ok || !j.ok) throw new Error(j.error || "erro");
  return j.action as LeadAction;
}

/** Executa a ação devolvida pelo servidor. `win` é uma aba aberta no clique (evita bloqueio de pop-up). */
export function runAction(a: LeadAction, win: Window | null): string | null {
  if ((a.type === "whatsapp" || a.type === "redirect") && a.url) {
    if (a.type === "whatsapp" && win) { win.location.href = a.url; return null; }
    if (win) win.close();
    location.href = a.url;
    return null;
  }
  if (win) win.close();
  return a.message || "Recebemos seus dados.";
}

export function luminance(el: Element | null): number {
  while (el) {
    const c = getComputedStyle(el).backgroundColor;
    const m = c.match(/[\d.]+/g);
    if (m && (m.length < 4 || +m[3] > 0.5)) {
      const [r, g, b] = m.map(Number);
      return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    }
    el = el.parentElement;
  }
  return 1;
}
