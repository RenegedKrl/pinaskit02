"use client";
import { useEffect, useRef, useState } from "react";
import { LOST_REASONS } from "@/lib/copy";
import { Button } from "@/components/ui";

export type CloseInfo = { deal_value?: string; lost_reason?: string };

/** Pergunta o valor (venda) ou o motivo (perda) ao fechar um contato. Tudo é opcional. */
export function CloseDialog({ kind, name, onDone, onCancel }: { kind: "won" | "lost"; name: string; onDone: (i: CloseInfo) => void; onCancel: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [value, setValue] = useState(""); const [reason, setReason] = useState(""); const [other, setOther] = useState("");
  useEffect(() => { ref.current?.showModal(); }, []);
  const won = kind === "won";
  const finalReason = reason === "Outro" ? other.trim() : reason;
  return (
    <dialog ref={ref} onCancel={(e) => { e.preventDefault(); onCancel(); }} className="m-auto w-[min(420px,calc(100vw-2rem))] rounded-2xl border border-line bg-card p-0 text-ink shadow-2xl backdrop:bg-slate-950/50">
      <form method="dialog" className="space-y-4 p-6" onSubmit={(e) => { e.preventDefault(); onDone(won ? { deal_value: value } : { lost_reason: finalReason }); }}>
        <div>
          <h2 className="font-display text-lg font-semibold">{won ? "Venda concluída 🎉" : "Contato não convertido"}</h2>
          <p className="text-sm text-mute">{name}. {won ? "Quanto foi vendido? Assim o relatório mostra quanto cada origem trouxe." : "O que aconteceu? Isso mostra onde você perde clientes."}</p>
        </div>
        {won ? (
          <label className="block text-sm font-semibold">Valor da venda (R$)
            <input autoFocus inputMode="decimal" placeholder="Ex.: 1.500,00" value={value} onChange={(e) => setValue(e.target.value)}
              className="mt-1 h-11 w-full rounded-lg border border-line bg-card px-3 text-[15px] font-normal outline-none focus:border-primary" />
          </label>
        ) : (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {[...LOST_REASONS, "Outro"].map((r) => (
                <button type="button" key={r} onClick={() => setReason(r)} aria-pressed={reason === r}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium ${reason === r ? "border-primary bg-primary text-white" : "border-line hover:border-primary/40"}`}>{r}</button>
              ))}
            </div>
            {reason === "Outro" && <input autoFocus maxLength={120} placeholder="Escreva o motivo" value={other} onChange={(e) => setOther(e.target.value)}
              className="h-11 w-full rounded-lg border border-line bg-card px-3 text-[15px] outline-none focus:border-primary" />}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => onDone({})}>Pular</Button>
          <Button type="submit">Salvar</Button>
        </div>
      </form>
    </dialog>
  );
}
