import Link from "next/link";
import { ChevronRight, Download, Lightbulb } from "lucide-react";
import { getSession } from "@/lib/session";
import { brl } from "@/lib/plan";
import { since } from "@/lib/utils";
import { bestRow, conversion, GROUP_LABEL, nextGroup, normalize, type ReportGroup } from "@/lib/report";
import { Card, Empty, PageHeader } from "@/components/ui";

type SP = { p?: string; por?: string; origem?: string; campanha?: string };
const PERIODS = [7, 30, 90, 365];

export default async function Relatorios({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { supabase, workspace } = await getSession();
  const days = PERIODS.includes(Number(sp.p)) ? Number(sp.p) : 30;
  const group: ReportGroup = sp.campanha ? "anuncio" : sp.origem ? "campanha" : sp.por === "campanha" || sp.por === "anuncio" ? sp.por : "origem";
  const { data } = await supabase.rpc("report_by_source", {
    p_ws: workspace.id, p_from: since(days), p_group: group, p_source: sp.origem ?? null, p_campaign: sp.campanha ?? null,
  });
  const { rows, total } = normalize(data as Record<string, unknown>[] | null);
  const best = group === "origem" ? bestRow(rows) : null;
  const max = Math.max(1, ...rows.map((r) => r.leads));
  const next = nextGroup(group);

  const qs = (extra: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const all = { p: String(days), origem: sp.origem, campanha: sp.campanha, ...extra };
    Object.entries(all).forEach(([k, v]) => { if (v) p.set(k, v); });
    return `?${p.toString()}`;
  };
  const drill = (label: string) => group === "origem" ? qs({ origem: label, campanha: undefined, por: undefined })
    : group === "campanha" ? qs({ campanha: label, por: undefined }) : null;

  return (
    <>
      <PageHeader title="Relatórios" desc="Quantos contatos e quantas vendas vieram de cada origem, campanha e anúncio."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1 rounded-lg border border-line bg-card p-1 text-sm" role="group" aria-label="Período">
              {PERIODS.map((d) => <Link key={d} href={qs({ p: String(d) })} className={`rounded-md px-3 py-1.5 ${d === days ? "bg-primary text-white" : "text-mute"}`}>{d === 365 ? "1 ano" : `${d} dias`}</Link>)}
            </div>
            <a href={`/painel/relatorios/exportar${qs({ por: group })}`} className="inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-card px-3 text-sm font-semibold"><Download size={16} />Excel</a>
          </div>
        } />

      {!sp.origem && (
        <div className="mb-4 flex gap-1 text-sm" role="tablist" aria-label="Agrupar por">
          {(["origem", "campanha", "anuncio"] as ReportGroup[]).map((g) => (
            <Link key={g} role="tab" aria-selected={g === group} href={qs({ por: g === "origem" ? undefined : g })}
              className={`rounded-lg px-3 py-2 font-semibold ${g === group ? "bg-primary-soft text-primary" : "text-mute hover:bg-card"}`}>Por {GROUP_LABEL[g].toLowerCase()}</Link>
          ))}
        </div>
      )}
      {sp.origem && (
        <nav aria-label="Caminho" className="mb-4 flex flex-wrap items-center gap-1 text-sm">
          <Link href={qs({ origem: undefined, campanha: undefined })} className="text-primary hover:underline">Todas as origens</Link>
          <ChevronRight size={14} className="text-mute" />
          {sp.campanha ? <Link href={qs({ campanha: undefined })} className="text-primary hover:underline">{sp.origem}</Link> : <span className="font-semibold">{sp.origem}</span>}
          {sp.campanha && <><ChevronRight size={14} className="text-mute" /><span className="font-semibold">{sp.campanha}</span></>}
        </nav>
      )}

      {best && (
        <Card className="mb-4 flex items-start gap-3 border-primary/30 bg-primary-soft/40">
          <Lightbulb size={20} className="mt-0.5 shrink-0 text-primary" />
          <p className="text-[15px]"><b>{best.label}</b> é a origem que mais converte neste período: {conversion(best.won, best.leads)} dos contatos viraram venda ({best.won} de {best.leads}).</p>
        </Card>
      )}

      {!rows.length ? (
        <Empty title="Ainda não há contatos neste período" desc="Quando os contatos chegarem, você vê aqui de onde vieram e quantos viraram venda. Use links com origem nos anúncios para ver por campanha."
          action={<Link href="/painel/captacao/links" className="font-semibold text-primary">Criar link com origem</Link>} />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-left text-[15px]">
            <thead className="border-b border-line text-sm text-mute">
              <tr>{[GROUP_LABEL[group], "Contatos", "Em andamento", "Vendas", "Conversão", "Total vendido"].map((h, i) => <th key={h} className={`px-4 py-3 font-semibold ${i ? "text-right" : ""}`}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const href = drill(r.label);
                return (
                  <tr key={r.label} className="border-b border-line last:border-0 hover:bg-bg">
                    <td className="px-4 py-3">
                      {href ? <Link href={href} className="font-semibold hover:text-primary">{r.label}</Link> : <span className="font-semibold">{r.label}</span>}
                      <div className="mt-1.5 h-1.5 rounded-full bg-line" aria-hidden="true">
                        <div className="h-1.5 rounded-full bg-primary/40" style={{ width: `${(r.leads / max) * 100}%` }}>
                          <div className="h-1.5 rounded-full bg-primary" style={{ width: r.leads ? `${(r.won / r.leads) * 100}%` : 0 }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">{r.leads}</td>
                    <td className="px-4 py-3 text-right text-mute">{r.open}</td>
                    <td className="px-4 py-3 text-right font-semibold">{r.won}</td>
                    <td className="px-4 py-3 text-right">{conversion(r.won, r.leads)}</td>
                    <td className="px-4 py-3 text-right">{r.revenue ? brl(r.revenue) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t border-line bg-bg text-sm font-semibold">
              <tr><td className="px-4 py-3">Total</td><td className="px-4 py-3 text-right">{total.leads}</td><td className="px-4 py-3 text-right">{total.open}</td>
                <td className="px-4 py-3 text-right">{total.won}</td><td className="px-4 py-3 text-right">{conversion(total.won, total.leads)}</td><td className="px-4 py-3 text-right">{total.revenue ? brl(total.revenue) : "—"}</td></tr>
            </tfoot>
          </table>
        </Card>
      )}
      <p className="mt-3 text-sm text-mute">
        Barra clara = contatos; parte escura = vendas. {next && rows.length ? `Clique numa linha para ver por ${GROUP_LABEL[next].toLowerCase()}.` : ""} Vendas são os contatos na etapa de venda concluída; o total vendido soma o valor preenchido na ficha. Custo dos anúncios não aparece porque o Pinas Kit não acessa suas contas de anúncio.
      </p>
    </>
  );
}
