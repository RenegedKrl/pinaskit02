import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { canEdit, getSession, isAdmin } from "@/lib/session";
import { METHOD_LABEL, STATUS, statusLabel, TEMP } from "@/lib/copy";
import { dateTime, formatPhone } from "@/lib/utils";
import { WhatsAppIcon, Badge, Button, Card, Field, Input, Select, Textarea } from "@/components/ui";
import { Journey, type PageView } from "@/components/contatos/journey";
import { addNote, deleteLead, setStatus, updateLead } from "../actions";

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
        {rows.filter(([, v]) => v).map(([k, v]) => <div key={k} className="flex gap-2"><dt className="w-40 shrink-0 text-mute">{k}</dt><dd className="break-all">{v}</dd></div>)}
        {t.click_ids && <div className="flex gap-2"><dt className="w-40 shrink-0 text-mute">Clique de anúncio</dt><dd>{Object.keys(t.click_ids).join(", ")}</dd></div>}
      </dl>
    </div>
  );
}

export default async function Contato({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, workspace, role } = await getSession();
  const { data: l } = await supabase.from("leads").select("*, widgets(name)").eq("id", id).eq("workspace_id", workspace.id).maybeSingle();
  if (!l) notFound();
  const { data: acts } = await supabase.from("lead_activities").select("id, type, body, created_at").eq("lead_id", id).order("created_at", { ascending: false }).limit(50);
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
        <a href={`https://wa.me/${l.phone_e164}?text=${encodeURIComponent(`Olá${firstName ? `, ${firstName}` : ""}! Tudo bem?`)}`} target="_blank" rel="noopener"
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-success px-5 font-semibold text-white"><WhatsAppIcon size={18} />Abrir no WhatsApp</a>
      </div>
      <p className="-mt-4 mb-6 text-sm text-mute">O WhatsApp abre no seu celular ou computador. O Pinas Kit não lê suas conversas.</p>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <h2 className="font-display font-semibold">Etapa do atendimento</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {STATUS.map((s) => (
                <form key={s.id} action={setStatus}>
                <input type="hidden" name="id" value={l.id} />
                <input type="hidden" name="status" value={s.id} />
                <input type="hidden" name="back" value={`/painel/contatos/${l.id}`} />
                <button disabled={!edit} title={s.hint}
                  className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${l.status === s.id ? "border-primary bg-primary text-white" : "border-line bg-card hover:border-primary"}`}>{s.label}</button>
                </form>
              ))}
            </div>
          </Card>
          <Card>
            <h2 className="mb-3 font-display font-semibold">De onde veio</h2>
            <p className="mb-3"><Badge className="bg-primary-soft text-primary">{l.source_label || "Acesso direto"}</Badge> <span className="text-sm text-mute">por {METHOD_LABEL[l.capture_method] ?? "formulário"}{l.widgets?.name ? ` · ${l.widgets.name}` : ""}</span></p>
            <div className="grid gap-4 md:grid-cols-2">
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
                  <p>{a.type === "note" ? a.body?.text : a.type === "status_change" ? `Etapa: ${statusLabel(a.body?.from)} → ${statusLabel(a.body?.to)}` : a.type === "form_submit" ? `Enviou o formulário (${METHOD_LABEL[a.body?.method] ?? "site"})${a.body?.url ? ` em ${a.body.url}` : ""}` : a.type}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
        <div className="space-y-4">
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
