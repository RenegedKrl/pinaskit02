"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ListPlus, Trash2 } from "lucide-react";
import { addField, removeField } from "@/app/painel/configuracoes/fields-actions";
import { FIELD_TYPES, type FieldType } from "@/lib/fields";
import { Button, Card, Input, Select } from "@/components/ui";

export interface FieldRow { id: string; label: string; type: FieldType; options: string[] }

/** Campos personalizados do contato (CPF, cidade, interesse, data do evento…). */
export function FieldsManager({ fields, admin }: { fields: FieldRow[]; admin: boolean }) {
  const router = useRouter(); const [pending, start] = useTransition();
  const [label, setLabel] = useState(""); const [type, setType] = useState<FieldType>("text"); const [opts, setOpts] = useState(""); const [err, setErr] = useState("");
  return (
    <Card>
      <h2 className="mb-1 flex items-center gap-2 font-display font-semibold"><ListPlus size={17} className="text-primary" />Campos do contato</h2>
      <p className="mb-3 text-sm text-mute">O que importa para o seu negócio. Aparecem na ficha, nos filtros da lista e na planilha exportada.</p>
      <ul className="mb-3 divide-y divide-line">{fields.map((f) => (
        <li key={f.id} className="flex items-center justify-between gap-2 py-2 text-sm">
          <span><b>{f.label}</b> <span className="text-mute">· {FIELD_TYPES[f.type]}{f.type === "select" ? `: ${f.options.join(", ")}` : ""}</span></span>
          {admin && <button type="button" aria-label={`Apagar campo ${f.label}`} onClick={() => start(async () => { await removeField(f.id); router.refresh(); })} className="text-mute hover:text-red-700"><Trash2 size={15} /></button>}
        </li>
      ))}</ul>
      {!fields.length && <p className="mb-3 text-sm text-mute">Nenhum campo ainda. Exemplos: CPF, Cidade, Tratamento de interesse, Data do evento.</p>}
      {admin && fields.length < 20 && (
        <form className="space-y-2 rounded-xl bg-bg p-3" onSubmit={(e) => { e.preventDefault(); setErr(""); start(async () => {
          const r = await addField(label, type, opts.split(",")); if (!r.ok) return setErr(r.error ?? "Erro."); setLabel(""); setOpts(""); router.refresh();
        }); }}>
          <div className="grid gap-2 sm:grid-cols-[1fr_170px_auto]">
            <Input required maxLength={40} placeholder="Nome do campo" value={label} onChange={(e) => setLabel(e.target.value)} aria-label="Nome do campo" />
            <Select value={type} onChange={(e) => setType(e.target.value as FieldType)} aria-label="Tipo">{Object.entries(FIELD_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select>
            <Button size="sm" disabled={pending}>Criar campo</Button>
          </div>
          {type === "select" && <Input placeholder="Opções separadas por vírgula. Ex.: Botox, Preenchimento, Limpeza" value={opts} onChange={(e) => setOpts(e.target.value)} aria-label="Opções" />}
          {err && <p className="text-sm text-red-700">{err}</p>}
        </form>
      )}
    </Card>
  );
}
