"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Lock, Pencil, Plus, Trash2, X } from "lucide-react";
import { createStage, deleteStage, renameStage, reorderStages } from "@/app/painel/funil/actions";
import { MAX_STAGES, type Stage } from "@/lib/stages";
import { Button } from "@/components/ui";

const input = "h-10 w-full rounded-lg border border-line bg-card px-3 text-sm";

/** Janela para criar, renomear, reordenar e apagar etapas do funil (só dono e admin). */
export function StageEditor({ stages, pipelineId = null }: { stages: Stage[]; pipelineId?: string | null }) {
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [newName, setNewName] = useState("");
  const [removing, setRemoving] = useState<Stage | null>(null);
  const [moveTo, setMoveTo] = useState("novo");
  const open = stages.filter((s) => s.kind === "open");

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, after?: () => void) {
    setError("");
    start(async () => {
      const r = await fn();
      if (!r.ok) setError(r.error ?? "Algo deu errado.");
      else { after?.(); router.refresh(); }
    });
  }
  function shift(id: string, dir: -1 | 1) {
    const ids = open.map((s) => s.id); const i = ids.indexOf(id); const j = i + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    run(() => reorderStages(ids));
  }

  return (
    <>
      <Button variant="outline" data-tour="editar-etapas" onClick={() => ref.current?.showModal()}><Pencil size={16} />Editar etapas</Button>
      <dialog ref={ref} className="m-auto w-[min(560px,calc(100vw-32px))] rounded-xl border border-line bg-card p-0 text-ink backdrop:bg-black/40">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold">Etapas do funil</h2>
            <p className="text-sm text-mute">{stages.length} de {MAX_STAGES} etapas. As com cadeado podem ser renomeadas, mas não apagadas.</p>
          </div>
          <button onClick={() => ref.current?.close()} aria-label="Fechar" className="rounded-lg p-2 text-mute hover:bg-bg"><X size={18} /></button>
        </div>

        <ul className="max-h-[60dvh] space-y-2 overflow-y-auto px-5 py-4">
          {stages.map((s) => {
            const idx = open.findIndex((o) => o.id === s.id);
            return (
              <li key={s.id} className="rounded-lg border border-line p-3">
                <form className="flex flex-wrap items-center gap-2" onSubmit={(e) => {
                  e.preventDefault(); const fd = new FormData(e.currentTarget);
                  run(() => renameStage(s.id, String(fd.get("name")), String(fd.get("hint") ?? "")));
                }}>
                  {s.kind !== "open" && <Lock size={15} className="text-mute" aria-label="Etapa fixa" />}
                  <input name="name" defaultValue={s.name} maxLength={40} aria-label="Nome da etapa" className={`${input} min-w-36 flex-1`} />
                  <input name="hint" defaultValue={s.hint ?? ""} maxLength={80} placeholder="Descrição curta" aria-label="Descrição" className={`${input} min-w-36 flex-1`} />
                  <div className="flex gap-1">
                    <button type="submit" disabled={pending} className="h-10 rounded-lg border border-line px-3 text-sm font-semibold hover:bg-bg">Salvar</button>
                    {s.kind === "open" && <>
                      <button type="button" onClick={() => shift(s.id, -1)} disabled={pending || idx === 0} aria-label="Subir" className="h-10 rounded-lg border border-line px-2 disabled:opacity-40"><ArrowUp size={15} /></button>
                      <button type="button" onClick={() => shift(s.id, 1)} disabled={pending || idx === open.length - 1} aria-label="Descer" className="h-10 rounded-lg border border-line px-2 disabled:opacity-40"><ArrowDown size={15} /></button>
                      <button type="button" onClick={() => { setRemoving(s); setMoveTo("novo"); }} disabled={pending} aria-label="Apagar etapa" className="h-10 rounded-lg border border-line px-2 text-red-700 hover:bg-red-50"><Trash2 size={15} /></button>
                    </>}
                  </div>
                </form>
                {removing?.id === s.id && (
                  <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm">
                    <p className="font-semibold text-red-800">Apagar &quot;{s.name}&quot;?</p>
                    <label className="mt-2 block text-ink">Os contatos desta etapa vão para:
                      <select value={moveTo} onChange={(e) => setMoveTo(e.target.value)} className={`${input} mt-1`}>
                        {stages.filter((o) => o.id !== s.id).map((o) => <option key={o.key} value={o.key}>{o.name}</option>)}
                      </select>
                    </label>
                    <div className="mt-2 flex gap-2">
                      <Button variant="danger" size="sm" disabled={pending} onClick={() => run(() => deleteStage(s.id, moveTo), () => setRemoving(null))}>Apagar etapa</Button>
                      <Button variant="outline" size="sm" onClick={() => setRemoving(null)}>Cancelar</Button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <form className="flex gap-2 border-t border-line px-5 py-4" onSubmit={(e) => { e.preventDefault(); run(() => createStage(newName, pipelineId), () => setNewName("")); }}>
          <input value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={40} placeholder="Nova etapa, ex.: Visita marcada" aria-label="Nome da nova etapa" className={input} disabled={stages.length >= MAX_STAGES} />
          <Button disabled={pending || stages.length >= MAX_STAGES || !newName.trim()}><Plus size={16} />Criar</Button>
        </form>
        {(error || stages.length >= MAX_STAGES) && (
          <p role="alert" className="px-5 pb-4 text-sm text-red-700">{error || `Limite de ${MAX_STAGES} etapas atingido. Apague uma para criar outra.`}</p>
        )}
      </dialog>
    </>
  );
}
