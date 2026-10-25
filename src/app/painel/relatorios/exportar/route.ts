import { type NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { since } from "@/lib/utils";
import { conversion, GROUP_LABEL, normalize, type ReportGroup } from "@/lib/report";

// Exporta o relatório que está na tela (mesmo período, agrupamento e filtros) em CSV para Excel.
export async function GET(req: NextRequest) {
  const { supabase, workspace, user } = await getSession();
  const p = req.nextUrl.searchParams;
  const days = [7, 30, 90, 365].includes(Number(p.get("p"))) ? Number(p.get("p")) : 30;
  const group = (["origem", "campanha", "anuncio"].includes(p.get("por") ?? "") ? p.get("por") : "origem") as ReportGroup;
  const { data } = await supabase.rpc("report_by_source", {
    p_ws: workspace.id, p_from: since(days), p_group: group, p_source: p.get("origem"), p_campaign: p.get("campanha"),
  });
  const { rows } = normalize(data as Record<string, unknown>[] | null);
  await supabase.from("audit_log").insert({ workspace_id: workspace.id, user_id: user.id, action: "export_report", meta: { days, group } });
  const cell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [[GROUP_LABEL[group], "Contatos", "Em andamento", "Vendas", "Perdidos", "Conversão", "Total vendido (R$)"].map(cell).join(";"),
    ...rows.map((r) => [r.label, r.leads, r.open, r.won, r.lost, conversion(r.won, r.leads), r.revenue.toFixed(2).replace(".", ",")].map(cell).join(";"))];
  return new Response("﻿" + lines.join("\r\n"), {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="relatorio-${group}-${days}dias.csv"` },
  });
}
