"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Clock, Plus, Trash2 } from "lucide-react";
import { createTask, deleteTask, markContacted, snoozeTask, toggleTask } from "@/app/painel/tarefas/actions";
import { brDate, brTime, fillName, TASK_KIND, waLink } from "@/lib/crm";
import { cn } from "@/lib/utils";
import { Button, Input, Select, WhatsAppIcon } from "@/components/ui";

export interface TaskRow {
  id: string; title: string; kind: string; message: string | null; due_at: string; done_at: string | null; source: string;
  lead_id: string | null; assignee_id: string | null; leads?: { name: string | null; phone_e164: string } | null;
}

/** Abre o WhatsApp e marca o primeiro atendimento (e conclui a tarefa de mensagem, se houver). */
export function WaButton({ leadId, phone, text, taskId, label = "WhatsApp", className = "" }: { leadId: string; phone: string; text?: string | null; taskId?: string; label?: string; className?: string }) {
  const router = useRouter();
  return (
    <a href={waLink(phone, text)} target="_blank" rel="noopener" onClick={() => { markContacted(leadId, taskId).then(() => router.refresh()).catch(() => {}); }}
      className={cn("inline-flex h-9 items-center gap-1.5 rounded-lg bg-success px-3 text-sm font-semibold text-white hover:brightness-95", className)}>
      <WhatsAppIcon size={15} />{label}
    </a>
  );
}

const later = (days: number) => { const d = new Date(Date.now() + days * 86_400_000); d.setHours(9, 0, 0, 0); return d.toISOString(); };

export function TaskItem({ t, showLead, edit, members }: { t: TaskRow; showLead?: boolean; edit: boolean; members?: { user_id: string; email: string | null }[] }) {
  const router = useRouter(); const [pending, start] = useTransition();
  const [done, setDone] = useState(!!t.done_at);
  const k = TASK_KIND[t.kind] ?? TASK_KIND.other;
  const msg = t.message ? fillName(t.message, t.leads?.name ?? null) : null;
  const late = !done && new Date(t.due_at).getTime() < Date.now() - 60_000;
  const run = (fn: () => Promise<unknown>) => start(async () => { await fn().catch(() => {}); router.refresh(); });
  const who = members?.find((m) => m.user_id === t.assignee_id)?.email?.split("@")[0];
  return (
    <li className={cn("flex items-start gap-3 rounded-xl border border-line bg-card p-3 transition", done && "opacity-60", pending && "opacity-70")}>
      <button type="button" disabled={!edit} aria-label={done ? "Reabrir tarefa" : "Concluir tarefa"} onClick={() => { setDone(!done); run(() => toggleTask(t.id, !done)); }}
        className={cn("mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-2 transition", done ? "border-emerald-500 bg-emerald-500 text-white" : "border-line hover:border-primary")}>
        {done && <Check size={14} strokeWidth={3} />}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("rounded px-1.5 py-0.5 text-[11px] font-semibold", k.cls)}>{k.label}</span>
          <p className={cn("font-semibold [overflow-wrap:anywhere]", done && "line-through")}>{t.title}</p>
        </div>
        <p className={cn("mt-0.5 flex flex-wrap items-center gap-x-2 text-sm", late ? "font-semibold text-red-700" : "text-mute")}>
          <span className="inline-flex items-center gap-1"><Clock size={13} />{late ? "Atrasada · " : ""}{brDate(t.due_at)} {brTime(t.due_at)}</span>
          {showLead && t.lead_id && <Link href={`/painel/contatos/${t.lead_id}`} className="font-medium text-ink hover:text-primary">{t.leads?.name || "Contato sem nome"}</Link>}
          {who && <span>· {who}</span>}
          {t.source === "sequence" && <span>· sequência</span>}{t.source === "automation" && <span>· automática</span>}
        </p>
        {msg && <p className="mt-1.5 line-clamp-2 rounded-lg bg-bg px-2.5 py-1.5 text-sm text-mute">“{msg}”</p>}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        {t.lead_id && t.leads?.phone_e164 && !done && <WaButton leadId={t.lead_id} phone={t.leads.phone_e164} text={msg} taskId={msg ? t.id : undefined} label={msg ? "Enviar" : "WhatsApp"} />}
        {edit && !done && (
          <div className="flex gap-1 text-xs">
            <button type="button" onClick={() => run(() => snoozeTask(t.id, later(1)))} className="rounded-md px-1.5 py-1 text-mute hover:bg-bg hover:text-ink">+1 dia</button>
            <button type="button" onClick={() => run(() => snoozeTask(t.id, later(3)))} className="rounded-md px-1.5 py-1 text-mute hover:bg-bg hover:text-ink">+3</button>
            <button type="button" aria-label="Apagar tarefa" onClick={() => run(() => deleteTask(t.id))} className="rounded-md px-1.5 py-1 text-mute hover:bg-bg hover:text-red-700"><Trash2 size={13} /></button>
          </div>
        )}
      </div>
    </li>
  );
}

const local = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);

/** Formulário curto de nova tarefa. */
export function TaskForm({ leadId, members, me, compact }: { leadId: string | null; members: { user_id: string; email: string | null }[]; me: string; compact?: boolean }) {
  const router = useRouter(); const [pending, start] = useTransition();
  const [open, setOpen] = useState(!compact);
  const [title, setTitle] = useState(""); const [kind, setKind] = useState("call");
  const [due, setDue] = useState(() => { const d = new Date(Date.now() + 3600_000); d.setMinutes(0, 0, 0); return local(d); });
  const [who, setWho] = useState(me); const [err, setErr] = useState("");
  if (!open) return <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}><Plus size={15} />Nova tarefa</Button>;
  return (
    <form className="space-y-2 rounded-xl bg-bg p-3" onSubmit={(e) => { e.preventDefault(); setErr(""); start(async () => {
      const r = await createTask({ leadId, title, kind, dueAt: new Date(due).toISOString(), assigneeId: who });
      if (!r.ok) return setErr(r.error ?? "Erro.");
      setTitle(""); if (compact) setOpen(false); router.refresh();
    }); }}>
      <Input autoFocus required maxLength={140} placeholder="O que fazer? Ex.: ligar para confirmar orçamento" value={title} onChange={(e) => setTitle(e.target.value)} />
      <div className="grid gap-2 sm:grid-cols-3">
        <Select aria-label="Tipo" value={kind} onChange={(e) => setKind(e.target.value)}>{Object.entries(TASK_KIND).filter(([k]) => k !== "birthday").map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</Select>
        <Input aria-label="Quando" type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} />
        <Select aria-label="Responsável" value={who} onChange={(e) => setWho(e.target.value)}>{members.map((m) => <option key={m.user_id} value={m.user_id}>{m.user_id === me ? "Eu" : m.email}</option>)}</Select>
      </div>
      {err && <p className="text-sm text-red-700">{err}</p>}
      <div className="flex gap-2"><Button size="sm" disabled={pending}>{pending ? "Salvando…" : "Criar tarefa"}</Button>{compact && <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>}</div>
    </form>
  );
}
