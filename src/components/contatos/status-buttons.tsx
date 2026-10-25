"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setStatus } from "@/app/painel/contatos/actions";
import { STATUS } from "@/lib/copy";

/** Etapas da ficha: marca a escolhida na hora e recarrega os dados do servidor. */
export function StatusButtons({ id, status, disabled }: { id: string; status: string; disabled?: boolean }) {
  const [current, setCurrent] = useState(status);
  const [pending, start] = useTransition();
  const router = useRouter();
  function pick(next: string) {
    if (next === current || disabled) return;
    const before = current;
    setCurrent(next);
    const fd = new FormData();
    fd.set("id", id);
    fd.set("status", next);
    start(async () => {
      try { await setStatus(fd); router.refresh(); } catch { setCurrent(before); }
    });
  }
  return (
    <div className="mt-3 flex flex-wrap gap-2" aria-busy={pending}>
      {STATUS.map((s) => (
        <button key={s.id} type="button" onClick={() => pick(s.id)} disabled={disabled} title={s.hint} aria-pressed={current === s.id}
          className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${current === s.id ? "border-primary bg-primary text-white" : "border-line bg-card hover:border-primary"}`}>{s.label}</button>
      ))}
    </div>
  );
}
