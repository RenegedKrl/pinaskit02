"use client";
import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { answerSurvey } from "./actions";

export function Survey({ token }: { token: string }) {
  const [score, setScore] = useState<number | null>(null); const [comment, setComment] = useState("");
  const [pending, start] = useTransition(); const [done, setDone] = useState(false); const [err, setErr] = useState("");
  if (done) return <div className="mt-6"><Heart size={40} className="mx-auto text-pink-500" /><p className="mt-3 text-lg font-semibold">Obrigado pela sua resposta!</p></div>;
  return (
    <div className="mt-6 space-y-5">
      <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-11">{Array.from({ length: 11 }, (_, n) => (
        <button key={n} type="button" onClick={() => setScore(n)} aria-pressed={score === n}
          className={cn("h-11 rounded-xl border font-bold tabular-nums transition", score === n ? (n >= 9 ? "border-emerald-500 bg-emerald-500 text-white" : n <= 6 ? "border-red-500 bg-red-500 text-white" : "border-amber-500 bg-amber-500 text-white") : "border-line hover:border-primary")}>{n}</button>
      ))}</div>
      <div className="flex justify-between text-xs text-mute"><span>Não recomendaria</span><span>Recomendaria muito</span></div>
      {score !== null && <>
        <textarea maxLength={1000} value={comment} onChange={(e) => setComment(e.target.value)} placeholder={score >= 9 ? "O que você mais gostou? (opcional)" : "O que podemos melhorar? (opcional)"}
          className="h-24 w-full rounded-xl border border-line bg-card px-4 py-3 text-[15px] outline-none focus:border-primary" />
        <button disabled={pending} onClick={() => start(async () => { const r = await answerSurvey(token, score, comment); if (r.ok) setDone(true); else setErr(r.error ?? "Erro."); })}
          className="h-12 w-full rounded-xl bg-primary font-bold text-white hover:bg-primary-hover disabled:opacity-60">{pending ? "Enviando…" : "Enviar resposta"}</button>
      </>}
      {err && <p className="text-sm text-red-700">{err}</p>}
    </div>
  );
}
