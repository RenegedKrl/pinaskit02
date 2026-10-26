import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { canEdit, getSession, isAdmin } from "@/lib/session";
import { LOST_REASONS, METHOD_LABEL, TEMP } from "@/lib/copy";
import { getStages, stageName } from "@/lib/stages";
import { dateTime, formatPhone } from "@/lib/utils";
import { WhatsAppIcon, Badge, Button, Card, Field, Input, Select, Textarea } from "@/components/ui";
import { Journey, type PageView } from "@/components/contatos/journey";
import { StatusButtons } from "@/components/contatos/status-buttons";
import { CrmPanel, type Member } from "@/components/contatos/crm-panel";
import { TemplateMenu, type Template } from "@/components/contatos/template-menu";
import { addNote, deleteLead, updateLead } from "../actions";

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
        <a href={`https://wa.me/${l.phone_e164}?text=${encodeURIComponent(`Olá${firstName ? `, ${firstName}` : ""}! Tudo bem?`)}`} target="_blank" rel="noopener"
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-success px-5 font-semibold text-white"><WhatsAppIcon size={18} />Abrir no WhatsApp</a>
        </div>
      </div>
      <p className="-mt-4 mb-6 text-sm text-mute">O WhatsApp abre no seu celular ou computador. O Pinas Kit não lê suas conversas.</p>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <h2 className="font-display font-semibold">Etapa do atendimento</h2>
            <StatusButtons id={l.id} status={l.status} stages={stages} disabled={!edit} />
          </Card>
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
                  <p>{a.type === "note" ? a.body?.text : a.type === "status_change" ? `Etapa: ${stageName(stages, a.body?.from)} → ${stageName(stages, a.body?.to)}` : a.type === "owner_change" ? (a.body?.to ? `Responsável: ${(members ?? []).find((m) => m.user_id === a.body.to)?.email ?? "alguém da equipe"}` : "Responsável removido") : a.type === "followup" ? `Lembrete de retorno para ${dateTime(a.body?.at)}${a.body?.note ? `: ${a.body.note}` : ""}` : a.type === "form_submit" ? `Enviou o formulário (${METHOD_LABEL[a.body?.method] ?? "site"})${a.body?.url ? ` em ${a.body.url}` : ""}` : a.type}</p>
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
          </Card>
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
