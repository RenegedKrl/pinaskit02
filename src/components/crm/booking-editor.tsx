"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, ExternalLink, Pencil, Plus } from "lucide-react";
import { saveBookingPage, type PageInput } from "@/app/painel/agenda/actions";
import { slugify } from "@/lib/crm";
import { cn } from "@/lib/utils";
import { Button, Card, Field, Input, Textarea } from "@/components/ui";

export interface BookingPage extends PageInput { id: string }
const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const blank: PageInput = { slug: "", title: "Avaliação", description: "", duration_min: 30, days: [1, 2, 3, 4, 5], start_time: "09:00", end_time: "18:00", window_days: 14, min_notice_hours: 2, active: true };

function Form({ initial, onDone }: { initial: PageInput & { id?: string }; onDone: () => void }) {
  const router = useRouter(); const [pending, start] = useTransition(); const [err, setErr] = useState("");
  const [p, setP] = useState(initial); const set = (x: Partial<PageInput>) => setP((o) => ({ ...o, ...x }));
  return (
    <form className="space-y-3 rounded-xl bg-bg p-4" onSubmit={(e) => { e.preventDefault(); setErr(""); start(async () => { const r = await saveBookingPage(p); if (!r.ok) return setErr(r.error ?? "Erro."); onDone(); router.refresh(); }); }}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nome do atendimento"><Input required maxLength={80} value={p.title} onChange={(e) => set({ title: e.target.value, slug: p.id ? p.slug : slugify(e.target.value) })} /></Field>
        <Field label="Endereço" hint="pinaskit.com.br/agendar/…"><Input required value={p.slug} onChange={(e) => set({ slug: slugify(e.target.value) })} /></Field>
      </div>
      <Field label="Descrição (opcional)"><Textarea rows={2} maxLength={300} value={p.description} onChange={(e) => set({ description: e.target.value })} placeholder="Ex.: avaliação gratuita de 30 minutos com nossa equipe." /></Field>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Dias">{DAYS.map((d, i) => {
        const on = p.days.includes(i);
        return <button key={d} type="button" aria-pressed={on} onClick={() => set({ days: on ? p.days.filter((x) => x !== i) : [...p.days, i] })}
          className={cn("h-10 w-12 rounded-lg border text-sm font-semibold", on ? "border-primary bg-primary text-white" : "border-line bg-card text-mute")}>{d}</button>;
      })}</div>
      <div className="grid gap-3 sm:grid-cols-4">
        <Field label="Das"><Input type="time" value={p.start_time} onChange={(e) => set({ start_time: e.target.value })} /></Field>
        <Field label="Até"><Input type="time" value={p.end_time} onChange={(e) => set({ end_time: e.target.value })} /></Field>
        <Field label="Duração (min)"><Input type="number" min={10} max={240} step={5} value={p.duration_min} onChange={(e) => set({ duration_min: Number(e.target.value) })} /></Field>
        <Field label="Antecedência (h)"><Input type="number" min={0} max={72} value={p.min_notice_hours} onChange={(e) => set({ min_notice_hours: Number(e.target.value) })} /></Field>
      </div>
      <Field label={`Mostrar os próximos ${p.window_days} dias`}><input type="range" min={1} max={60} value={p.window_days} onChange={(e) => set({ window_days: Number(e.target.value) })} className="w-full accent-primary" /></Field>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={p.active} onChange={(e) => set({ active: e.target.checked })} className="size-4 accent-primary" />Aceitando agendamentos</label>
      {err && <p className="text-sm text-red-700">{err}</p>}
      <div className="flex gap-2"><Button size="sm" disabled={pending}>{pending ? "Salvando…" : "Salvar"}</Button><Button type="button" size="sm" variant="ghost" onClick={onDone}>Cancelar</Button></div>
    </form>
  );
}

/** Páginas de agendamento da conta, com link para copiar. */
export function BookingPages({ pages, admin, appUrl }: { pages: BookingPage[]; admin: boolean; appUrl: string }) {
  const [editing, setEditing] = useState<string | null>(null); const [copied, setCopied] = useState("");
  return (
    <Card>
      <h2 className="mb-1 font-display font-semibold">Links de agendamento</h2>
      <p className="mb-3 text-sm text-mute">O cliente escolhe o horário livre, vira contato no funil com a origem “Agendamento” e você recebe a tarefa no Meu dia.</p>
      <ul className="space-y-2">{pages.map((p) => editing === p.id ? <li key={p.id}><Form initial={p} onDone={() => setEditing(null)} /></li> : (
        <li key={p.id} className={cn("rounded-xl border border-line p-3", !p.active && "opacity-60")}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><p className="font-semibold">{p.title}</p><p className="text-sm text-mute">{p.duration_min} min · {p.days.map((d) => DAYS[d]).join(", ")} · {p.start_time}–{p.end_time}</p></div>
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={() => { navigator.clipboard.writeText(`${appUrl}/agendar/${p.slug}`); setCopied(p.id); setTimeout(() => setCopied(""), 1500); }} className="inline-flex h-9 items-center gap-1 rounded-lg border border-line px-2.5 text-sm">{copied === p.id ? <Check size={14} /> : <Copy size={14} />}Copiar link</button>
              <a href={`/agendar/${p.slug}`} target="_blank" rel="noopener" className="inline-flex h-9 items-center rounded-lg px-2 text-mute hover:text-ink" aria-label="Abrir página"><ExternalLink size={15} /></a>
              {admin && <button type="button" onClick={() => setEditing(p.id)} className="inline-flex h-9 items-center rounded-lg px-2 text-mute hover:text-ink" aria-label="Editar"><Pencil size={15} /></button>}
            </div>
          </div>
        </li>
      ))}</ul>
      {!pages.length && editing !== "new" && <p className="mb-2 text-sm text-mute">Nenhum link de agenda ainda.</p>}
      {admin && (editing === "new" ? <div className="mt-3"><Form initial={blank} onDone={() => setEditing(null)} /></div>
        : <Button type="button" size="sm" variant="outline" className="mt-3" onClick={() => setEditing("new")}><Plus size={15} />Novo link de agenda</Button>)}
    </Card>
  );
}
