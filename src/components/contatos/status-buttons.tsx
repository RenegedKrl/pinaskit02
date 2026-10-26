"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setStatus } from "@/app/painel/contatos/actions";
import type { Stage } from "@/lib/stages";
import { stageForm, useCloseAsk } from "@/components/funil/close-dialog";

/** Etapas da ficha: pergunta valor/motivo ao fechar, marca a escolhida na hora e recarrega os dados. */
export function StatusButtons({ id, status, stages, name = "Contato", disabled }: { id: string; status: string; stages: Pick<Stage, "key" | "name" | "hint" | "kind">[]; name?: string; disabled?: boolean }) {
  const [current, setCurrent] = useState(status);
  const [pending, start] = useTransition();
  const router = useRouter();
  const { ask, dialog } = useCloseAsk(name, stages);
  function pick(next: string) {
    if (next === current || disabled) return;
    const before = current;
    setCurrent(next);
    ask(next, (info) => start(async () => {
      try { const r = await setStatus(stageForm(id, next, info)); if (!r.ok) setCurrent(before); router.refresh(); } catch { setCurrent(before); }
    }), () => setCurrent(before));
  }
  return (
    <div className="mt-3 flex flex-wrap gap-2" aria-busy={pending}>
      {dialog}
      {stages.map((s) => (
        <button key={s.key} type="button" onClick={() => pick(s.key)} disabled={disabled} title={s.hint ?? undefined} aria-pressed={current === s.key}
          className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${current === s.key ? "border-primary bg-primary text-white" : "border-line bg-card hover:border-primary"}`}>{s.name}</button>
      ))}
    </div>
  );
}
