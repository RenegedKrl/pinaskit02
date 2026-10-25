"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setStatus } from "@/app/painel/contatos/actions";
import { stageName, type Stage } from "@/lib/stages";

/** Muda a etapa do contato (lista e funil): salva ao escolher, avisa e recarrega os dados. */
export function StatusSelect({ id, status, stages, disabled, className = "" }: { id: string; status: string; stages: Pick<Stage, "key" | "name">[]; disabled?: boolean; className?: string }) {
  const [value, setValue] = useState(status);
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  function change(next: string) {
    const before = value;
    setValue(next);
    const fd = new FormData();
    fd.set("id", id);
    fd.set("status", next);
    start(async () => {
      try { const r = await setStatus(fd); if (!r.ok) throw new Error(); setMsg(`Movido para ${stageName(stages, next)}`); router.refresh(); }
      catch { setValue(before); setMsg("Não foi possível salvar. Tente de novo."); }
    });
  }
  return (
    <div>
      <select value={value} disabled={disabled || pending} aria-label="Etapa do contato" onChange={(e) => change(e.target.value)}
        className={`h-9 max-w-full rounded-lg border border-line bg-card px-2 text-sm disabled:opacity-70 ${className}`}>
        {stages.map((s) => <option key={s.key} value={s.key}>{s.name}</option>)}
      </select>
      {msg && <p role="status" className="mt-1 text-xs text-mute">{msg}</p>}
    </div>
  );
}
