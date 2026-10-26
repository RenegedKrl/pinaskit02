// Regras puras do CRM (testadas em tests/crm.test.ts). Sem imports do servidor.

export const TASK_KIND: Record<string, { label: string; cls: string }> = {
  call: { label: "Ligar", cls: "bg-sky-100 text-sky-800" },
  whatsapp: { label: "WhatsApp", cls: "bg-emerald-100 text-emerald-800" },
  proposal: { label: "Proposta", cls: "bg-violet-100 text-violet-800" },
  charge: { label: "Cobrar", cls: "bg-amber-100 text-amber-800" },
  meeting: { label: "Atendimento", cls: "bg-blue-100 text-blue-800" },
  followup: { label: "Acompanhar", cls: "bg-primary-soft text-primary" },
  recall: { label: "Pós-venda", cls: "bg-teal-100 text-teal-800" },
  birthday: { label: "Aniversário", cls: "bg-pink-100 text-pink-800" },
  other: { label: "Tarefa", cls: "bg-bg text-mute" },
};

/** Link do WhatsApp com texto pronto. */
export const waLink = (phone: string, text?: string | null) => `https://wa.me/${phone.replace(/\D/g, "")}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

/** Troca {nome} e {primeiro_nome} pelo nome do contato. */
export function fillName(text: string, name: string | null): string {
  const n = (name ?? "").trim(), first = n.split(/\s+/)[0] ?? "";
  return text.replace(/\{primeiro_nome\}/g, first).replace(/\{nome\}/g, n).replace(/\s+([,!.?])/g, "$1").replace(/\s{2,}/g, " ").trim();
}

/** Início e fim do dia em Brasília (UTC−3), em ISO. */
export function brDay(now = new Date()): { start: string; end: string } {
  const br = new Date(now.getTime() - 3 * 3600_000);
  const start = Date.UTC(br.getUTCFullYear(), br.getUTCMonth(), br.getUTCDate(), 3);
  return { start: new Date(start).toISOString(), end: new Date(start + 86_400_000).toISOString() };
}

/** Primeiro e último dia do mês em Brasília: [início, início do mês seguinte). */
export function brMonth(now = new Date(), offset = 0): { start: string; end: string; key: string } {
  const br = new Date(now.getTime() - 3 * 3600_000);
  const y = br.getUTCFullYear(), m = br.getUTCMonth() + offset;
  const start = new Date(Date.UTC(y, m, 1, 3)), end = new Date(Date.UTC(y, m + 1, 1, 3));
  return { start: start.toISOString(), end: end.toISOString(), key: new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10) };
}

// ---------- Sequências ----------
export interface SeqStep { day: number; title: string; message: string }

/** Tarefas de uma sequência: "dia 1" é hoje, "dia 3" daqui a 2 dias, às 9h de Brasília (hoje: agora). */
export function sequenceTasks(steps: SeqStep[], name: string | null, now = new Date()) {
  const today9 = new Date(brDay(now).start); today9.setTime(today9.getTime() + 9 * 3600_000);
  return [...steps].sort((a, b) => a.day - b.day).map((s) => {
    const due = s.day <= 1 ? now : new Date(today9.getTime() + (s.day - 1) * 86_400_000);
    return { title: fillName(s.title || `Mensagem do dia ${s.day}`, name), message: fillName(s.message, name), due_at: due.toISOString() };
  });
}

export function cleanSteps(raw: unknown): SeqStep[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 10).map((s) => ({
    day: Math.min(365, Math.max(1, Math.round(Number((s as SeqStep).day) || 1))),
    title: String((s as SeqStep).title ?? "").trim().slice(0, 140),
    message: String((s as SeqStep).message ?? "").trim().slice(0, 1000),
  })).filter((s) => s.message);
}

// ---------- Negócios ----------
export interface DealLite { value: number; probability: number; status: string; expected_close: string | null }

/** Para fechar no mês: total em aberto e previsão ponderada pela chance. */
export function forecast(deals: DealLite[], monthKey: string): { open: number; weighted: number; count: number } {
  const ym = monthKey.slice(0, 7);
  const list = deals.filter((d) => d.status === "open" && d.expected_close?.slice(0, 7) === ym);
  const open = list.reduce((a, d) => a + Number(d.value), 0);
  const weighted = list.reduce((a, d) => a + (Number(d.value) * d.probability) / 100, 0);
  return { open: round2(open), weighted: round2(weighted), count: list.length };
}
const round2 = (n: number) => Math.round(n * 100) / 100;

// ---------- Proposta ----------
export interface PropItem { name: string; qty: number; price: number }
export function cleanItems(raw: unknown): PropItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 30).map((i) => ({
    name: String((i as PropItem).name ?? "").trim().slice(0, 120),
    qty: Math.min(9999, Math.max(1, Math.round(Number((i as PropItem).qty) || 1))),
    price: round2(Math.max(0, Number((i as PropItem).price) || 0)),
  })).filter((i) => i.name);
}
export function proposalTotal(items: PropItem[], discount = 0): { subtotal: number; total: number } {
  const subtotal = round2(items.reduce((a, i) => a + i.qty * i.price, 0));
  return { subtotal, total: round2(Math.max(0, subtotal - Math.max(0, discount))) };
}
export const proposalExpired = (validUntil: string | null, now = new Date()) =>
  !!validUntil && new Date(`${validUntil}T23:59:59-03:00`).getTime() < now.getTime();

// ---------- Tempo de resposta ----------
/** Minutos entre chegar e o primeiro clique no WhatsApp. */
export function responseMinutes(createdAt: string, firstAt: string | null): number | null {
  if (!firstAt) return null;
  return Math.max(0, Math.round((new Date(firstAt).getTime() - new Date(createdAt).getTime()) / 60_000));
}
export function formatMinutes(m: number | null): string {
  if (m === null) return "—";
  if (m < 60) return `${m} min`;
  if (m < 1440) return `${Math.floor(m / 60)} h ${m % 60 ? `${m % 60} min` : ""}`.trim();
  return `${Math.round(m / 1440)} dia${Math.round(m / 1440) > 1 ? "s" : ""}`;
}

// ---------- Agenda ----------
export interface BookingCfg { duration_min: number; days: number[]; start_time: string; end_time: string; window_days: number; min_notice_hours: number }

/** Horários livres por dia (fuso de Brasília), sem os já marcados e respeitando a antecedência mínima. */
export function freeSlots(cfg: BookingCfg, booked: string[], now = new Date()): { date: string; slots: string[] }[] {
  const taken = new Set(booked.map((b) => new Date(b).getTime()));
  const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  const from = toMin(cfg.start_time), to = toMin(cfg.end_time), minStart = now.getTime() + cfg.min_notice_hours * 3600_000;
  const out: { date: string; slots: string[] }[] = [];
  const day0 = new Date(brDay(now).start);
  for (let d = 0; d < cfg.window_days; d++) {
    const dayStart = new Date(day0.getTime() + d * 86_400_000);
    const weekday = new Date(dayStart.getTime() - 3 * 3600_000).getUTCDay();
    if (!cfg.days.includes(weekday)) continue;
    const slots: string[] = [];
    for (let m = from; m + cfg.duration_min <= to; m += cfg.duration_min) {
      const t = dayStart.getTime() + m * 60_000;
      if (t >= minStart && !taken.has(t)) slots.push(new Date(t).toISOString());
    }
    if (slots.length) out.push({ date: new Date(dayStart.getTime() - 3 * 3600_000).toISOString().slice(0, 10), slots });
  }
  return out;
}
export const brTime = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
export const brDate = (iso: string, opts: Intl.DateTimeFormatOptions = { weekday: "short", day: "2-digit", month: "2-digit" }) =>
  new Date(iso).toLocaleDateString("pt-BR", { ...opts, timeZone: "America/Sao_Paulo" });

// ---------- Contatos repetidos ----------
export interface DupLead { id: string; name: string | null; email: string | null; phone_e164: string; created_at: string }
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

/** Grupos de prováveis repetidos: mesmo e-mail, mesmos 8 últimos dígitos do telefone, ou mesmo nome completo (2+ palavras). */
export function findDuplicates(list: DupLead[]): { reason: string; leads: DupLead[] }[] {
  const groups = new Map<string, { reason: string; ids: Set<string> }>();
  const add = (k: string, reason: string, id: string) => { const g = groups.get(k) ?? { reason, ids: new Set() }; g.ids.add(id); groups.set(k, g); };
  for (const l of list) {
    if (l.email) add(`e:${l.email.trim().toLowerCase()}`, "Mesmo e-mail", l.id);
    if (l.phone_e164.length >= 10) add(`p:${l.phone_e164.slice(-8)}`, "Telefone parecido", l.id);
    if (l.name && norm(l.name).split(" ").length >= 2) add(`n:${norm(l.name)}`, "Mesmo nome", l.id);
  }
  const byId = new Map(list.map((l) => [l.id, l])); const seen = new Set<string>(); const out: { reason: string; leads: DupLead[] }[] = [];
  for (const g of groups.values()) {
    if (g.ids.size < 2) continue;
    const key = [...g.ids].sort().join(","); if (seen.has(key)) continue; seen.add(key);
    out.push({ reason: g.reason, leads: [...g.ids].map((id) => byId.get(id)!).sort((a, b) => a.created_at.localeCompare(b.created_at)) });
  }
  return out;
}

// ---------- Ranking da equipe ----------
export interface RankIn { user_id: string; leads: number; wins: number; revenue: number; responses: number[] }
export function ranking(rows: RankIn[]) {
  return rows.map((r) => {
    const sorted = [...r.responses].sort((a, b) => a - b);
    const median = sorted.length ? sorted[Math.floor((sorted.length - 1) / 2)] : null;
    return { ...r, conversion: r.leads ? Math.min(100, Math.round((r.wins / r.leads) * 1000) / 10) : null, medianResponse: median };
  }).sort((a, b) => b.revenue - a.revenue || b.wins - a.wins);
}

// ---------- NPS ----------
/** NPS = % promotores (9–10) − % detratores (0–6). */
export function nps(scores: number[]): number | null {
  if (!scores.length) return null;
  const p = scores.filter((s) => s >= 9).length, d = scores.filter((s) => s <= 6).length;
  return Math.round(((p - d) / scores.length) * 100);
}

/** "Clínica Sorriso!" → "clinica-sorriso" (para links de agenda e bio). */
export function slugify(s: string): string {
  return norm(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}
