"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Repeat, Smile } from "lucide-react";
import { npsLink, saveLeadExtra } from "@/app/painel/contatos/extra-actions";
import { startSequence, stopSequence } from "@/app/painel/tarefas/actions";
import type { CustomField } from "@/lib/fields";
import { Button, Card, Field, Input, Select } from "@/components/ui";
import { WaButton } from "./tasks";

/** Campos personalizados + aniversário do contato. */
export function CustomFieldsCard({ leadId, fields, values, birthday, edit }: { leadId: string; fields: CustomField[]; values: Record<string, unknown>; birthday: string | null; edit: boolean }) {
  const router = useRouter(); const [pending, start] = useTransition(); const [msg, setMsg] = useState("");
  const [v, setV] = useState<Record<string, string>>(() => Object.fromEntries(fields.map((f) => [f.key, values?.[f.key] == null ? "" : String(values[f.key])])));
  const [bday, setBday] = useState(birthday ?? "");
  return (
    <Card>
      <h2 className="mb-3 font-display font-semibold">Informações do contato</h2>
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await saveLeadExtra(leadId, v, bday); setMsg(r.ok ? "Salvo." : r.error ?? "Erro."); router.refresh(); }); }}>
        {fields.map((f) => (
          <Field key={f.key} label={f.label}>
            {f.type === "select"
              ? <Select disabled={!edit} value={v[f.key]} onChange={(e) => setV({ ...v, [f.key]: e.target.value })}><option value="">—</option>{f.options.map((o) => <option key={o}>{o}</option>)}</Select>
              : <Input disabled={!edit} type={f.type === "date" ? "date" : "text"} inputMode={f.type === "number" ? "decimal" : undefined} value={v[f.key]} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} />}
          </Field>
        ))}
        <Field label="Aniversário" hint="No dia, aparece uma tarefa com mensagem pronta de parabéns."><Input disabled={!edit} type="date" value={bday} onChange={(e) => setBday(e.target.value)} /></Field>
        {!fields.length && <p className="text-sm text-mute">Crie campos seus (CPF, cidade, interesse…) em Configurações › Campos do contato.</p>}
        {edit && <div className="flex items-center gap-3"><Button size="sm" variant="outline" disabled={pending}>Salvar</Button>{msg && <span className="text-sm text-mute">{msg}</span>}</div>}
      </form>
    </Card>
  );
}

export interface SeqLite { id: string; name: string; steps: unknown[] }

/** Sequência de acompanhamento do contato: iniciar ou parar. */
export function SequenceCard({ leadId, sequences, running, edit }: { leadId: string; sequences: SeqLite[]; running: { id: string; name: string; left: number }[]; edit: boolean }) {
  const router = useRouter(); const [pending, start] = useTransition(); const [pick, setPick] = useState(""); const [err, setErr] = useState("");
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => start(async () => { const r = await fn(); setErr(r.ok ? "" : r.error ?? "Erro."); router.refresh(); });
  return (
    <Card>
      <h2 className="mb-2 flex items-center gap-2 font-display font-semibold"><Repeat size={17} className="text-primary" />Sequência de mensagens</h2>
      {running.map((s) => (
        <div key={s.id} className="mb-2 flex items-center justify-between gap-2 rounded-lg bg-primary-soft/50 px-3 py-2 text-sm">
          <span><b>{s.name}</b> · faltam {s.left} {s.left === 1 ? "mensagem" : "mensagens"}</span>
          {edit && <button type="button" disabled={pending} onClick={() => run(() => stopSequence(leadId, s.id))} className="font-semibold text-red-700">Parar</button>}
        </div>
      ))}
      {!sequences.length ? <p className="text-sm text-mute">Crie sequências (dia 1, dia 3, dia 7…) em Automações › Sequências.</p>
        : edit && (
          <div className="flex gap-2">
            <Select aria-label="Sequência" value={pick} onChange={(e) => setPick(e.target.value)}><option value="">Escolha uma sequência</option>{sequences.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.steps.length} mensagens)</option>)}</Select>
            <Button type="button" size="sm" disabled={!pick || pending} onClick={() => run(() => startSequence(leadId, pick))}>Iniciar</Button>
          </div>
        )}
      <p className="mt-2 text-xs text-mute">Cada mensagem vira uma tarefa no Meu dia, na data certa, com o texto pronto. Para sozinha quando o contato vira venda ou não convertido.</p>
      {err && <p className="mt-1 text-sm text-red-700">{err}</p>}
    </Card>
  );
}

/** Envia o link da pesquisa de satisfação pelo WhatsApp. */
export function NpsCard({ leadId, phone, name, appUrl, last }: { leadId: string; phone: string; name: string | null; appUrl: string; last: { score: number; comment: string | null } | null }) {
  const [token, setToken] = useState<string | null>(null); const [pending, start] = useTransition();
  const text = token ? `Olá${name ? `, ${name.split(" ")[0]}` : ""}! Pode nos dar uma nota de 0 a 10 pelo atendimento? Leva 10 segundos: ${appUrl}/pesquisa/${token}` : "";
  return (
    <Card>
      <h2 className="mb-2 flex items-center gap-2 font-display font-semibold"><Smile size={17} className="text-primary" />Pesquisa de satisfação</h2>
      {last && <p className="mb-2 text-sm">Última nota: <b className={last.score >= 9 ? "text-emerald-700" : last.score <= 6 ? "text-red-700" : "text-amber-700"}>{last.score}</b>{last.comment ? ` · “${last.comment}”` : ""}</p>}
      {token ? <WaButton leadId={leadId} phone={phone} text={text} label="Enviar pesquisa" />
        : <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => start(async () => { const r = await npsLink(leadId); if (r.token) setToken(r.token); })}>Preparar link da pesquisa</Button>}
    </Card>
  );
}
