"use client";
import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setAppointmentStatus } from "@/app/painel/agenda/actions";
import { brDate, brTime } from "@/lib/crm";
import { cn } from "@/lib/utils";
import { WaButton } from "./tasks";

export interface Appt { id: string; starts_at: string; name: string; phone: string; status: string; note: string | null; lead_id: string | null; booking_pages: { title: string } | null }
const ST: Record<string, string> = { booked: "Marcado", done: "Realizado", no_show: "Faltou", canceled: "Cancelado" };

export function AppointmentRow({ a, edit }: { a: Appt; edit: boolean }) {
  const router = useRouter(); const [pending, start] = useTransition();
  const set = (s: "done" | "no_show" | "canceled" | "booked") => start(async () => { await setAppointmentStatus(a.id, s); router.refresh(); });
  return (
    <li className={cn("flex flex-wrap items-center gap-3 rounded-xl border border-line p-3", (pending || a.status === "canceled") && "opacity-60")}>
      <div className="w-24 shrink-0 text-center"><p className="text-xs font-semibold uppercase text-mute">{brDate(a.starts_at)}</p><p className="font-display text-xl font-bold tabular-nums">{brTime(a.starts_at)}</p></div>
      <div className="min-w-0 flex-1">
        {a.lead_id ? <Link href={`/painel/contatos/${a.lead_id}`} className="font-semibold hover:text-primary">{a.name}</Link> : <b>{a.name}</b>}
        <p className="truncate text-sm text-mute">{a.booking_pages?.title}{a.note ? ` · “${a.note}”` : ""}</p>
      </div>
      <span className="rounded bg-bg px-2 py-0.5 text-xs font-semibold text-mute">{ST[a.status] ?? a.status}</span>
      {a.lead_id && a.status === "booked" && <WaButton leadId={a.lead_id} phone={a.phone} text={`Olá, ${a.name.split(" ")[0]}! Confirmando seu horário em ${brDate(a.starts_at, { day: "2-digit", month: "2-digit" })} às ${brTime(a.starts_at)}. Até lá!`} label="Confirmar" />}
      {edit && a.status === "booked" && (
        <div className="flex gap-1 text-sm">
          <button type="button" onClick={() => set("done")} className="rounded-lg bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-800">Realizado</button>
          <button type="button" onClick={() => set("no_show")} className="rounded-lg px-2 py-1 text-mute hover:text-ink">Faltou</button>
          <button type="button" onClick={() => set("canceled")} className="rounded-lg px-2 py-1 text-mute hover:text-red-700">Cancelar</button>
        </div>
      )}
    </li>
  );
}
