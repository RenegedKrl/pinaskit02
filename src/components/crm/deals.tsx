"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { closeDeal, deleteDeal, saveDeal } from "@/app/painel/negocios/actions";
import { brl } from "@/lib/plan";
import { cn } from "@/lib/utils";
import { Button, Card, Field, Input, Select } from "@/components/ui";

export interface Deal { id: string; title: string; product_id: string | null; value: number; expected_close: string | null; probability: number; status: string; lead_id: string; leads?: { name: string | null } | null }
export interface Product { id: string; name: string; price: number; active: boolean }

export const DEAL_STATUS: Record<string, [string, string]> = {
  open: ["Em aberto", "bg-primary-soft text-primary"], won: ["Ganha", "bg-emerald-100 text-emerald-800"], lost: ["Perdida", "bg-bg text-mute"],
};

export function DealForm({ leadId, products, deal, onDone }: { leadId: string; products: Product[]; deal?: Deal; onDone: () => void }) {
  const router = useRouter(); const [pending, start] = useTransition(); const [err, setErr] = useState("");
  const [title, setTitle] = useState(deal?.title ?? ""); const [productId, setProductId] = useState(deal?.product_id ?? "");
  const [value, setValue] = useState(deal ? String(deal.value) : ""); const [close, setClose] = useState(deal?.expected_close ?? "");
  const [prob, setProb] = useState(deal?.probability ?? 50);
  const pick = (id: string) => { setProductId(id); const p = products.find((x) => x.id === id); if (p) { if (!title) setTitle(p.name); if (!value) setValue(String(p.price)); } };
  return (
    <form className="space-y-3 rounded-xl bg-bg p-3" onSubmit={(e) => { e.preventDefault(); setErr(""); start(async () => {
      const r = await saveDeal({ id: deal?.id, leadId, title, productId: productId || null, value: Number(value.replace(/\./g, "").replace(",", ".")) || 0, expectedClose: close || null, probability: prob });
      if (!r.ok) return setErr(r.error ?? "Erro."); onDone(); router.refresh();
    }); }}>
      {products.length > 0 && <Field label="Produto ou serviço"><Select value={productId} onChange={(e) => pick(e.target.value)}><option value="">Nenhum (só o valor)</option>{products.filter((p) => p.active || p.id === productId).map((p) => <option key={p.id} value={p.id}>{p.name} · {brl(p.price)}</option>)}</Select></Field>}
      <Field label="Nome da negociação"><Input required maxLength={120} placeholder="Ex.: Implante + clareamento" value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Valor (R$)"><Input inputMode="decimal" placeholder="0,00" value={value} onChange={(e) => setValue(e.target.value)} /></Field>
        <Field label="Previsão de fechamento"><Input type="date" value={close} onChange={(e) => setClose(e.target.value)} /></Field>
      </div>
      <Field label={`Chance de fechar: ${prob}%`}><input type="range" min={0} max={100} step={10} value={prob} onChange={(e) => setProb(Number(e.target.value))} className="w-full accent-primary" /></Field>
      {err && <p className="text-sm text-red-700">{err}</p>}
      <div className="flex gap-2"><Button size="sm" disabled={pending}>{pending ? "Salvando…" : "Salvar"}</Button><Button type="button" size="sm" variant="ghost" onClick={onDone}>Cancelar</Button></div>
    </form>
  );
}

export function DealRow({ d, products, edit, showLead }: { d: Deal; products: Product[]; edit: boolean; showLead?: boolean }) {
  const router = useRouter(); const [pending, start] = useTransition(); const [editing, setEditing] = useState(false);
  const [label, cls] = DEAL_STATUS[d.status] ?? DEAL_STATUS.open;
  const run = (fn: () => Promise<unknown>) => start(async () => { await fn(); router.refresh(); });
  if (editing) return <li><DealForm leadId={d.lead_id} products={products} deal={d} onDone={() => setEditing(false)} /></li>;
  return (
    <li className={cn("rounded-xl border border-line p-3", pending && "opacity-60")}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold [overflow-wrap:anywhere]">{d.title}</p>
          <p className="text-sm text-mute">{showLead && d.leads ? `${d.leads.name || "Sem nome"} · ` : ""}{d.expected_close ? `fecha em ${d.expected_close.split("-").reverse().join("/")}` : "sem previsão"} · {d.probability}% de chance</p>
        </div>
        <div className="text-right"><p className="font-display text-lg font-bold tabular-nums">{brl(Number(d.value))}</p><span className={cn("rounded px-1.5 py-0.5 text-[11px] font-semibold", cls)}>{label}</span></div>
      </div>
      {edit && (
        <div className="mt-2 flex flex-wrap gap-1.5 text-sm">
          {d.status === "open" ? <>
            <button type="button" onClick={() => run(() => closeDeal(d.id, "won"))} className="rounded-lg bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-800 hover:brightness-95">Ganhou</button>
            <button type="button" onClick={() => run(() => closeDeal(d.id, "lost"))} className="rounded-lg bg-bg px-2.5 py-1 font-semibold text-mute hover:text-ink">Perdeu</button>
            <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-mute hover:text-ink"><Pencil size={13} />Editar</button>
          </> : <button type="button" onClick={() => run(() => closeDeal(d.id, "open"))} className="rounded-lg px-2 py-1 text-mute hover:text-ink">Reabrir</button>}
          <button type="button" aria-label="Apagar negociação" onClick={() => run(() => deleteDeal(d.id))} className="ml-auto rounded-lg px-2 py-1 text-mute hover:text-red-700"><Trash2 size={14} /></button>
        </div>
      )}
    </li>
  );
}

/** Negociações do contato (ficha). */
export function DealsPanel({ leadId, deals, products, edit }: { leadId: string; deals: Deal[]; products: Product[]; edit: boolean }) {
  const [adding, setAdding] = useState(false);
  const open = deals.filter((d) => d.status === "open").reduce((a, d) => a + Number(d.value), 0);
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-display font-semibold">Negociações</h2>
        {open > 0 && <span className="text-sm text-mute">{brl(open)} em aberto</span>}
      </div>
      <ul className="space-y-2">{deals.map((d) => <DealRow key={d.id} d={d} products={products} edit={edit} />)}</ul>
      {!deals.length && !adding && <p className="mb-2 text-sm text-mute">Nenhuma negociação. Crie uma para acompanhar valor, previsão e chance de fechar.</p>}
      {edit && (adding ? <div className="mt-2"><DealForm leadId={leadId} products={products} onDone={() => setAdding(false)} /></div>
        : <Button type="button" size="sm" variant="outline" className="mt-2" onClick={() => setAdding(true)}><Plus size={15} />Nova negociação</Button>)}
    </Card>
  );
}
