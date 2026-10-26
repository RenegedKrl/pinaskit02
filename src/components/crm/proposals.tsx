"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, ExternalLink, FileText, Plus, Trash2 } from "lucide-react";
import { createProposal, deleteProposal } from "@/app/painel/negocios/actions";
import { brl } from "@/lib/plan";
import { proposalTotal, type PropItem } from "@/lib/crm";
import { cn } from "@/lib/utils";
import { Button, Card, Field, Input, Textarea } from "@/components/ui";
import { WaButton } from "./tasks";
import type { Product } from "./deals";

export interface Proposal { id: string; token: string; title: string; total: number; status: string; created_at: string; viewed_at: string | null; answered_at: string | null; decline_reason: string | null }
const ST: Record<string, [string, string]> = {
  sent: ["Enviada", "bg-primary-soft text-primary"], viewed: ["Vista pelo cliente", "bg-amber-100 text-amber-800"],
  accepted: ["Aceita ✓", "bg-emerald-100 text-emerald-800"], declined: ["Recusada", "bg-red-50 text-red-800"],
};

function Creator({ leadId, deals, products, onDone }: { leadId: string; deals: { id: string; title: string }[]; products: Product[]; onDone: (token: string) => void }) {
  const router = useRouter(); const [pending, start] = useTransition(); const [err, setErr] = useState("");
  const [title, setTitle] = useState("Proposta"); const [items, setItems] = useState<PropItem[]>([{ name: "", qty: 1, price: 0 }]);
  const [discount, setDiscount] = useState(""); const [notes, setNotes] = useState(""); const [dealId, setDealId] = useState("");
  const [valid, setValid] = useState(() => new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10));
  const disc = Number(discount.replace(",", ".")) || 0; const { subtotal, total } = proposalTotal(items, disc);
  const setItem = (i: number, patch: Partial<PropItem>) => setItems((l) => l.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  return (
    <form className="space-y-3 rounded-xl bg-bg p-3" onSubmit={(e) => { e.preventDefault(); setErr(""); start(async () => {
      const r = await createProposal({ leadId, dealId: dealId || null, title, items, discount: disc, notes, validUntil: valid || null });
      if (!r.ok || !r.token) return setErr(r.error ?? "Erro."); onDone(r.token); router.refresh();
    }); }}>
      <Field label="Título"><Input required maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
      <div className="space-y-2">
        <p className="text-sm font-semibold">Itens</p>
        {items.map((it, i) => (
          <div key={i} className="grid grid-cols-[1fr_64px_100px_28px] items-center gap-2">
            <Input aria-label="Item" list="pk-products" placeholder="Descrição" value={it.name} onChange={(e) => { const p = products.find((x) => x.name === e.target.value); setItem(i, { name: e.target.value, ...(p ? { price: p.price } : {}) }); }} />
            <Input aria-label="Quantidade" type="number" min={1} value={it.qty} onChange={(e) => setItem(i, { qty: Number(e.target.value) })} />
            <Input aria-label="Preço" type="number" min={0} step="0.01" value={it.price} onChange={(e) => setItem(i, { price: Number(e.target.value) })} />
            <button type="button" aria-label="Remover item" disabled={items.length === 1} onClick={() => setItems((l) => l.filter((_, j) => j !== i))} className="text-mute hover:text-red-700 disabled:opacity-30"><Trash2 size={15} /></button>
          </div>
        ))}
        <datalist id="pk-products">{products.filter((p) => p.active).map((p) => <option key={p.id} value={p.name} />)}</datalist>
        <Button type="button" size="sm" variant="ghost" onClick={() => setItems((l) => [...l, { name: "", qty: 1, price: 0 }])}><Plus size={14} />Adicionar item</Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Desconto (R$)"><Input inputMode="decimal" placeholder="0,00" value={discount} onChange={(e) => setDiscount(e.target.value)} /></Field>
        <Field label="Válida até"><Input type="date" value={valid} onChange={(e) => setValid(e.target.value)} /></Field>
        {deals.length > 0 && <Field label="Negociação"><select value={dealId} onChange={(e) => setDealId(e.target.value)} className="h-11 w-full rounded-lg border border-line bg-card px-3"><option value="">Nenhuma</option>{deals.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}</select></Field>}
      </div>
      <Field label="Condições e observações"><Textarea rows={3} maxLength={2000} placeholder="Ex.: pagamento em até 10x, prazo de entrega, garantia…" value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
      <div className="flex items-center justify-between rounded-lg bg-card px-3 py-2"><span className="text-sm text-mute">Subtotal {brl(subtotal)}{disc ? ` · desconto ${brl(disc)}` : ""}</span><b className="font-display text-lg">{brl(total)}</b></div>
      {err && <p className="text-sm text-red-700">{err}</p>}
      <Button size="sm" disabled={pending}>{pending ? "Criando…" : "Criar proposta"}</Button>
    </form>
  );
}

