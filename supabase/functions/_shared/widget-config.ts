// Fonte única da configuração do widget. Sem imports: usada pelo painel (Next.js),
// pelas Edge Functions (Deno) e pelo script do widget.

export type Mode = "button" | "form" | "both";
export type RuleMatch = "contains" | "exact" | "starts_with" | "regex";
export interface Rule { match: RuleMatch; value: string }
export interface Rules { mode: "all" | "include" | "exclude"; items: Rule[] }
export interface QuestionOption { label: string; points: number }

export interface WidgetConfig {
  color: string;
  position: "right" | "left";
  label: string;
  greeting: string;
  attendantName: string;
  attendantAvatar: string;
  online: boolean;
  prefill: string;
  buttonForm: boolean; // mini-formulário no balão
  buttonClick: "whatsapp" | "miniform" | "scroll"; // usado no modo "both"
  buttonRules: Rules;
  form: {
    title: string;
    description: string;
    submitLabel: string;
    askName: boolean;
    askEmail: boolean;
    askMessage: boolean;
    consent: boolean;
    question: { enabled: boolean; label: string; options: QuestionOption[] };
    theme: "auto" | "light" | "dark";
    width: "content" | "narrow";
    insertBefore: string; // seletor CSS opcional
    existing: { action: "add" | "replace" | "connect"; selector: string; map: FieldMap };
  };
  formRules: Rules;
  after: { type: "whatsapp" | "message" | "redirect"; message: string; url: string };
  template: string;
  hours: Hours;
  pixels: { meta: boolean; google: boolean; adsSendTo: string };
  rotation: boolean; // distribui entre os atendentes da equipe (Configurações › Rodízio)
}

/** Campos do formulário do próprio site: seletor CSS ou atributo name. Vazio = detectar sozinho. */
export interface FieldMap { name: string; phone: string; email: string; message: string }

/** Horário de atendimento (fuso de Brasília). days: 0 = domingo … 6 = sábado. */
export interface Hours { enabled: boolean; days: number[]; from: string; to: string; offMessage: string }

export const DEFAULT_CONFIG: WidgetConfig = {
  color: "#7C3AED",
  position: "right",
  label: "Falar no WhatsApp",
  greeting: "Olá! Como podemos ajudar?",
  attendantName: "",
  attendantAvatar: "",
  online: true,
  prefill: "Olá! Vim pelo site e gostaria de saber mais.",
  buttonForm: true,
  buttonClick: "scroll",
  buttonRules: { mode: "all", items: [] },
  form: {
    title: "Fale com a gente",
    description: "Deixe seus dados e continue a conversa pelo WhatsApp.",
    submitLabel: "Continuar no WhatsApp",
    askName: true,
    askEmail: false,
    askMessage: false,
    consent: false,
    question: {
      enabled: false,
      label: "O que melhor descreve seu momento?",
      options: [
        { label: "Quero contratar agora", points: 30 },
        { label: "Estou comparando opções", points: 10 },
        { label: "Só quero tirar uma dúvida", points: 0 },
      ],
    },
    theme: "auto",
    width: "narrow",
    insertBefore: "",
    existing: { action: "add", selector: "", map: { name: "", phone: "", email: "", message: "" } },
  },
  formRules: { mode: "all", items: [] },
  after: { type: "whatsapp", message: "Recebemos seus dados. Em breve falaremos com você.", url: "" },
  template: "Olá! Sou {nome}. {opcao} {mensagem}",
  hours: { enabled: false, days: [1, 2, 3, 4, 5], from: "08:00", to: "18:00", offMessage: "Estamos fora do horário agora. Deixe seu contato que respondemos a partir das 8h." },
  pixels: { meta: false, google: false, adsSendTo: "" },
  rotation: false,
};

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Está dentro do horário de atendimento agora? Desligado = sempre aberto. Usa o horário de Brasília. */
export function isOpen(h: Hours, now = new Date()): boolean {
  if (!h.enabled) return true;
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  const cur = `${get("hour")}:${get("minute")}`;
  if (!h.days.includes(day) || !HHMM.test(h.from) || !HHMM.test(h.to)) return false;
  // atravessa a meia-noite (ex.: 18:00 → 02:00)
  return h.from <= h.to ? cur >= h.from && cur < h.to : cur >= h.from || cur < h.to;
}

/** "AW-123456789/AbC-dEfG" — formato do rótulo de conversão do Google Ads. */
export const ADS_SEND_TO = /^AW-\d{6,12}\/[\w-]{4,40}$/;

/** Limpa horário, pixels, rodízio e mapa de campos antes de salvar (valores inválidos voltam ao padrão). */
export function cleanExtras(c: WidgetConfig): WidgetConfig {
  const t = (s: unknown, n: number) => (typeof s === "string" ? s.trim().slice(0, n) : "");
  const hm = (s: unknown, d: string) => (typeof s === "string" && HHMM.test(s) ? s : d);
  const m = c.form.existing.map, ads = t(c.pixels.adsSendTo, 60);
  return {
    ...c,
    hours: {
      enabled: !!c.hours.enabled,
      days: [...new Set((Array.isArray(c.hours.days) ? c.hours.days : []).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))].sort(),
      from: hm(c.hours.from, "08:00"), to: hm(c.hours.to, "18:00"), offMessage: t(c.hours.offMessage, 160),
    },
    pixels: { meta: !!c.pixels.meta, google: !!c.pixels.google, adsSendTo: ADS_SEND_TO.test(ads) ? ads : "" },
    rotation: !!c.rotation,
    form: { ...c.form, existing: { ...c.form.existing, map: { name: t(m.name, 120), phone: t(m.phone, 120), email: t(m.email, 120), message: t(m.message, 120) } } },
  };
}

