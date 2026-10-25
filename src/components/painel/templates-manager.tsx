"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { deleteTemplate, saveTemplate } from "@/app/painel/configuracoes/mensagens-actions";
import { fillTemplate, TEMPLATE_VARS } from "@/lib/messages";
import { Button, Card } from "@/components/ui";

interface T { id: string; name: string; body: string }
const field = "w-full rounded-lg border border-line bg-card px-3 py-2 text-sm";
const SAMPLE = { name: "Ana Souza", source_label: "Google Ads" };

/** Configurações → Mensagens prontas de WhatsApp (criar, editar, apagar) com prévia preenchida. */
export function TemplatesManager({ templates, edit }: { templates: T[]; edit: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState<T | null>(null);
  const [name, setName] = useState(""); const [body, setBody] = useState("");
  const [msg, setMsg] = useState("");
  const isNew = editing?.id === "";

  function open(t: T | null) { setEditing(t ?? { id: "", name: "", body: "" }); setName(t?.name ?? ""); setBody(t?.body ?? "Olá {primeiro_nome}! Tudo bem? Vi que você veio pelo {origem}. Como posso ajudar?"); setMsg(""); }
  function run(fn: () => Promise<{ ok: boolean; error?: string }>, ok: string, after?: () => void) {
    start(async () => { const r = await fn(); setMsg(r.ok ? ok : r.error ?? "Erro"); if (r.ok) { after?.(); router.refresh(); } });
  }

  return (
    <Card>
      <div id="mensagens" className="mb-3 flex scroll-mt-24 flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-semibold">Mensagens prontas de WhatsApp</h2>
          <p className="text-sm text-mute">Aparecem na ficha do contato, já com o nome dele. Use {TEMPLATE_VARS.join(", ")}.</p>
        </div>
        {edit && !editing && <Button size="sm" onClick={() => open(null)}><Plus size={15} />Nova mensagem</Button>}
      </div>

      {editing && (
        <form className="mb-4 space-y-2 rounded-xl border border-line p-3" onSubmit={(e) => { e.preventDefault(); run(() => saveTemplate(isNew ? null : editing.id, name, body), "Mensagem salva", () => setEditing(null)); }}>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Nome (ex.: Primeiro contato)" className={field} aria-label="Nome da mensagem" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={1000} rows={4} className={field} aria-label="Texto da mensagem" />
          <div className="flex flex-wrap gap-1">
            {TEMPLATE_VARS.map((v) => <button key={v} type="button" onClick={() => setBody((b) => `${b}${b.endsWith(" ") || !b ? "" : " "}${v}`)} className="rounded-md border border-line px-2 py-1 text-xs font-semibold hover:bg-bg">+ {v}</button>)}
          </div>
          <p className="rounded-lg bg-bg p-2 text-sm"><span className="text-xs font-semibold text-mute">Prévia: </span>{fillTemplate(body, SAMPLE)}</p>
          <div className="flex gap-2">
            <Button size="sm" disabled={pending}>Salvar</Button>
            <Button size="sm" type="button" variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
          </div>
        </form>
      )}

      {templates.length ? (
        <ul className="divide-y divide-line">
          {templates.map((t) => (
            <li key={t.id} className="flex items-start justify-between gap-3 py-3">
              <div className="min-w-0"><p className="font-medium">{t.name}</p><p className="line-clamp-2 text-sm text-mute">{t.body}</p></div>
              {edit && (
                <div className="flex shrink-0 gap-1">
                  <button onClick={() => open(t)} aria-label={`Editar ${t.name}`} className="rounded-lg border border-line p-2 hover:bg-bg"><Pencil size={14} /></button>
                  <button onClick={() => { if (confirm(`Apagar a mensagem "${t.name}"?`)) run(() => deleteTemplate(t.id), "Mensagem apagada"); }} aria-label={`Apagar ${t.name}`} className="rounded-lg border border-line p-2 text-red-700 hover:bg-red-50"><Trash2 size={14} /></button>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : !editing && <p className="text-sm text-mute">Nenhuma mensagem pronta ainda. Crie uma para responder seus contatos mais rápido.</p>}
      {msg && <p role="status" className="mt-2 text-xs text-mute">{msg}</p>}
    </Card>
  );
}
