// Mensagens prontas de WhatsApp e etiquetas (regras puras, testadas em tests/messages.test.ts).

export const TEMPLATE_VARS = ["{nome}", "{primeiro_nome}", "{origem}"] as const;

/** Troca {nome}, {primeiro_nome} e {origem} pelos dados do contato. Variável sem dado vira vazio, sem espaço sobrando. */
export function fillTemplate(body: string, lead: { name: string | null; source_label: string | null }): string {
  const name = (lead.name ?? "").trim();
  const map: Record<string, string> = {
    "{nome}": name, "{primeiro_nome}": name.split(/\s+/)[0] ?? "", "{origem}": (lead.source_label ?? "").trim(),
  };
  return body.replace(/\{(nome|primeiro_nome|origem)\}/g, (m) => map[m] ?? "")
    .replace(/ +([,.!?])/g, "$1").replace(/ {2,}/g, " ").trim();
}

export const MAX_TAGS = 10;

/** Normaliza uma etiqueta: sem espaços nas pontas, no máximo 24 letras, minúsculas (evita "VIP" e "vip" duplicadas). */
export function cleanTag(t: string): string {
  return t.trim().replace(/\s+/g, " ").slice(0, 24).toLowerCase();
}

/** Adiciona etiqueta sem repetir e respeitando o limite. */
export function addTag(tags: string[], t: string): string[] {
  const tag = cleanTag(t);
  if (!tag || tags.includes(tag) || tags.length >= MAX_TAGS) return tags;
  return [...tags, tag];
}

/** Situação do lembrete de retorno em relação a agora. */
export function followupState(at: string | null, now = new Date()): "none" | "late" | "today" | "future" {
  if (!at) return "none";
  const d = new Date(at);
  if (d.getTime() < now.getTime()) return "late";
  const day = (x: Date) => x.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  return day(d) === day(now) ? "today" : "future";
}