/** Junta a config salva com os padrões (campos novos ganham valor padrão). */
export function mergeConfig(saved: unknown): WidgetConfig {
  const s = (saved && typeof saved === "object" ? saved : {}) as Partial<WidgetConfig>;
  const f = (s.form ?? {}) as Partial<WidgetConfig["form"]>;
  return {
    ...DEFAULT_CONFIG,
    ...s,
    buttonRules: { ...DEFAULT_CONFIG.buttonRules, ...(s.buttonRules ?? {}) },
    formRules: { ...DEFAULT_CONFIG.formRules, ...(s.formRules ?? {}) },
    after: { ...DEFAULT_CONFIG.after, ...(s.after ?? {}) },
    hours: { ...DEFAULT_CONFIG.hours, ...(s.hours ?? {}) },
    pixels: { ...DEFAULT_CONFIG.pixels, ...(s.pixels ?? {}) },
    form: {
      ...DEFAULT_CONFIG.form,
      ...f,
      question: { ...DEFAULT_CONFIG.form.question, ...(f.question ?? {}) },
      existing: { ...DEFAULT_CONFIG.form.existing, ...(f.existing ?? {}), map: { ...DEFAULT_CONFIG.form.existing.map, ...(f.existing?.map ?? {}) } },
    },
  };
}

/** Monta a mensagem do WhatsApp a partir do modelo. */
export function renderTemplate(tpl: string, v: { nome?: string; opcao?: string; mensagem?: string }): string {
  return tpl
    .replace(/\{nome\}/g, v.nome ?? "")
    .replace(/\{opcao\}/g, v.opcao ? `Momento: ${v.opcao}.` : "")
    .replace(/\{mensagem\}/g, v.mensagem ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Traduz a origem técnica para um nome conhecido. */
export function sourceLabel(a: {
  utm_source?: string | null; utm_medium?: string | null; referrer?: string | null;
  click_ids?: Record<string, string> | null;
}): string {
  const src = (a.utm_source ?? "").toLowerCase();
  const med = (a.utm_medium ?? "").toLowerCase();
  const ids = a.click_ids ?? {};
  if (ids.gclid || ids.gbraid || ids.wbraid || /google_ads|adwords/.test(src) || (src === "google" && /cpc|paid|ppc/.test(med))) return "Google Ads";
  if (ids.fbclid && !src) return "Meta Ads";
  // "ig", "fb" e "meta" só valem como palavra inteira (evita "digital" virar Instagram)
  const word = (w: string) => new RegExp(`(^|[^a-z])(${w})([^a-z]|$)`).test(src);
  if (/facebook|instagram/.test(src) || word("meta|fb|ig|insta")) {
    if (/cpc|paid|ads|ppc/.test(med) || /ads/.test(src)) return "Meta Ads";
    return /instagram/.test(src) || word("ig|insta") ? "Instagram" : "Facebook";
  }
  if (ids.ttclid || /tiktok/.test(src)) return "TikTok Ads";
  if (ids.msclkid || /bing/.test(src)) return "Microsoft Ads";
  if (/chatgpt|openai/.test(src)) return "ChatGPT";
  if (src) return a.utm_source as string;
  const ref = (a.referrer ?? "").toLowerCase();
  if (!ref) return "Acesso direto";
  if (/chatgpt\.com|openai\.com/.test(ref)) return "ChatGPT";
  if (/google\./.test(ref)) return "Google (orgânico)";
  if (/instagram\.com/.test(ref)) return "Instagram";
  if (/facebook\.com|fb\.com/.test(ref)) return "Facebook";
  if (/bing\.com/.test(ref)) return "Bing (orgânico)";
  return "Outros sites";
}

export function isPaid(label: string): boolean {
  return /Ads$/.test(label);
}

export interface ScoreInput {
  hasEmail: boolean; paid: boolean; pages: number; returnDays: number;
  optionPoints: number; bot: boolean;
}
export interface ScoreRules {
  base: number; perReturn: number; perPage: number; pageCap: number;
  email: number; paid: number; bot: number; warm: number; hot: number;
}
export const DEFAULT_SCORE: ScoreRules = {
  base: 10, perReturn: 15, perPage: 2, pageCap: 10, email: 10, paid: 15, bot: 20, warm: 20, hot: 40,
};

export function score(i: ScoreInput, r: ScoreRules = DEFAULT_SCORE): { score: number; temperature: "frio" | "morno" | "quente" } {
  let s = r.base + Math.min(i.pages, r.pageCap) * r.perPage + i.returnDays * r.perReturn + i.optionPoints;
  if (i.hasEmail) s += r.email;
  if (i.paid) s += r.paid;
  if (i.bot) s -= r.bot;
  s = Math.max(0, s);
  return { score: s, temperature: s >= r.hot ? "quente" : s >= r.warm ? "morno" : "frio" };
}
