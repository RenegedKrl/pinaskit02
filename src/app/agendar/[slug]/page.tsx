import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { freeSlots, type BookingCfg } from "@/lib/crm";
import { Picker } from "./picker";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Agendar horário" };

/** Página pública de agendamento. Mostra só nome da conta, atendimento e horários livres. */
export default async function Agendar({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9][a-z0-9-]{2,39}$/.test(slug)) notFound();
  const db = supabaseAdmin();
  const { data: p } = await db.from("booking_pages").select("id, title, description, duration_min, days, start_time, end_time, window_days, min_notice_hours, active, workspaces(name, plan_status)").eq("slug", slug).maybeSingle();
  if (!p || !p.active || (p.workspaces as unknown as { plan_status: string } | null)?.plan_status === "read_only") notFound();
  const { data: taken } = await db.from("appointments").select("starts_at").eq("page_id", p.id).eq("status", "booked").gte("starts_at", new Date().toISOString());
  const days = freeSlots(p as unknown as BookingCfg, (taken ?? []).map((t) => t.starts_at));
  const biz = (p.workspaces as unknown as { name: string } | null)?.name ?? "";
  return (
    <main className="min-h-dvh bg-[radial-gradient(60%_50%_at_50%_0%,#dbeafe,transparent)] bg-bg px-4 py-10 text-ink">
      <div className="mx-auto max-w-xl">
        <header className="mb-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-[.14em] text-primary">{biz}</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">{p.title}</h1>
          <p className="mt-2 text-mute">{p.description || `Escolha um horário. Duração: ${p.duration_min} minutos.`}</p>
        </header>
        <Picker slug={slug} days={days} biz={biz} />
        <p className="mt-6 text-center text-xs text-mute">Horários de Brasília · agendamento pelo Pinas Kit</p>
      </div>
    </main>
  );
}
