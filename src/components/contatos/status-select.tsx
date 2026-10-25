"use client";
import { setStatus } from "@/app/painel/contatos/actions";
import { STATUS } from "@/lib/copy";

/** Muda a etapa do contato direto na lista: salva ao escolher, sem abrir a ficha. */
export function StatusSelect({ id, status, back, disabled }: { id: string; status: string; back: string; disabled?: boolean }) {
  return (
    <form action={setStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="back" value={back} />
      <select name="status" defaultValue={status} disabled={disabled} aria-label="Etapa do contato"
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="h-9 rounded-lg border border-line bg-card px-2 text-sm disabled:opacity-70">
        {STATUS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
      </select>
    </form>
  );
}
