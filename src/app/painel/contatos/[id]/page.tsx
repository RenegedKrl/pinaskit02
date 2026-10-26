import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { canEdit, getSession, isAdmin } from "@/lib/session";
import { LOST_REASONS, METHOD_LABEL, TEMP } from "@/lib/copy";
import { getStages, stageName } from "@/lib/stages";
import { dateTime, formatPhone } from "@/lib/utils";
import { Badge, Button, Card, Field, Input, Textarea } from "@/components/ui";
import { Journey, type PageView } from "@/components/contatos/journey";
import { StatusButtons } from "@/components/contatos/status-buttons";
import { CrmPanel, type Member } from "@/components/contatos/crm-panel";
import { TemplateMenu, type Template } from "@/components/contatos/template-menu";
import { addNote, deleteLead, updateLead } from "../actions";
import { activityText } from "@/lib/activity";
import { appUrl } from "@/lib/app-url";
import { brDate, brTime, formatMinutes, responseMinutes } from "@/lib/crm";
import type { CustomField } from "@/lib/fields";
import { TaskForm, TaskItem, WaButton, type TaskRow } from "@/components/crm/tasks";
import { DealsPanel, type Deal, type Product } from "@/components/crm/deals";
import { ProposalsPanel, type Proposal } from "@/components/crm/proposals";
import { CustomFieldsCard, NpsCard, SequenceCard, type SeqLite } from "@/components/crm/lead-extra";

type Touch = { utm_source?: string; utm_medium?: string; utm_campaign?: string; utm_content?: string; utm_term?: string; referrer?: string; landing?: string; click_ids?: Record<string, string> } | null;

function TouchInfo({ title, t }: { title: string; t: Touch }) {
  if (!t) return null;
  const rows: [string, string | undefined][] = [
    ["Campanha", t.utm_campaign], ["Anúncio", t.utm_content], ["Público ou palavra-chave", t.utm_term],
    ["Origem técnica", [t.utm_source, t.utm_medium].filter(Boolean).join(" / ") || undefined],
    ["Veio do site", t.referrer], ["Página de entrada", t.landing],
  ];
  return (
    <div>
      <p className="text-sm font-semibold">{title}</p>
      <dl className="mt-1 space-y-1 text-sm">
        {rows.filter(([, v]) => v).map(([k, v]) => <div key={k} className="flex gap-2"><dt className="w-32 shrink-0 text-mute">{k}</dt><dd className="min-w-0 break-words">{v}</dd></div>)}
        {t.click_ids && <div className="flex gap-2"><dt className="w-40 shrink-0 text-mute">Clique de anúncio</dt><dd>{Object.keys(t.click_ids).join(", ")}</dd></div>}
      </dl>
    </div>
  );
}

