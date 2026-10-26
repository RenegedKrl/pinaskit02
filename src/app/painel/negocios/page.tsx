import Link from "next/link";
import { CalendarClock, Target, TrendingUp, Trophy } from "lucide-react";
import { canEdit, getSession, isAdmin } from "@/lib/session";
import { brl } from "@/lib/plan";
import { brMonth, forecast } from "@/lib/crm";
import { Card, Empty, PageHeader } from "@/components/ui";
import { DealRow, type Deal, type Product } from "@/components/crm/deals";
import { ProductsCard } from "@/components/crm/products";

const MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

/** Negócios: quanto tenho para fechar este mês, negociações em aberto e catálogo. */
export default async function Negocios({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const sp = await searchParams;
  const off = Math.max(-12, Math.min(12, Number(sp.m) || 0));
  const { supabase, workspace, role } = await getSession();
  const month = brMonth(new Date(), off);
  const [{ data: deals }, { data: products }] = await Promise.all([
    supabase.from("deals").select("id, title, product_id, value, expected_close, probability, status, lead_id, closed_at, leads(name)").eq("workspace_id", workspace.id).order("expected_close", { nullsFirst: false }).limit(500),
    supabase.from("products").select("id, name, price, active").eq("workspace_id", workspace.id).order("name"),
  ]);
  const list = (deals ?? []) as unknown as (Deal & { closed_at: string | null })[];
  const f = forecast(list, month.key);
  const wonMonth = list.filter((d) => d.status === "won" && d.closed_at && d.closed_at >= month.start && d.closed_at < month.end);
  const won = wonMonth.reduce((a, d) => a + Number(d.value), 0);
  const ym = month.key.slice(0, 7);
  const open = list.filter((d) => d.status === "open");
  const thisMonth = open.filter((d) => d.expected_close?.slice(0, 7) === ym);
  const late = open.filter((d) => d.expected_close && d.expected_close.slice(0, 7) < ym);
  const noDate = open.filter((d) => !d.expected_close);
  const edit = canEdit(role);
  const label = `${MONTHS[Number(ym.slice(5, 7)) - 1]} de ${ym.slice(0, 4)}`;
  const kpis = [
    { icon: <Target size={18} />, l: `Para fechar em ${MONTHS[Number(ym.slice(5, 7)) - 1]}`, v: brl(f.open), s: `${f.count} negociações em aberto`, c: "text-primary bg-primary-soft" },
    { icon: <TrendingUp size={18} />, l: "Previsão pela chance", v: brl(f.weighted), s: "soma de valor × chance de fechar", c: "text-violet-700 bg-violet-100" },
    { icon: <Trophy size={18} />, l: "Já ganho no mês", v: brl(won), s: `${wonMonth.length} negociações ganhas`, c: "text-emerald-700 bg-emerald-100" },
    { icon: <CalendarClock size={18} />, l: "Previsão vencida", v: String(late.length), s: "abertas com data já passada", c: "text-amber-700 bg-amber-100" },
  ];
  const Group = ({ title, rows }: { title: string; rows: Deal[] }) => rows.length ? (
    <Card><h2 className="mb-3 font-display font-semibold">{title} <span className="text-sm font-normal text-mute">· {rows.length} · {brl(rows.reduce((a, d) => a + Number(d.value), 0))}</span></h2>
      <ul className="space-y-2">{rows.map((d) => <DealRow key={d.id} d={d} products={(products ?? []) as Product[]} edit={edit} showLead />)}</ul></Card>
  ) : null;

  return (
    <>
      <PageHeader title="Negócios" desc="Cada negociação com valor, previsão e chance de fechar. Crie negociações na ficha do contato."
        action={<div className="flex items-center gap-1 rounded-lg border border-line bg-card p-1 text-sm">
          <Link href={`?m=${off - 1}`} className="rounded-md px-3 py-1.5 text-mute hover:text-ink" aria-label="Mês anterior">‹</Link>
          <span className="px-2 font-semibold capitalize">{label}</span>
          <Link href={`?m=${off + 1}`} className="rounded-md px-3 py-1.5 text-mute hover:text-ink" aria-label="Próximo mês">›</Link>
        </div>} />
      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => <Card key={k.l}><div className="flex items-center justify-between"><p className="text-sm text-mute">{k.l}</p><span className={`grid size-9 place-items-center rounded-xl ${k.c}`}>{k.icon}</span></div>
          <p className="mt-2 font-display text-3xl font-bold tabular-nums">{k.v}</p><p className="mt-1 text-sm text-mute">{k.s}</p></Card>)}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          {!open.length ? <Empty title="Nenhuma negociação em aberto" desc="Abra a ficha de um contato e clique em “Nova negociação” para acompanhar valor e previsão." action={<Link href="/painel/contatos" className="font-semibold text-primary">Ir para Contatos</Link>} />
            : <><Group title="Previsão vencida" rows={late} /><Group title={`Para fechar em ${label}`} rows={thisMonth} /><Group title="Sem previsão de fechamento" rows={noDate} /></>}
        </div>
        <ProductsCard products={(products ?? []) as Product[]} admin={isAdmin(role)} />
      </div>
    </>
  );
}
