"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Repeat, Trash2 } from "lucide-react";
import { deleteSequence, saveSequence } from "@/app/painel/automacoes/actions";
import type { SeqStep } from "@/lib/crm";
import { Button, Card, Field, Input, Textarea } from "@/components/ui";

export interface Seq { id: string; name: string; steps: SeqStep[]; active: boolean; running: number }

const EXAMPLE: SeqStep[] = [
  { day: 1, title: "Primeiro contato", message: "Oi {primeiro_nome}! Vi que você deixou seu contato no nosso site. Posso te ajudar com alguma dúvida?" },
  { day: 3, title: "Retomar conversa", message: "Oi {primeiro_nome}, tudo bem? Separei algumas opções que podem te interessar. Quer que eu mande?" },
  { day: 7, title: "Última tentativa", message: "Oi {primeiro_nome}! Vou deixar seu atendimento em aberto. Quando quiser continuar, é só me chamar aqui." },
];

function Editor({ seq, onDone }: { seq?: Seq; onDone: () => void }) {
  const router = useRouter(); const [pending, start] = useTransition(); const [err, setErr] = useState("");
  const [name, setName] = useState(seq?.name ?? "Acompanhamento de novos contatos"); const [steps, setSteps] = useState<SeqStep[]>(seq?.steps ?? EXAMPLE);
  const [active, setActive] = useState(seq?.active ?? true);
  const setStep = (i: number, p: Partial<SeqStep>) => setSteps((l) => l.map((s, j) => (j === i ? { ...s, ...p } : s)));
  return (
    <form className="space-y-3 rounded-xl bg-bg p-4" onSubmit={(e) => { e.preventDefault(); setErr(""); start(async () => { const r = await saveSequence({ id: seq?.id, name, steps, active }); if (!r.ok) return setErr(r.error ?? "Erro."); onDone(); router.refresh(); }); }}>
      <Field label="Nome da sequência"><Input required maxLength={60} value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <ol className="space-y-3">{steps.map((s, i) => (
        <li key={i} className="rounded-xl border border-line bg-card p-3">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-sm font-semibold">Dia</span><Input aria-label="Dia" type="number" min={1} max={365} value={s.day} onChange={(e) => setStep(i, { day: Number(e.target.value) })} className="w-20" />
            <Input aria-label="Título" maxLength={140} placeholder="Título (opcional)" value={s.title} onChange={(e) => setStep(i, { title: e.target.value })} className="flex-1" />
            <button type="button" aria-label="Remover passo" disabled={steps.length === 1} onClick={() => setSteps((l) => l.filter((_, j) => j !== i))} className="text-mute hover:text-red-700 disabled:opacity-30"><Trash2 size={15} /></button>
          </div>
          <Textarea aria-label="Mensagem" rows={2} maxLength={1000} value={s.message} onChange={(e) => setStep(i, { message: e.target.value })} />
        </li>
      ))}</ol>
      {steps.length < 10 && <Button type="button" size="sm" variant="ghost" onClick={() => setSteps((l) => [...l, { day: (l.at(-1)?.day ?? 0) + 3, title: "", message: "" }])}><Plus size={14} />Adicionar passo</Button>}
      <p className="text-xs text-mute">Dia 1 = no dia em que você inicia. Use {"{primeiro_nome}"} e {"{nome}"}.</p>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="size-4 accent-primary" />Disponível para usar</label>
      {err && <p className="text-sm text-red-700">{err}</p>}
      <div className="flex gap-2"><Button size="sm" disabled={pending}>{pending ? "Salvando…" : "Salvar sequência"}</Button><Button type="button" size="sm" variant="ghost" onClick={onDone}>Cancelar</Button></div>
    </form>
  );
}

/** Sequências de acompanhamento: cada passo vira tarefa com mensagem pronta no WhatsApp. */
export function SequencesManager({ sequences, edit }: { sequences: Seq[]; edit: boolean }) {
  const router = useRouter(); const [editing, setEditing] = useState<string | null>(null); const [, start] = useTransition();
  return (
    <Card>
      <h2 className="mb-1 flex items-center gap-2 font-display font-semibold"><Repeat size={17} className="text-primary" />Sequências de mensagens</h2>
      <p className="mb-4 text-sm text-mute">Monte “dia 1, dia 3, dia 7”. Na ficha do contato, clique em Iniciar: cada mensagem aparece no Meu dia na data certa, com o texto pronto para enviar com um clique.</p>
      <ul className="space-y-2">{sequences.map((s) => editing === s.id ? <li key={s.id}><Editor seq={s} onDone={() => setEditing(null)} /></li> : (
        <li key={s.id} className="flex items-start gap-3 rounded-xl border border-line p-3">
          <div className="min-w-0 flex-1"><p className="font-semibold">{s.name}{!s.active && <span className="ml-2 text-xs font-normal text-mute">(desligada)</span>}</p>
            <p className="text-sm text-mute">{s.steps.map((x) => `dia ${x.day}`).join(" · ")}{s.running ? ` · ${s.running} contatos em andamento` : ""}</p></div>
          {edit && <><button type="button" aria-label="Editar sequência" onClick={() => setEditing(s.id)} className="text-mute hover:text-ink"><Pencil size={15} /></button>
            <button type="button" aria-label="Apagar sequência" onClick={() => start(async () => { await deleteSequence(s.id); router.refresh(); })} className="text-mute hover:text-red-700"><Trash2 size={15} /></button></>}
        </li>
      ))}</ul>
      {!sequences.length && editing !== "new" && <p className="mb-2 text-sm text-mute">Nenhuma sequência ainda.</p>}
      {edit && (editing === "new" ? <div className="mt-3"><Editor onDone={() => setEditing(null)} /></div>
        : <Button type="button" size="sm" variant="outline" className="mt-3" onClick={() => setEditing("new")}><Plus size={15} />Nova sequência</Button>)}
    </Card>
  );
}
