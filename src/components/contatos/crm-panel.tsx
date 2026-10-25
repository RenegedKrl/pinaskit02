"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BellRing, Tag, UserRound, X } from "lucide-react";
import { setFollowup, setOwner, setTags } from "@/app/painel/contatos/actions";
import { addTag, followupState, MAX_TAGS } from "@/lib/messages";
import { Card } from "@/components/ui";

const field = "h-10 w-full rounded-lg border border-line bg-card px-3 text-sm";
export interface Member { user_id: string; email: string | null }

/** Ficha do contato: responsável, etiquetas e lembrete de retorno. Salva sozinho. */
export function CrmPanel({ id, ownerId, tags, followupAt, followupNote, members, me, edit }: {
  id: string; ownerId: string | null; tags: string[]; followupAt: string | null; followupNote: string | null;
  members: Member[]; me: string; edit: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const [list, setList] = useState(tags);
  const [tagText, setTagText] = useState("");
  const local = followupAt ? toLocalInput(followupAt) : "";
  const [at, setAt] = useState(local);
  const [note, setNote] = useState(followupNote ?? "");
  const state = followupState(followupAt);

  function save(fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) {
    start(async () => { const r = await fn(); setMsg(r.ok ? ok : r.error ?? "Não foi possível salvar."); if (r.ok) router.refresh(); });
  }
  function changeTags(next: string[]) { setList(next); save(() => setTags(id, next), "Etiquetas salvas"); }

  return (
    <Card>
      <h2 className="mb-3 font-semibold">Atendimento</h2>
      <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-mute"><UserRound size={15} />Responsável</label>
      <select defaultValue={ownerId ?? ""} disabled={!edit || pending} onChange={(e) => save(() => setOwner(id, e.target.value), "Responsável salvo")} className={field}>
        <option value="">Ninguém</option>
        {members.map((m) => <option key={m.user_id} value={m.user_id}>{m.user_id === me ? `Eu (${m.email ?? "você"})` : m.email ?? "Pessoa da equipe"}</option>)}
      </select>

      <label className="mb-1 mt-4 flex items-center gap-1.5 text-sm font-medium text-mute"><Tag size={15} />Etiquetas</label>
      <div className="flex flex-wrap gap-1.5">
        {list.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-md bg-primary-soft px-2 py-1 text-xs font-semibold text-primary">
            {t}{edit && <button onClick={() => changeTags(list.filter((x) => x !== t))} aria-label={`Tirar etiqueta ${t}`} className="opacity-70 hover:opacity-100"><X size={12} /></button>}
          </span>
        ))}
        {!list.length && <span className="text-sm text-mute">Nenhuma etiqueta</span>}
      </div>
      {edit && list.length < MAX_TAGS && (
        <form className="mt-2" onSubmit={(e) => { e.preventDefault(); const next = addTag(list, tagText); setTagText(""); if (next !== list) changeTags(next); }}>
          <input value={tagText} onChange={(e) => setTagText(e.target.value)} maxLength={24} placeholder="Nova etiqueta e Enter (ex.: vip)" className={field} />
        </form>
      )}

      <label className="mb-1 mt-4 flex items-center gap-1.5 text-sm font-medium text-mute"><BellRing size={15} />Lembrete de retorno</label>
      {state !== "none" && (
        <p className={`mb-2 rounded-md px-2 py-1 text-xs font-semibold ${state === "late" ? "bg-red-50 text-red-700" : state === "today" ? "bg-amber-50 text-amber-900" : "bg-bg text-mute"}`}>
          {state === "late" ? "Atrasado" : state === "today" ? "Para hoje" : "Agendado"}{followupNote ? ` · ${followupNote}` : ""}
        </p>
      )}
      {edit ? (
        <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); save(() => setFollowup(id, at ? new Date(at).toISOString() : "", note), at ? "Lembrete salvo" : "Lembrete removido"); }}>
          <input type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} className={field} aria-label="Data e hora do retorno" />
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="O que fazer (ex.: mandar orçamento)" className={field} />
          <div className="flex gap-2">
            <button disabled={pending || !at} className="h-9 rounded-lg bg-primary px-3 text-sm font-semibold text-white disabled:opacity-50">Salvar lembrete</button>
            {followupAt && <button type="button" disabled={pending} onClick={() => { setAt(""); setNote(""); save(() => setFollowup(id, "", ""), "Lembrete removido"); }} className="h-9 rounded-lg border border-line px-3 text-sm font-semibold">Concluído</button>}
          </div>
        </form>
      ) : !followupAt && <p className="text-sm text-mute">Sem lembrete.</p>}
      {msg && <p role="status" className="mt-3 text-xs text-mute">{msg}</p>}
    </Card>
  );
}

function toLocalInput(iso: string): string {
  const d = new Date(iso); const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
