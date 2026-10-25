import Link from "next/link";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { getSession } from "@/lib/session";
import { since } from "@/lib/utils";
import { Card, PageHeader } from "@/components/ui";

interface Stats {
  views: number; clicks: number; leads: number; waiting: number; won: number;
  sources: { label: string; total: number }[]; daily: { day: string; total: number }[];
}

const pct = (a: number, b: number) => (b ? `${Math.min(100, (a / b) * 100).toFixed(1).replace(".", ",")}%` : "—");

export default async function Inicio({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const { supabase, user, workspace } = await getSession();
  const days = [7, 30, 90].includes(Number((await searchParams).p)) ? Number((await searchParams).p) : 30;
  const [{ data: widgets }, { data: s }, { count: total }] = await Promise.all([
    supabase.from("widgets").select("id, first_seen_at").eq("workspace_id", workspace.id),
    supabase.rpc("dashboard_stats", { p_ws: workspace.id, p_from: since(days) }),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("workspace_id", workspace.id),
  ]);
  const st = (s ?? { views: 0, clicks: 0, leads: 0, waiting: 0, won: 0, sources: [], daily: [] }) as Stats;
  const hasWidget = !!widgets?.length;
  const installed = !!widgets?.some((w) => w.first_seen_at);
  const hasLead = (total ?? 0) > 0;
  const name = (user.user_metadata?.full_name as string | undefined)?.split(" ")[0];

  // "O que fazer agora?" por regras fixas, na ordem de prioridade
  const next = !hasWidget
    ? { t: "Crie seu primeiro botão ou formulário", d: "É assim que as pessoas do seu site vão chegar até você.", href: "/painel/captacao/novo", cta: "Criar agora" }
    : !installed
    ? { t: "Instale no seu site", d: "Cole uma linha de código no site. Se preferir, copie o pedido pronto para uma IA ou para seu desenvolvedor.", href: "/painel/captacao", cta: "Ver instalação" }
    : !hasLead
    ? { t: "Faça um teste", d: "Abra seu site, preencha o formulário com seu número e veja o contato chegar aqui.", href: "/painel/captacao", cta: "Abrir pontos de contato" }
    : st.waiting > 0
    ? { t: `Você tem ${st.waiting} ${st.waiting === 1 ? "contato esperando" : "contatos esperando"} há mais de 24 h`, d: "Quanto antes você responde, maior a chance de venda.", href: "/painel/contatos?status=novo", cta: "Atender agora" }
    : null;
  const steps = [
    { done: hasWidget, label: "Criar botão ou formulário" },
    { done: installed, label: "Instalar no site" },
    { done: hasLead, label: "Receber o primeiro contato" },
  ];
  const doneCount = steps.filter((x) => x.done).length;
  const maxDay = Math.max(1, ...st.daily.map((d) => d.total));
  const maxSrc = Math.max(1, ...st.sources.map((d) => d.total));

  return (
    <>
      <PageHeader
        title={`Olá${name ? `, ${name}` : ""}!`}
        desc="Veja como estão chegando os contatos do seu negócio."
        action={
          <div className="flex gap-1 rounded-lg border border-line bg-white p-1 text-sm" role="group" aria-label="Período">
            {[7, 30, 90].map((d) => (
              <Link key={d} href={`/painel?p=${d}`} className={`rounded-md px-3 py-1.5 ${d === days ? "bg-primary text-white" : "text-mute"}`}>{d} dias</Link>
            ))}
          </div>
        }
      />

      {(next || doneCount < 3) && (
        <div className="mb-6 grid gap-4 md:grid-cols-2">
          {doneCount < 3 && (
            <Card>
              <h2 className="font-display font-semibold">Seu início no Pinas Kit</h2>
              <p className="text-sm text-mute">Você concluiu {doneCount} de 3 passos.</p>
              <div className="my-3 h-2 rounded-full bg-primary-soft"><div className="h-2 rounded-full bg-primary" style={{ width: `${(doneCount / 3) * 100}%` }} /></div>
              <ul className="space-y-2">
                {steps.map((x) => (
                  <li key={x.label} className="flex items-center gap-2 text-[15px]">
                    {x.done ? <CheckCircle2 size={18} className="text-success" /> : <Circle size={18} className="text-mute" />}{x.label}
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {next && (
            <Card className="border-primary/30 bg-primary-soft/40">
              <p className="text-sm font-semibold text-primary">O que fazer agora?</p>
              <h2 className="mt-1 font-display text-lg font-semibold">{next.t}</h2>
              <p className="mt-1 text-mute">{next.d}</p>
              <Link href={next.href} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-semibold text-white">{next.cta}<ArrowRight size={16} /></Link>
            </Card>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { l: "Pessoas que viram", v: st.views, h: "Viram seu botão ou formulário" },
          { l: "Cliques no WhatsApp", v: st.clicks, h: `Taxa de clique: ${pct(st.clicks, st.views)}` },
          { l: "Contatos recebidos", v: st.leads, h: `Viraram contato: ${pct(st.leads, st.views)}` },
          { l: "Vendas registradas", v: st.won, h: "Marcadas como concluídas no funil" },
        ].map((c) => (
          <Card key={c.l}>
            <p className="text-sm text-mute">{c.l}</p>
            <p className="mt-1 font-display text-3xl font-bold">{c.v.toLocaleString("pt-BR")}</p>
            <p className="mt-1 text-sm text-mute">{c.h}</p>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <h2 className="font-display font-semibold">Contatos por dia</h2>
          {st.daily.length ? (
            <div className="mt-4 flex h-40 items-end gap-1" role="img" aria-label="Contatos recebidos por dia">
              {st.daily.map((d) => (
                <div key={d.day} title={`${d.day.split("-").reverse().join("/")}: ${d.total}`} className="flex-1 rounded-t bg-primary/80" style={{ height: `${(d.total / maxDay) * 100}%`, minHeight: 4 }} />
              ))}
            </div>
          ) : <p className="mt-4 text-mute">Quando chegarem contatos, o gráfico aparece aqui.</p>}
        </Card>
        <Card className="lg:col-span-2">
          <h2 className="font-display font-semibold">De onde vieram</h2>
          {st.sources.length ? (
            <ul className="mt-4 space-y-3">
              {st.sources.map((x) => (
                <li key={x.label}>
                  <div className="flex justify-between text-[15px]"><span>{x.label}</span><span className="font-semibold">{x.total}</span></div>
                  <div className="mt-1 h-2 rounded-full bg-primary-soft"><div className="h-2 rounded-full bg-primary" style={{ width: `${(x.total / maxSrc) * 100}%` }} /></div>
                </li>
              ))}
            </ul>
          ) : <p className="mt-4 text-mute">Ainda sem contatos neste período.</p>}
        </Card>
      </div>
    </>
  );
}
