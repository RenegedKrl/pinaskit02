// Campos personalizados do contato (puro, testado em tests/crm.test.ts).
export type FieldType = "text" | "number" | "date" | "select";
export interface CustomField { key: string; label: string; type: FieldType; options: string[] }

export const FIELD_TYPES: Record<FieldType, string> = { text: "Texto", number: "Número", date: "Data", select: "Lista de opções" };

/** Mantém só campos conhecidos e com valor válido para o tipo. Vazio = removido. */
export function cleanCustom(fields: CustomField[], values: Record<string, unknown>): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const f of fields) {
    const raw = values?.[f.key];
    if (raw === undefined || raw === null || String(raw).trim() === "") continue;
    const v = String(raw).trim();
    if (f.type === "number") { const n = Number(v.replace(/\./g, "").replace(",", ".")); if (Number.isFinite(n)) out[f.key] = n; }
    else if (f.type === "date") { if (/^\d{4}-\d{2}-\d{2}$/.test(v)) out[f.key] = v; }
    else if (f.type === "select") { if (f.options.includes(v)) out[f.key] = v; }
    else out[f.key] = v.slice(0, 200);
  }
  return out;
}

/** "Tratamento de interesse" → "tratamento_de_interesse". */
export function fieldKey(label: string): string {
  return label.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 30) || "campo";
}

/** Valor para mostrar (data em formato brasileiro). */
export function showValue(f: CustomField, v: unknown): string {
  if (v === undefined || v === null || v === "") return "";
  if (f.type === "date" && typeof v === "string") return v.split("-").reverse().join("/");
  if (f.type === "number") return Number(v).toLocaleString("pt-BR");
  return String(v);
}
