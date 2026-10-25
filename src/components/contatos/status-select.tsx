"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setStatus } from "@/app/painel/contatos/actions";
import { STATUS, statusLabel } from "@/lib/copy";

/** Muda a etapa do contato (lista e funil): salva ao escolher, avisa e recarrega os dados. */
export function StatusSelect({ id, status, disabled }: { id: string; status: string; disabled?: boolean }) {
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
      try { await setStatus(fd); setMsg(`Movido para ${statusLabel(next)}`); router.refresh(); }
      catch { setValue(before); setMsg("Não foi possível salvar. Tente de novo."); }
    });
  }
  return (
    <div>
      <select value={value} disabled={disabled || pending} aria-label="Etapa do contato" onChange={(e) => change(e.target.value)}
        className="h-9 rounded-lg border border-line bg-card px-2 text-sm disabled:opacity-70">
        {STATUS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
      </select>
      {msg && <p role="status" className="mt-1 text-xs text-mute">{msg}</p>}
    </div>
  );
}