export default async function Contato({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, workspace, role, user } = await getSession();
  const [{ data: l }, { data: acts }, stages, { data: members }, { data: templates }] = await Promise.all([
    supabase.from("leads").select("*, widgets(name)").eq("id", id).eq("workspace_id", workspace.id).maybeSingle(),
    supabase.from("lead_activities").select("id, type, body, created_at").eq("lead_id", id).order("created_at", { ascending: false }).limit(50),
    getStages(supabase, workspace.id),
    supabase.from("workspace_members").select("user_id, email").eq("workspace_id", workspace.id).neq("role", "viewer"),
    supabase.from("message_templates").select("id, name, body").eq("workspace_id", workspace.id).order("name"),
  ]);
  if (!l) notFound();
  const { data: views } = l.visitor_id
    ? await supabase.from("events").select("page_url, source_label, created_at").eq("workspace_id", workspace.id)
        .eq("visitor_id", l.visitor_id).eq("type", "pageview").order("created_at").limit(200)
    : { data: [] as PageView[] };
  const [{ data: tasks }, { data: deals }, { data: products }, { data: proposals }, { data: fields }, { data: sequences }, { data: appts }, { data: npsRows }, base] = await Promise.all([
    supabase.from("tasks").select("id, title, kind, message, due_at, done_at, source, sequence_id, lead_id, assignee_id").eq("lead_id", id).order("done_at", { nullsFirst: true }).order("due_at").limit(40),
    supabase.from("deals").select("id, title, product_id, value, expected_close, probability, status, lead_id").eq("lead_id", id).order("created_at", { ascending: false }),
    supabase.from("products").select("id, name, price, active").eq("workspace_id", workspace.id).order("name"),
    supabase.from("proposals").select("id, token, title, total, status, created_at, viewed_at, answered_at, decline_reason").eq("lead_id", id).order("created_at", { ascending: false }),
    supabase.from("custom_fields").select("key, label, type, options").eq("workspace_id", workspace.id).order("position"),
    supabase.from("sequences").select("id, name, steps").eq("workspace_id", workspace.id).eq("active", true).order("name"),
    supabase.from("appointments").select("id, starts_at, status, booking_pages(title)").eq("lead_id", id).order("starts_at", { ascending: false }).limit(5),
    supabase.from("nps_responses").select("score, comment").eq("lead_id", id).order("created_at", { ascending: false }).limit(1),
    appUrl(),
  ]);
  const taskRows = ((tasks ?? []) as (TaskRow & { sequence_id: string | null })[]).map((t) => ({ ...t, leads: { name: l.name, phone_e164: l.phone_e164 } }));
  const running = (sequences ?? []).map((s) => ({ id: s.id, name: s.name, left: taskRows.filter((t) => t.sequence_id === s.id && !t.done_at).length })).filter((s) => s.left > 0);
  const resp = responseMinutes(l.created_at, l.first_response_at);
  const edit = canEdit(role);
  const t = TEMP[l.temperature as keyof typeof TEMP];
  const firstName = (l.name || "").split(" ")[0];

  return (
    <>
      <Link href="/painel/contatos" className="mb-3 inline-flex items-center gap-1 text-sm text-mute"><ArrowLeft size={15} />Contatos</Link>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">{l.name || "Sem nome"}</h1>
          <p className="text-mute">{formatPhone(l.phone_e164)} · chegou em {dateTime(l.created_at)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
        <TemplateMenu phone={l.phone_e164} lead={{ name: l.name, source_label: l.source_label }} templates={(templates ?? []) as Template[]} />
        <WaButton leadId={l.id} phone={l.phone_e164} text={`Olá${firstName ? `, ${firstName}` : ""}! Tudo bem?`} label="Abrir no WhatsApp" className="h-11 px-5 text-base" />
        </div>
      </div>
      <p className="-mt-4 mb-6 text-sm text-mute">O WhatsApp abre no seu celular ou computador. O Pinas Kit não lê suas conversas.</p>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <h2 className="font-display font-semibold">Etapa do atendimento</h2>
            <StatusButtons id={l.id} status={l.status} stages={stages} name={l.name || "Contato"} disabled={!edit} />
          </Card>
          <Card>
            <h2 className="mb-3 font-display font-semibold">Tarefas</h2>
            <ul className="mb-3 space-y-2">{taskRows.map((tk) => <TaskItem key={tk.id} t={tk} edit={edit} members={members ?? []} />)}</ul>
            {!taskRows.length && <p className="mb-3 text-sm text-mute">Nenhuma tarefa. Crie uma para não esquecer o próximo passo.</p>}
            {edit && <TaskForm leadId={l.id} members={members ?? []} me={user.id} compact />}
          </Card>
          <DealsPanel leadId={l.id} deals={(deals ?? []) as Deal[]} products={(products ?? []) as Product[]} edit={edit} />
          <ProposalsPanel leadId={l.id} phone={l.phone_e164} name={l.name} proposals={(proposals ?? []) as Proposal[]} deals={(deals ?? []).filter((d) => d.status === "open")}
            products={(products ?? []) as Product[]} edit={edit} appUrl={base} />
          <Card>
            <h2 className="mb-3 font-display font-semibold">De onde veio</h2>
            <p className="mb-3"><Badge className="bg-primary-soft text-primary">{l.source_label || "Acesso direto"}</Badge> <span className="text-sm text-mute">por {METHOD_LABEL[l.capture_method] ?? "formulário"}{l.widgets?.name ? ` · ${l.widgets.name}` : ""}</span></p>
            <div className="grid gap-4 xl:grid-cols-2">
              <TouchInfo title="Primeiro acesso" t={l.first_touch} />
              <TouchInfo title="Acesso em que virou contato" t={l.last_touch} />
            </div>
            {!l.first_touch && !l.last_touch && <p className="text-sm text-mute">Não foi possível identificar a origem (acesso direto ou link sem parâmetros).</p>}
          </Card>
          <Journey views={(views ?? []) as PageView[]} hasVisitor={!!l.visitor_id} contactAt={l.created_at} />
          {(l.answers?.option || l.answers?.message) && (
            <Card>
              <h2 className="mb-2 font-display font-semibold">Respostas do formulário</h2>
              {l.answers.option && <p><span className="text-mute">Momento: </span>{l.answers.option}</p>}
              {l.answers.message && <p className="mt-1 whitespace-pre-wrap">{l.answers.message}</p>}
            </Card>
          )}
          <Card>
            <h2 className="mb-3 font-display font-semibold">Histórico</h2>
            {edit && (
              <form action={addNote} className="mb-4 space-y-2">
                <input type="hidden" name="id" value={l.id} />
                <Textarea name="note" rows={2} placeholder="Anotação interna (só sua equipe vê)" required />
                <Button size="sm">Salvar anotação</Button>
              </form>
            )}
            <ul className="space-y-3">
              {(acts ?? []).map((a) => (
                <li key={a.id} className="border-l-2 border-primary-soft pl-3 text-sm">
                  <p className="text-mute">{dateTime(a.created_at)}</p>
                  <p className="[overflow-wrap:anywhere]">{activityText(a, { stage: (k) => stageName(stages, String(k ?? "")), member: (u) => (members ?? []).find((m) => m.user_id === u)?.email ?? "alguém da equipe", date: (s) => dateTime(s) })}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
        <div className="space-y-4">
          <CrmPanel id={l.id} ownerId={l.owner_id} tags={l.tags ?? []} followupAt={l.next_followup_at} followupNote={l.followup_note}
            members={(members ?? []) as Member[]} me={user.id} edit={edit} />
          <Card>
            <p className="text-sm text-mute">Temperatura</p>
            <p className="mt-1"><Badge className={t?.cls}>{t?.label} · {l.score} pontos</Badge></p>
            <p className="mt-2 text-sm text-mute">Soma pontos por visitas, páginas vistas, e-mail, anúncio pago e resposta do formulário.</p>
            <p className="mt-3 border-t border-line pt-3 text-sm"><span className="text-mute">Tempo até o primeiro atendimento: </span>
              <b className={resp === null ? "text-red-700" : resp <= 5 ? "text-emerald-700" : resp <= 60 ? "text-amber-700" : "text-red-700"}>{resp === null ? "ainda não atendido" : formatMinutes(resp)}</b></p>
          </Card>
          <CustomFieldsCard leadId={l.id} fields={(fields ?? []) as CustomField[]} values={l.custom ?? {}} birthday={l.birthday} edit={edit} />
          <SequenceCard leadId={l.id} sequences={(sequences ?? []) as SeqLite[]} running={running} edit={edit} />
          {(appts?.length ?? 0) > 0 && (
            <Card>
              <h2 className="mb-2 font-display font-semibold">Agendamentos</h2>
              <ul className="space-y-1 text-sm">{appts!.map((a) => <li key={a.id} className="flex justify-between gap-2"><span>{brDate(a.starts_at)} às {brTime(a.starts_at)} · {(a.booking_pages as unknown as { title: string } | null)?.title}</span><span className="text-mute">{a.status === "booked" ? "marcado" : a.status === "done" ? "realizado" : a.status === "no_show" ? "faltou" : "cancelado"}</span></li>)}</ul>
            </Card>
          )}
          <NpsCard leadId={l.id} phone={l.phone_e164} name={l.name} appUrl={base} last={npsRows?.[0] ?? null} />
          <Card>
            <form action={updateLead} className="space-y-3">
              <input type="hidden" name="id" value={l.id} />
              <Field label="Nome"><Input name="name" defaultValue={l.name ?? ""} disabled={!edit} /></Field>
              <Field label="E-mail"><Input name="email" type="email" defaultValue={l.email ?? ""} disabled={!edit} /></Field>
              <Field label="Valor da venda (R$)" hint="Preencha quando a venda for concluída."><Input name="deal_value" inputMode="decimal" defaultValue={l.deal_value ? String(l.deal_value).replace(".", ",") : ""} disabled={!edit} /></Field>
              {(stages.find((s) => s.key === l.status)?.kind === "lost" || l.lost_reason) && (
                <Field label="Motivo da perda" hint="Ex.: achou caro, parou de responder, comprou de outro.">
                  <Input name="lost_reason" list="motivos" maxLength={120} defaultValue={l.lost_reason ?? ""} disabled={!edit} />
                  <datalist id="motivos">{LOST_REASONS.map((r) => <option key={r} value={r} />)}</datalist>
                </Field>
              )}
              {edit && <Button size="sm" variant="outline">Salvar</Button>}
            </form>
          </Card>
          {isAdmin(role) && (
            <form action={deleteLead}>
              <input type="hidden" name="id" value={l.id} />
              <Button size="sm" variant="ghost" className="text-red-700">Excluir contato</Button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
