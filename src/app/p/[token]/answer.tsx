"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { answerProposal } from "./actions";

/** Botões do cliente: aceitar (com o nome) ou recusar (com motivo opcional). */
export function Answer({ token }: { token: string }) {
  const router = useRouter(); const [pending, start] = useTransition();
  const [mode, setMode] = useState<"" | "decline">(""); const [name, setName] = useState(""); const [reason, setReason] = useState(""); const [err, setErr] = useState("");
  const send = (accept: boolean) => { setErr(""); start(async () => { const r = await answerProposal(token, accept, name, reason); if (!r.ok) setErr(r.error ?? "Erro."); router.refresh(); }); };
  const field = "h-12 w-full rounded-xl border border-line bg-card px-4 text-[15px] outline-none focus:border-primary";
  if (mode === "decline") return (
    <div className="space-y-3">
      <textarea className={`${field} h-24 py-3`} maxLength={300} placeholder="Quer contar o motivo? (opcional)" value={reason} onChange={(e) => setReason(e.target.value)} />
      <div className="flex gap-2"><button disabled={pending} onClick={() => send(false)} className="h-12 flex-1 rounded-xl border border-line font-semibold">Confirmar recusa</button>
        <button onClick={() => setMode("")} className="h-12 rounded-xl px-4 text-mute">Voltar</button></div>
      {err && <p className="text-sm text-red-700">{err}</p>}
    </div>
  );
  return (
    <div className="space-y-3">
      <input className={field} maxLength={120} placeholder="Seu nome completo" value={name} onChange={(e) => setName(e.target.value)} aria-label="Seu nome" />
      <button disabled={pending} onClick={() => send(true)} className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 text-lg font-bold text-white shadow-lg shadow-emerald-500/25 hover:brightness-95 disabled:opacity-60">
        <CheckCircle2 size={22} />{pending ? "Enviando…" : "Aceitar proposta"}
      </button>
      <button onClick={() => setMode("decline")} className="w-full text-sm text-mute hover:text-ink">Não tenho interesse</button>
      {err && <p className="text-center text-sm text-red-700">{err}</p>}
    </div>
  );
}
