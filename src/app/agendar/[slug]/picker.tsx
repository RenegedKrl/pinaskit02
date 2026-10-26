"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck } from "lucide-react";
import { brDate, brTime } from "@/lib/crm";
import { cn } from "@/lib/utils";
import { book } from "./actions";

/** Escolha do dia, do horário e dos dados. */
export function Picker({ slug, days, biz }: { slug: string; days: { date: string; slots: string[] }[]; biz: string }) {
  const router = useRouter(); const [pending, start] = useTransition();
  const [day, setDay] = useState(days[0]?.date ?? ""); const [slot, setSlot] = useState("");
  const [name, setName] = useState(""); const [phone, setPhone] = useState(""); const [note, setNote] = useState("");
  const [err, setErr] = useState(""); const [ok, setOk] = useState(false);
  const field = "h-12 w-full rounded-xl border border-line bg-card px-4 text-[15px] outline-none focus:border-primary";
  if (ok) return (
    <div className="rounded-[28px] border border-line bg-card p-8 text-center shadow-lg">
      <CalendarCheck size={44} className="mx-auto text-emerald-500" />
      <h2 className="mt-3 font-display text-2xl font-bold">Horário marcado!</h2>
      <p className="mt-2 text-mute">{brDate(slot, { weekday: "long", day: "2-digit", month: "long" })} às {brTime(slot)}. {biz || "A equipe"} vai confirmar pelo WhatsApp.</p>
    </div>
  );
  if (!days.length) return <p className="rounded-2xl border border-line bg-card p-6 text-center text-mute">Nenhum horário livre nos próximos dias. Fale com {biz || "a equipe"} pelo WhatsApp.</p>;
  const cur = days.find((d) => d.date === day) ?? days[0];
  return (
    <div className="space-y-5 rounded-[28px] border border-line bg-card p-5 shadow-[0_30px_80px_-40px_rgba(15,23,42,.35)] sm:p-7">
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">{days.map((d) => (
        <button key={d.date} type="button" onClick={() => { setDay(d.date); setSlot(""); }}
          className={cn("min-w-20 shrink-0 rounded-2xl border px-3 py-2.5 text-center", d.date === cur.date ? "border-primary bg-primary text-white" : "border-line hover:border-primary/50")}>
          <span className="block text-xs font-semibold uppercase opacity-80">{brDate(d.slots[0], { weekday: "short" })}</span>
          <span className="block font-display text-lg font-bold">{brDate(d.slots[0], { day: "2-digit", month: "2-digit" })}</span>
        </button>
      ))}</div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">{cur.slots.map((s) => (
        <button key={s} type="button" onClick={() => setSlot(s)} className={cn("h-11 rounded-xl border font-semibold tabular-nums", s === slot ? "border-primary bg-primary-soft text-primary" : "border-line hover:border-primary/50")}>{brTime(s)}</button>
      ))}</div>
      {slot && (
        <form className="space-y-3 border-t border-line pt-5" onSubmit={(e) => { e.preventDefault(); setErr(""); start(async () => { const r = await book(slug, slot, name, phone, note); if (!r.ok) { setErr(r.error ?? "Erro."); router.refresh(); } else setOk(true); }); }}>
          <p className="font-semibold">{brDate(slot, { weekday: "long", day: "2-digit", month: "long" })} às {brTime(slot)}</p>
          <input className={field} required maxLength={120} autoComplete="name" placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} aria-label="Seu nome" />
          <input className={field} required type="tel" inputMode="tel" autoComplete="tel" placeholder="Seu WhatsApp com DDD" value={phone} onChange={(e) => setPhone(e.target.value)} aria-label="Seu WhatsApp" />
          <textarea className={`${field} h-20 py-3`} maxLength={500} placeholder="Quer deixar alguma observação? (opcional)" value={note} onChange={(e) => setNote(e.target.value)} />
          {err && <p className="text-sm text-red-700">{err}</p>}
          <button disabled={pending} className="h-13 w-full rounded-xl bg-primary py-3.5 text-lg font-bold text-white shadow-lg shadow-primary/25 hover:bg-primary-hover disabled:opacity-60">{pending ? "Agendando…" : "Confirmar agendamento"}</button>
          <p className="text-center text-xs text-mute">Seus dados são usados só para este atendimento.</p>
        </form>
      )}
    </div>
  );
}
