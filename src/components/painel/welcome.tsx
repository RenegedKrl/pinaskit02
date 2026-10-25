"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, GraduationCap, X } from "lucide-react";

/** Boas-vindas mostradas uma única vez, logo que a assinatura fica ativa (guardado por conta, neste navegador). */
export function Welcome({ workspaceId, active }: { workspaceId: string; active: boolean }) {
  const key = `pk-bem-vindo-${workspaceId}`;
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!active) return;
    try { if (!localStorage.getItem(key)) setOpen(true); } catch { /* sem armazenamento */ }
  }, [active, key]);
  function close(tour = false) {
    setOpen(false);
    try { localStorage.setItem(key, "1"); } catch { /* */ }
    if (tour) window.dispatchEvent(new Event("pk-tour"));
  }
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/65 p-4" role="dialog" aria-modal="true" aria-labelledby="bv-titulo">
      <div className="w-full max-w-md rounded-xl border border-line bg-card p-6 text-ink shadow-xl">
        <div className="flex justify-between">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-success-soft text-success"><CheckCircle2 size={26} /></span>
          <button onClick={() => close()} aria-label="Fechar" className="-m-1 h-8 rounded p-1 text-mute hover:bg-bg"><X size={18} /></button>
        </div>
        <h2 id="bv-titulo" className="mt-4 text-xl font-semibold">Bem-vindo ao Pinas Kit!</h2>
        <p className="mt-2 text-mute">Sua assinatura está ativa. Agora tudo está liberado: botões e formulários ilimitados, contatos com a origem de cada um, funil e equipe.</p>
        <ul className="mt-4 space-y-1.5 text-sm">
          {["Crie seu botão ou formulário e instale no site", "Use links com origem nos seus anúncios", "Acompanhe cada contato até a venda no funil"].map((t) => (
            <li key={t} className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-primary" />{t}</li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button onClick={() => close(true)} className="inline-flex h-10 items-center gap-2 rounded-lg border border-line px-4 text-sm font-semibold hover:bg-bg"><GraduationCap size={16} />Ver o tutorial</button>
          <button onClick={() => close()} className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover">Começar</button>
        </div>
      </div>
    </div>
  );
}
