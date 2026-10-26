// Regras do relatório de vendas por origem (puras, testadas em tests/report.test.ts).

export type ReportGroup = "origem" | "campanha" | "anuncio";
export interface ReportRow { label: string; leads: number; open: number; won: number; lost: number; revenue: number }

export const GROUP_LABEL: Record<ReportGroup, string> = { origem: "Origem", campanha: "Campanha", anuncio: "Anúncio" };

/** Próximo nível ao clicar numa linha: origem → campanha → anúncio (anúncio é o último). */
export function nextGroup(g: ReportGroup): ReportGroup | null {
  return g === "origem" ? "campanha" : g === "campanha" ? "anuncio" : null;
}

/** Conversão = vendas ÷ contatos, nunca acima de 100%. "—" quando não há contatos. */
export function conversion(won: number, leads: number): string {
  if (!leads) return "—";
  return `${Math.min(100, (won / leads) * 100).toFixed(1).replace(".", ",")}%`;
}

/** Converte as linhas que o banco devolve (bigint e numeric chegam como texto) e soma o total. */
export function normalize(rows: Record<string, unknown>[] | null): { rows: ReportRow[]; total: ReportRow } {
  const list = (rows ?? []).map((r) => ({
    label: String(r.label ?? ""), leads: Number(r.leads) || 0, open: Number(r.open) || 0,
    won: Number(r.won) || 0, lost: Number(r.lost) || 0, revenue: Number(r.revenue) || 0,
  }));
  const total = list.reduce((a, r) => ({ ...a, leads: a.leads + r.leads, open: a.open + r.open, won: a.won + r.won, lost: a.lost + r.lost, revenue: a.revenue + r.revenue }),
    { label: "Total", leads: 0, open: 0, won: 0, lost: 0, revenue: 0 });
  return { rows: list, total };
}

/** Motivos de perda: agrupa sem diferenciar maiúsculas; sem motivo vira "Sem motivo informado". Mais frequente primeiro. */
export function lostReasons(rows: { lost_reason: string | null }[]): { reason: string; count: number; pct: number }[] {
  const map = new Map<string, { reason: string; count: number }>();
  for (const r of rows) {
    const reason = r.lost_reason?.trim() || "Sem motivo informado";
    const k = reason.toLowerCase();
    const cur = map.get(k) ?? { reason, count: 0 };
    cur.count++; map.set(k, cur);
  }
  const total = rows.length || 1;
  return [...map.values()].sort((a, b) => b.count - a.count || a.reason.localeCompare(b.reason))
    .map((x) => ({ ...x, pct: Math.round((x.count / total) * 100) }));
}

/** Linha de destaque honesta: só aponta "melhor origem" com pelo menos 5 contatos e 1 venda. */
export function bestRow(rows: ReportRow[]): ReportRow | null {
  const ok = rows.filter((r) => r.leads >= 5 && r.won > 0);
  if (!ok.length) return null;
  return ok.reduce((best, r) => (r.won / r.leads > best.won / best.leads ? r : best));
}
