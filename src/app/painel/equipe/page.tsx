import Link from "next/link";
import { getSession, isAdmin } from "@/lib/session";
import { brMonth, nps, ranking, responseMinutes } from "@/lib/crm";
import { Card, PageHeader } from "@/components/ui";
import { TeamRanking, type TeamRow } from "@/components/crm/team";

const MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

/** Equipe: ranking do mês (vendas, conversão, tempo de resposta), metas e satisfação dos clientes. */
export default async function Equipe({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const sp = await searchParams;
  const off = Math.max(-12, Math.min(0, Number(sp.m) || 0));
  const { supabase, workspace, role } = await getSession();
  const m = brMonth(new Date(), off);
  const [{ data: members }, { data: wonStages }, { data: assigned }, { data: closes }, { data: answered }, { data: goals }, { data: npsRows }] = await Promise.all([
    supabase.from("workspace_members").select("user_id, email, role, see_only_own").eq("workspace_id", workspace.id).neq("role", "viewer"),
    supabase.from("pipeline_stages").select("key").eq("workspace_id", workspace.id).eq("kind", "won"),
    supabase.from("leads").select("owner_id").eq("workspace_id", workspace.id).gte("created_at", m.start).lt("created_at", m.end).not("owner_id", "is", null).limit(10000),
    supabase.from("lead_activities").select("user_id, body, leads(deal_value)").eq("workspace_id", workspace.id).eq("type", "status_change").gte("created_at", m.start).lt("created_at", m.end).limit(10000),
    supabase.from("leads").select("first_response_by, created_at, first_response_at").eq("workspace_id", workspace.id).gte("first_response_at", m.start).lt("first_response_at", m.end).limit(10000),
    supabase.from("goals").select("user_id, target_revenue, target_sales").eq("workspace_id", workspace.id).eq("month", m.key),
    supabase.from("nps_responses").select("score").eq("workspace_id", workspace.id).gte("created_at", m.start).lt("created_at", m.end),
  ]);
  const won = new Set((wonStages ?? []).map((s) => s.key));
  const wins = (closes ?? []).filter((a) => won.has((a.body as { to?: string })?.to ?? ""));
  const rows = ranking((members ?? []).map((mb) => {
    const mine = wins.filter((w) => w.user_id === mb.user_id);
    return {
      user_id: mb.user_id, leads: (assigned ?? []).filter((l) => l.owner_id === mb.user_id).length, wins: mine.length,
      revenue: mine.reduce((a, w) => a + (Number((w.body as { deal_value?: number })?.deal_value) || Number((w.leads as unknown as { deal_value: number | null } | null)?.deal_value) || 0), 0),
      responses: (answered ?? []).filter((l) => l.first_response_by === mb.user_id).map((l) => responseMinutes(l.created_at, l.first_response_at) ?? 0),
    };
  }));
  const full: TeamRow[] = rows.map((r) => {
    const mb = members!.find((x) => x.user_id === r.user_id)!; const g = goals?.find((x) => x.user_id === r.user_id);
    return { ...r, email: mb.email ?? "Sem e-mail", role: mb.role, see_only_own: mb.see_only_own, goalRevenue: Number(g?.target_revenue ?? 0), goalSales: g?.target_sales ?? 0 };
  });
  const score = nps((npsRows ?? []).map((n) => n.score));
  const ym = m.key.slice(0, 7);
  return (
    <>
      <PageHeader title="Equipe" desc="Quem vendeu mais, quem converte melhor e quem responde mais rápido. Vendas contam para quem moveu o contato para Venda."
        action={<div className="flex items-center gap-1 rounded-lg border border-line bg-card p-1 text-sm">
          <Link href={`?m=${off - 1}`} className="rounded-md px-3 py-1.5 text-mute hover:text-ink" aria-label="Mês anterior">‹</Link>
          <span className="px-2 font-semibold capitalize">{MONTHS[Number(ym.slice(5, 7)) - 1]} {ym.slice(0, 4)}</span>
          {off < 0 ? <Link href={`?m=${off + 1}`} className="rounded-md px-3 py-1.5 text-mute hover:text-ink" aria-label="Próximo mês">›</Link> : <span className="px-3 py-1.5 text-line">›</span>}
        </div>} />
      {score !== null && (
        <Card className="mb-4 flex flex-wrap items-center gap-4">
          <div><p className="text-sm text-mute">Satisfação dos clientes (NPS) no mês</p><p className={`font-display text-3xl font-bold ${score >= 50 ? "text-emerald-700" : score >= 0 ? "text-amber-700" : "text-red-700"}`}>{score}</p></div>
          <p className="text-sm text-mute">{npsRows!.length} respostas. NPS vai de −100 a 100: acima de 50 é ótimo.</p>
        </Card>
      )}
      {full.length ? <TeamRanking rows={full} month={m.key} admin={isAdmin(role)} /> : <p className="text-mute">Convide sua equipe em Configurações para ver o ranking.</p>}
    </>
  );
}
