import { canEdit, getSession, isAdmin } from "@/lib/session";
import { appUrl } from "@/lib/app-url";
import { brDate } from "@/lib/crm";
import { Card, PageHeader } from "@/components/ui";
import { BookingPages, type BookingPage } from "@/components/crm/booking-editor";
import { AppointmentRow, type Appt } from "@/components/crm/appointment-row";

/** Agenda: links de agendamento e os próximos horários marcados. */
export default async function Agenda() {
  const { supabase, workspace, role } = await getSession();
  const now = new Date(); const from = new Date(now.getTime() - 86_400_000).toISOString();
  const [{ data: pages }, { data: appts }, base] = await Promise.all([
    supabase.from("booking_pages").select("*").eq("workspace_id", workspace.id).order("created_at"),
    supabase.from("appointments").select("id, starts_at, name, phone, status, note, lead_id, booking_pages(title)").eq("workspace_id", workspace.id).gte("starts_at", from).order("starts_at").limit(200),
    appUrl(),
  ]);
  const list = (appts ?? []) as unknown as Appt[];
  const byDay = new Map<string, Appt[]>();
  for (const a of list) { const k = brDate(a.starts_at, { weekday: "long", day: "2-digit", month: "long" }); byDay.set(k, [...(byDay.get(k) ?? []), a]); }
  const edit = canEdit(role);
  return (
    <>
      <PageHeader title="Agenda" desc="Clientes marcam sozinhos pelo link; cada horário vira contato no funil e tarefa no Meu dia." />
      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <h2 className="mb-3 font-display font-semibold">Próximos horários</h2>
          {!list.length ? <p className="py-6 text-center text-sm text-mute">Nenhum horário marcado. Mande o link de agendamento pelo WhatsApp ou coloque na bio do Instagram.</p>
            : [...byDay.entries()].map(([day, rows]) => (
              <section key={day} className="mb-4 last:mb-0"><h3 className="mb-2 text-sm font-semibold capitalize text-mute">{day}</h3>
                <ul className="space-y-2">{rows.map((a) => <AppointmentRow key={a.id} a={a} edit={edit} />)}</ul></section>
            ))}
        </Card>
        <BookingPages pages={(pages ?? []) as BookingPage[]} admin={isAdmin(role)} appUrl={base} />
      </div>
    </>
  );
}
