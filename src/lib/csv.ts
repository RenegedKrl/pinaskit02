// Importação de contatos por planilha (CSV). Funções puras, testadas em tests/growth.test.ts.

/** Lê CSV com vírgula ou ponto e vírgula (Excel em português), aspas e quebras de linha dentro das aspas. */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const first = src.split(/\r?\n/, 1)[0] ?? "";
  const sep = (first.match(/;/g)?.length ?? 0) > (first.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = []; let row: string[] = []; let cell = ""; let q = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (q) {
      if (c === '"' && src[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c;
    } else if (c === '"') q = true;
    else if (c === sep) { row.push(cell.trim()); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(cell.trim()); cell = "";
      if (row.some((x) => x)) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell.trim());
  if (row.some((x) => x)) rows.push(row);
  return rows;
}

export type ImportField = "name" | "phone" | "email" | "source" | "ignore";
export const FIELD_LABEL: Record<ImportField, string> = { name: "Nome", phone: "WhatsApp / telefone", email: "E-mail", source: "Origem", ignore: "Não importar" };

/** Adivinha cada coluna pelo título. */
export function guessFields(header: string[]): ImportField[] {
  const used = new Set<ImportField>();
  return header.map((h) => {
    const k = h.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    const f: ImportField = /whats|celular|telefone|fone|phone|tel\b|numero/.test(k) ? "phone"
      : /e-?mail/.test(k) ? "email" : /^nome|name|cliente|contato/.test(k) ? "name" : /origem|fonte|source|canal/.test(k) ? "source" : "ignore";
    if (f !== "ignore" && used.has(f)) return "ignore";
    used.add(f); return f;
  });
}

/** Telefone para o formato do banco (só dígitos com DDI). Número brasileiro sem 55 ganha o 55. Inválido → null. */
export function normalizePhone(raw: string): string | null {
  let d = raw.replace(/\D/g, "").replace(/^00/, "");
  if (d.length === 10 || d.length === 11) d = "55" + d;
  return d.length >= 12 && d.length <= 15 ? d : null;
}

export interface ImportRow { name: string | null; phone: string; email: string | null; source: string | null }

/** Monta as linhas válidas e conta as ignoradas (sem telefone válido ou repetidas na própria planilha). */
export function buildRows(data: string[][], fields: ImportField[]): { rows: ImportRow[]; skipped: number } {
  const col = (f: ImportField) => fields.indexOf(f);
  const [n, p, e, s] = [col("name"), col("phone"), col("email"), col("source")];
  const seen = new Set<string>(); const rows: ImportRow[] = []; let skipped = 0;
  for (const r of data) {
    const phone = p >= 0 ? normalizePhone(r[p] ?? "") : null;
    if (!phone || seen.has(phone)) { skipped++; continue; }
    seen.add(phone);
    const email = e >= 0 ? (r[e] ?? "").trim().slice(0, 200) : "";
    rows.push({
      name: n >= 0 ? (r[n] ?? "").trim().slice(0, 120) || null : null, phone,
      email: /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? email : null,
      source: s >= 0 ? (r[s] ?? "").trim().slice(0, 60) || null : null,
    });
  }
  return { rows, skipped };
}
