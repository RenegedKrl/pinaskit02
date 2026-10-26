"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setStatus } from "@/app/painel/contatos/actions";
import { stageName, type Stage } from "@/lib/stages";
import { stageForm, useCloseAsk } from "@/components/funil/close-dialog";

/** Muda a etapa do contato (lista e funil): pergunta valor/motivo ao fechar, salva, avisa e recarrega. */
export function StatusSelect({ id, status, stages, name = "Contato", disabled, className = "" }: { id: string; status: string; stages: Pick<Stage, "key" | "name" | "kind">[]; name?: string; disabled?: boolean; className?: string }) {
  const [value, setValue] = useState(status);
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  const { ask, dialog } = useCloseAsk(name, stages);
  function change(next: string) {
    const before = value;
    setValue(next);
    ask(next, (info) => start(async () => {
      try { const r = await setStatus(stageForm(id, next, info)); if (!r.ok) throw new Error(); setMsg(`Movido para ${stageName(stages, next)}`); router.refresh(); }
      catch { setValue(before); setMsg("Não foi possível salvar. Tente de novo."); }
    }), () => setValue(before));
  }
  return (
    <div>
      {dialog}
      <select value={value} disabled={disabled || pending} aria-label="Etapa do contato" onChange={(e) => change(e.target.value)}
        className={`h-9 max-w-full rounded-lg border border-line bg-card px-2 text-sm disabled:opacity-70 ${className}`}>
        {stages.map((s) => <option key={s.key} value={s.key}>{s.name}</option>)}
      </select>
      {msg && <p role="status" className="mt-1 text-xs text-mute">{msg}</p>}
    </div>
  );
}
