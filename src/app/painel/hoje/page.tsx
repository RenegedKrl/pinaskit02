import Link from "next/link";
import { AlarmClock, CalendarDays, CheckCircle2, Hourglass, ListTodo } from "lucide-react";
import { canEdit, getSession } from "@/lib/session";
import { brDay, brTime, formatMinutes } from "@/lib/crm";
import { Card, PageHeader } from "@/components/ui";
import { TaskForm, TaskItem, WaButton, type TaskRow } from "@/components/crm/tasks";

const WAIT_MIN = 15;

function Section({ icon, title, count, tone = "text-primary", children, empty }: { icon: React.ReactNode; title: string; count: number; tone?: string; children: React.ReactNode; empty: string }) {
  return (
    <Card>
      <h2 className="mb-3 flex items-center gap-2 font-display font-semibold"><span className={tone}>{icon}</span>{title}
        <span className="ml-auto rounded-md bg-bg px-2 py-0.5 text-sm tabular-nums text-mute">{count}</span></h2>
      {count ? children : <p className="py-3 text-center text-sm text-mute">{empty}</p>}
    </Card>
  );
}

/** Meu dia: o que o atendente precisa fazer hoje, o que atrasou e quem chegou e ainda não foi atendido. */
export default async function MeuDia({ searchParams }: { searchParams: Promise<{ equipe?: string }> }) {
  const sp = await searchParams;
  const { supabase, workspace, user, role } = await getSession();
  const team = sp.equipe === "1";
  const { start, end } = brDay();
  const week = new Date(new Date(end).getTime() + 6 * 86_400_000).toISOString();
  const waitLimit = new Date(Date.now() - WAIT_MIN * 60_000).toISOString();
  const sel = "id, title, kind, message, due_at, done_at, source, lead_id, assignee_id, leads(name, phone_e164)";
  const open = () => { const q = supabase.from("tasks").select(sel).eq("workspace_id", workspace.id).is("done_at", null); return team ? q : q.eq("assignee_id", user.id); };
  const doneQ = supabase.from("tasks").select("id", { count: "exact", head: true }).eq("workspace_id", workspace.id).gte("done_at", start);

  const [{ data: late }, { data: today }, { data: next }, { data: waiting }, { data: appts }, { data: members }, { count: doneToday }] = await Promise.all([
    open().lt("due_at", start).order("due_at").limit(50),
    open().gte("due_at", start).lt("due_at", end).order("due_at").limit(100),
    open().gte("due_at", end).lt("due_at", week).order("due_at").limit(30),
    supabase.from("leads").select("id, name, phone_e164, source_label, created_at, owner_id").eq("workspace_id", workspace.id).is("first_response_at", null)
      .lt("created_at", waitLimit).gte("created_at", new Date(Date.now() - 7 * 86_400_000).toISOString()).order("created_at").limit(30),
    supabase.from("appointments").select("id, starts_at, name, phone, lead_id, booking_pages(title)").eq("workspace_id", workspace.id).eq("status", "booked")
      .gte("starts_at", start).lt("starts_at", end).order("starts_at"),
    supabase.from("workspace_members").select("user_id, email").eq("workspace_id", workspace.id).neq("role", "viewer"),
    team ? doneQ : doneQ.eq("assignee_id", user.id),
  ]);
  const waitList = (waiting ?? []).filter((l) => team || !l.owner_id || l.owner_id === user.id);
  const edit = canEdit(role);
  const name = (user.user_metadata?.full_name as string | undefined)?.split(" ")[0] ?? "";
  const hour = Number(new Date().toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: "America/Sao_Paulo" }));
  const hello = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const T = (rows: unknown) => (rows ?? []) as TaskRow[];

  return (
    <>
      <PageHeader title={`${hello}${name ? `, ${name}` : ""}!`} desc={`Hoje: ${T(today).length} tarefas, ${T(late).length} atrasadas, ${waitList.length} esperando atendimento${doneToday ? ` · ${doneToday} concluídas hoje` : ""}.`}
        action={
          <div className="flex gap-1 rounded-lg border border-line bg-card p-1 text-sm" role="group" aria-label="De quem">
            <Link href="/painel/hoje" className={`rounded-md px-3 py-1.5 font-semibold ${!team ? "bg-primary text-white" : "text-mute"}`}>Minhas</Link>
            <Link href="/painel/hoje?equipe=1" className={`rounded-md px-3 py-1.5 font-semibold ${team ? "bg-primary text-white" : "text-mute"}`}>Da equipe</Link>
          </div>
        } />
      <div data-tour="meu-dia" className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <Section icon={<Hourglass size={18} />} tone="text-red-600" title="Chegaram e ninguém atendeu" count={waitList.length} empty="Todo mundo foi atendido. 👏">
            <ul className="space-y-2">{waitList.map((l) => {
              const mins = Math.round((Date.now() - new Date(l.created_at).getTime()) / 60_000);
              return (
                <li key={l.id} className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50/60 p-3 dark:border-red-900">
                  <div className="min-w-0 flex-1"><Link href={`/painel/contatos/${l.id}`} className="font-semibold hover:text-primary">{l.name || "Sem nome"}</Link>
                    <p className="text-sm text-mute">{l.source_label || "Acesso direto"} · esperando há <b className="text-red-700">{formatMinutes(mins)}</b></p></div>
                  <WaButton leadId={l.id} phone={l.phone_e164} text={`Olá${l.name ? `, ${l.name.split(" ")[0]}` : ""}! Tudo bem? Recebi seu contato pelo site.`} label="Atender" />
                </li>
              );
            })}</ul>
          </Section>
          <Section icon={<AlarmClock size={18} />} tone="text-amber-600" title="Atrasadas" count={T(late).length} empty="Nada atrasado.">
            <ul className="space-y-2">{T(late).map((t) => <TaskItem key={t.id} t={t} showLead edit={edit} members={team ? members ?? [] : undefined} />)}</ul>
          </Section>
          <Section icon={<ListTodo size={18} />} title="Para hoje" count={T(today).length} empty="Nenhuma tarefa para hoje. Crie uma abaixo ou numa ficha de contato.">
            <ul className="space-y-2">{T(today).map((t) => <TaskItem key={t.id} t={t} showLead edit={edit} members={team ? members ?? [] : undefined} />)}</ul>
          </Section>
          {edit && <Card><h2 className="mb-3 font-display font-semibold">Nova tarefa</h2><TaskForm leadId={null} members={members ?? []} me={user.id} /></Card>}
        </div>
        <div className="space-y-4">
          <Section icon={<CalendarDays size={18} />} title="Agenda de hoje" count={appts?.length ?? 0} empty="Nenhum horário marcado hoje.">
            <ul className="divide-y divide-line">{(appts ?? []).map((a) => (
              <li key={a.id} className="flex items-center gap-3 py-2.5">
                <span className="w-14 font-display text-lg font-bold tabular-nums">{brTime(a.starts_at)}</span>
                <div className="min-w-0 flex-1">{a.lead_id ? <Link href={`/painel/contatos/${a.lead_id}`} className="font-semibold hover:text-primary">{a.name}</Link> : <b>{a.name}</b>}
                  <p className="truncate text-sm text-mute">{(a.booking_pages as unknown as { title: string } | null)?.title}</p></div>
                {a.lead_id && <WaButton leadId={a.lead_id} phone={a.phone} text={`Olá, ${a.name.split(" ")[0]}! Confirmando seu horário de hoje às ${brTime(a.starts_at)}.`} label="Confirmar" />}
              </li>
            ))}</ul>
          </Section>
          <Section icon={<CheckCircle2 size={18} />} tone="text-emerald-600" title="Próximos 7 dias" count={T(next).length} empty="Nada marcado para os próximos dias.">
            <ul className="space-y-2">{T(next).map((t) => <TaskItem key={t.id} t={t} showLead edit={edit} members={team ? members ?? [] : undefined} />)}</ul>
          </Section>
        </div>
      </div>
    </>
  );
}