/** Propostas do contato: cria, copia o link e manda pelo WhatsApp. Aceite do cliente move para Venda. */
export function ProposalsPanel({ leadId, phone, name, proposals, deals, products, edit, appUrl }: { leadId: string; phone: string; name: string | null; proposals: Proposal[]; deals: { id: string; title: string }[]; products: Product[]; edit: boolean; appUrl: string }) {
  const router = useRouter(); const [creating, setCreating] = useState(false); const [copied, setCopied] = useState(""); const [fresh, setFresh] = useState("");
  const url = (t: string) => `${appUrl}/p/${t}`;
  const msg = (t: string) => `Olá${name ? `, ${name.split(" ")[0]}` : ""}! Segue sua proposta. É só abrir e clicar em "Aceitar": ${url(t)}`;
  return (
    <Card>
      <h2 className="mb-3 flex items-center gap-2 font-display font-semibold"><FileText size={17} className="text-primary" />Propostas</h2>
      <ul className="space-y-2">{proposals.map((p) => {
        const [l, c] = ST[p.status] ?? ST.sent;
        return (
          <li key={p.id} className={cn("rounded-xl border p-3", p.token === fresh ? "border-primary" : "border-line")}>
            <div className="flex items-start justify-between gap-2"><div><p className="font-semibold">{p.title}</p><span className={cn("rounded px-1.5 py-0.5 text-[11px] font-semibold", c)}>{l}</span>
              {p.decline_reason && <p className="mt-1 text-sm text-mute">Motivo: {p.decline_reason}</p>}</div><b className="font-display tabular-nums">{brl(Number(p.total))}</b></div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {p.status !== "accepted" && <WaButton leadId={leadId} phone={phone} text={msg(p.token)} label="Enviar" />}
              <button type="button" onClick={() => { navigator.clipboard.writeText(url(p.token)); setCopied(p.id); setTimeout(() => setCopied(""), 1500); }} className="inline-flex h-9 items-center gap-1 rounded-lg border border-line px-2.5 text-sm">{copied === p.id ? <Check size={14} /> : <Copy size={14} />}Link</button>
              <a href={url(p.token)} target="_blank" rel="noopener" className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-sm text-mute hover:text-ink"><ExternalLink size={14} />Ver</a>
              {edit && p.status !== "accepted" && <button type="button" aria-label="Apagar proposta" onClick={() => deleteProposal(p.id).then(() => router.refresh())} className="ml-auto text-mute hover:text-red-700"><Trash2 size={14} /></button>}
            </div>
          </li>
        );
      })}</ul>
      {!proposals.length && !creating && <p className="mb-2 text-sm text-mute">Monte um orçamento e mande o link: o cliente abre, vê os itens e aceita com um clique.</p>}
      {edit && (creating ? <div className="mt-2"><Creator leadId={leadId} deals={deals} products={products} onDone={(t) => { setCreating(false); setFresh(t); }} /></div>
        : <Button type="button" size="sm" variant="outline" className="mt-2" onClick={() => setCreating(true)}><Plus size={15} />Nova proposta</Button>)}
    </Card>
  );
}
