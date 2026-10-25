import Link from "next/link";
import { Download } from "lucide-react";
import { canEdit, getSession } from "@/lib/session";
import { TEMP } from "@/lib/copy";
import { getStages, stageName } from "@/lib/stages";
import { dateTime, formatPhone } from "@/lib/utils";
import { Badge, Card, Empty, Input, PageHeader, Select } from "@/components/ui";
import { StatusSelect } from "@/components/contatos/status-select";
import { applyFilters, type LeadFilters } from "./filters";

const PAGE = 25;

export default async function Contatos({ searchParams }: { searchParams: Promise<LeadFilters & { ok?: string }> }) {
  const f = await searchParams;
  const { supabase, workspace, role, user } = await getSession();
  const page = Math.max(1, Number(f.pag) || 1);
  const { q, days } = applyFilters(
    supabase.from("leads").select("id, name, phone_e164, email, source_label, status, temperature, score, created_at, tags, next_followup_at, widgets(name)", { count: "exact" })
      .eq("workspace_id", workspace.id), { ...f, me: user.id });
  const [{ data: leads, count }, { data: srcRows }, stages, { data: points }] = await Promise.all([
    q.order("created_at", { ascending: false }).range((page - 1) * PAGE, page * PAGE - 1),
    supabase.from("leads").select("source_label, tags").eq("workspace_id", workspace.id).limit(1000),
    getStages(supabase, workspace.id),
    supabase.from("widgets").select("id, name").eq("workspace_id", workspace.id).order("name"),
  ]);
  const allTags = [...new Set((srcRows ?? []).flatMap((r) => r.tags ?? []))].sort() as string[];
  const sources = [...new Set((srcRows ?? []).map((r) => r.source_label).filter(Boolean))] as string[];
  const qs = new URLSearchParams(Object.entries(f).filter(([k, v]) => v && k !== "pag" && k !== "ok") as [string, string][]).toString();
  const total = count ?? 0;
  const edit = canEdit(role);

  return (
    <>
      <PageHeader title="Contatos" desc="Pessoas que deixaram o contato pelo seu site (leads)." action={
        <a href={`/painel/contatos/exportar?${qs}`} className="inline-flex h-11 items-center gap-2 rounded-lg border border-line bg-card px-4 font-semibold"><Download size={18} />Exportar para Excel</a>
      } />
      {f.ok && <p role="status" className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-emerald-800">{f.ok}</p>}
      <form data-tour="filtros" className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <Input name="q" defaultValue={f.q} placeholder="Buscar nome, telefone ou e-mail" className="lg:col-span-2" />
        <Select name="p" defaultValue={String(days)} aria-label="Período">
          <option value="7">Últimos 7 dias</option><option value="30">Últimos 30 dias</option><option value="90">Últimos 90 dias</option><option value="365">Último ano</option>
        </Select>
        <Select name="origem" defaultValue={f.origem ?? ""} aria-label="Origem"><option value="">Todas as origens</option>{sources.map((s) => <option key={s}>{s}</option>)}</Select>
        {!!points?.length && <Select name="ponto" defaultValue={f.ponto ?? ""} aria-label="Ponto de contato"><option value="">Todos os pontos de contato</option>{points!.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</Select>}
        <Select name="resp" defaultValue={f.resp ?? ""} aria-label="Responsável"><option value="">Todos os responsáveis</option><option value="eu">Meus contatos</option><option value="ninguem">Sem responsável</option></Select>
        {allTags.length > 0 && <Select name="tag" defaultValue={f.tag ?? ""} aria-label="Etiqueta"><option value="">Todas as etiquetas</option>{allTags.map((t) => <option key={t} value={t}>{t}</option>)}</Select>}
        <Select name="temp" defaultValue={f.temp ?? ""} aria-label="Temperatura"><option value="">Toda temperatura</option>{Object.entries(TEMP).map(([k, t]) => <option key={k} value={k}>{t.label}</option>)}</Select>
        <div className="flex gap-2">
          <Select name="status" defaultValue={f.status ?? ""} aria-label="Etapa"><option value="">Todas as etapas</option>{stages.map((s) => <option key={s.key} value={s.key}>{s.name}</option>)}</Select>
          <button className="rounded-lg bg-primary px-4 font-semibold text-white">Filtrar</button>
        </div>
      </form>

      {!leads?.length ? (
        <Empty title={qs ? "Nenhum contato com esses filtros" : "Você ainda não recebeu contatos"}
          desc={qs ? "Tente outro período ou limpe os filtros." : "Quando alguém preencher seu formulário ou o botão, o contato aparece aqui com a origem."}
          action={<Link className="font-semibold text-primary" href={qs ? "/painel/contatos" : "/painel/captacao"}>{qs ? "Limpar filtros" : "Verificar minha captação"}</Link>} />
      ) : (
        <>
          <Card className="hidden overflow-x-auto p-0 md:block">
            <table className="w-full text-left text-[15px]">
              <thead className="border-b border-line text-sm text-mute"><tr>{["Nome", "WhatsApp", "Origem", "Temperatura", "Etapa", "Chegou em"].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id} className="border-b border-line last:border-0 hover:bg-bg">
                    <td className="px-4 py-3"><Link href={`/painel/contatos/${l.id}`} className="font-semibold hover:text-primary">{l.name || "Sem nome"}</Link>{(l.tags?.length ?? 0) > 0 && <div className="mt-1 flex flex-wrap gap-1">{l.tags!.slice(0, 3).map((t: string) => <span key={t} className="rounded bg-primary-soft px-1.5 py-0.5 text-[11px] font-semibold text-primary">{t}</span>)}</div>}</td>
                    <td className="px-4 py-3"><a className="text-emerald-700 hover:underline" target="_blank" rel="noopener" href={`https://wa.me/${l.phone_e164}`}>{formatPhone(l.phone_e164)}</a></td>
                    <td className="px-4 py-3">{l.source_label || "Acesso direto"}</td>
                    <td className="px-4 py-3"><Badge className={TEMP[l.temperature as keyof typeof TEMP]?.cls}>{TEMP[l.temperature as keyof typeof TEMP]?.label} · {l.score}</Badge></td>
                    <td className="px-4 py-2"><StatusSelect id={l.id} status={l.status} stages={stages} disabled={!edit} /></td>
                    <td className="px-4 py-3 text-mute">{dateTime(l.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <div className="space-y-2 md:hidden">
            {leads.map((l) => (
              <Link key={l.id} href={`/painel/contatos/${l.id}`} className="block rounded-2xl border border-line bg-card p-4">
                <div className="flex justify-between"><span className="font-semibold">{l.name || "Sem nome"}</span><Badge className={TEMP[l.temperature as keyof typeof TEMP]?.cls}>{TEMP[l.temperature as keyof typeof TEMP]?.label}</Badge></div>
                <p className="text-sm text-mute">{l.source_label || "Acesso direto"} · {dateTime(l.created_at)}</p>
                <p className="text-sm">{stageName(stages, l.status)}</p>
              </Link>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between text-sm text-mute">
            <span>Mostrando {(page - 1) * PAGE + 1}–{Math.min(page * PAGE, total)} de {total}</span>
            <div className="flex gap-2">
              {page > 1 && <Link className="rounded-lg border border-line bg-card px-3 py-1.5" href={`?${qs}&pag=${page - 1}`}>Anterior</Link>}
              {page * PAGE < total && <Link className="rounded-lg border border-line bg-card px-3 py-1.5" href={`?${qs}&pag=${page + 1}`}>Próxima</Link>}
            </div>
          </div>
        </>
      )}
    </>
  );
}
