"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { createPipeline, deletePipeline, renamePipeline } from "@/app/painel/funil/actions";
import { cn } from "@/lib/utils";

export interface Pipeline { id: string; name: string; is_main: boolean }

/** Abas dos funis (vendas, pós-venda, suporte…) com criar, renomear e apagar para dono/admin. */
export function PipelineTabs({ pipelines, current, admin }: { pipelines: Pipeline[]; current: string; admin: boolean }) {
  const router = useRouter(); const [pending, start] = useTransition();
  const [mode, setMode] = useState<"" | "new" | "edit">(""); const [name, setName] = useState(""); const [err, setErr] = useState("");
  const cur = pipelines.find((p) => p.id === current);
  const submit = () => start(async () => {
    setErr("");
    const r = mode === "new" ? await createPipeline(name) : await renamePipeline(current, name);
    if (!r.ok) return setErr(r.error ?? "Erro.");
    setMode(""); setName("");
    if (mode === "new" && "id" in r && r.id) router.push(`/painel/funil?funil=${r.id}`); else router.refresh();
  });
  return (
    <div className="mb-4" data-tour="funis">
      <div className="flex flex-wrap items-center gap-1.5">
        {pipelines.map((p) => (
          <Link key={p.id} href={p.is_main ? "/painel/funil" : `/painel/funil?funil=${p.id}`} aria-current={p.id === current ? "page" : undefined}
            className={cn("rounded-full px-4 py-1.5 text-sm font-semibold transition-colors", p.id === current ? "bg-primary text-white shadow-sm shadow-primary/30" : "border border-line bg-card text-mute hover:text-ink")}>{p.name}</Link>
        ))}
        {admin && !mode && <>
          {pipelines.length < 5 && <button type="button" onClick={() => { setMode("new"); setName(""); }} className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-primary hover:bg-primary-soft"><Plus size={15} />Novo funil</button>}
          <button type="button" aria-label="Renomear funil" onClick={() => { setMode("edit"); setName(cur?.name ?? ""); }} className="rounded-full p-2 text-mute hover:bg-card hover:text-ink"><Pencil size={14} /></button>
          {cur && !cur.is_main && <button type="button" aria-label="Apagar funil" disabled={pending} onClick={() => start(async () => { const r = await deletePipeline(current); if (!r.ok) return setErr(r.error ?? "Erro."); router.push("/painel/funil"); })} className="rounded-full p-2 text-mute hover:bg-card hover:text-red-700"><Trash2 size={14} /></button>}
        </>}
      </div>
      {mode && (
        <form className="mt-2 flex max-w-md gap-2" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <input autoFocus maxLength={40} value={name} onChange={(e) => setName(e.target.value)} placeholder={mode === "new" ? "Ex.: Pós-venda, Suporte" : "Nome do funil"}
            className="h-10 flex-1 rounded-lg border border-line bg-card px-3 text-sm outline-none focus:border-primary" aria-label="Nome do funil" />
          <button disabled={pending || !name.trim()} className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-white disabled:opacity-60">{mode === "new" ? "Criar" : "Salvar"}</button>
          <button type="button" aria-label="Cancelar" onClick={() => setMode("")} className="px-2 text-mute"><X size={16} /></button>
        </form>
      )}
      {err && <p className="mt-2 text-sm text-red-700">{err}</p>}
    </div>
  );
}
