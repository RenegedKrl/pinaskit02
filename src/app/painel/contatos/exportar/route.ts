import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { getStages, stageName } from "@/lib/stages";
import { applyFilters, type LeadFilters } from "../filters";

// CSV com BOM e separador ";" abre direto no Excel em português. Liberado inclusive em modo somente leitura.
export async function GET(req: NextRequest) {
  const { supabase, workspace, user } = await getSession();
  const f = Object.fromEntries(req.nextUrl.searchParams) as LeadFilters;
  const { q } = applyFilters(supabase.from("leads").select("name, phone_e164, email, source_label, status, temperature, score, answers, first_touch, last_touch, deal_value, created_at").eq("workspace_id", workspace.id), f);
  const stages = await getStages(supabase, workspace.id);
  const { data } = await q.order("created_at", { ascending: false }).limit(10000);
  const cell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const head = ["Nome", "WhatsApp", "E-mail", "Origem", "Campanha", "Anúncio", "Etapa", "Temperatura", "Pontos", "Resposta", "Mensagem", "Valor (R$)", "Chegou em"];
  const rows = (data ?? []).map((l) => [
    l.name, "+" + l.phone_e164, l.email, l.source_label, l.last_touch?.utm_campaign ?? l.first_touch?.utm_campaign, l.last_touch?.utm_content,
    stageName(stages, l.status), l.temperature, l.score, l.answers?.option, l.answers?.message, l.deal_value, new Date(l.created_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
  ].map(cell).join(";"));
  await supabase.from("audit_log").insert({ workspace_id: workspace.id, user_id: user.id, action: "export_leads", meta: { count: rows.length, filters: f } });
  return new NextResponse("﻿" + [head.map(cell).join(";"), ...rows].join("\r\n"), {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="contatos-pinas-kit.csv"` },
  });
}
