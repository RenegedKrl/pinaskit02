import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { asaas } from "@/lib/asaas";
import { brl } from "@/lib/plan";
import { isSuperAdmin, mrr, summarize } from "@/lib/admin-metrics";
import { Badge, Card, PageHeader } from "@/components/ui";

const ST: Record<string, [string, string]> = {
  trial: ["Teste", "bg-primary-soft text-primary"], active: ["Pagando", "bg-emerald-50 text-emerald-800"],
  past_due: ["Pendente", "bg-amber-50 text-amber-900"], read_only: ["Somente leitura", "bg-red-50 text-red-800"], canceled: ["Cancelado", "bg-bg text-mute"],
};
const day = (s: string | null) => (s ? new Date(s).toLocaleDateString("pt-BR") : "—");

/** Painel do dono do Pinas Kit: só para e-mails em SUPERADMIN_EMAILS. Lê tudo com a chave de serviço, no servidor. */
export default async function Admin() {
  const { user } = await getSession();
  if (!isSuperAdmin(user.email)) notFound();
  const db = supabaseAdmin();
  const [{ data: list }, { data: owners }, { data: installed }] = await Promise.all([
    db.from("workspaces").select("id, name, plan_status, trial_ends_at, current_period_end, created_at").order("created_at", { ascending: false }).limit(2000),
    db.from("workspace_members").select("workspace_id, email").eq("role", "owner"),
    db.from("widgets").select("workspace_id").not("first_seen_at", "is", null),
  ]);
  let subs: { value: number; cycle: string }[] = []; let asaasOk = true;
  try {
    for (let offset = 0; offset < 1000; offset += 100) {
      const r = await asaas<{ data: { value: number; cycle: string }[]; hasMore: boolean }>(`/subscriptions?status=ACTIVE&limit=100&offset=${offset}`);
      subs = subs.concat(r.data); if (!r.hasMore) break;
    }
  } catch { asaasOk = false; }

  const s = summarize(list ?? []);
  const owner = new Map((owners ?? []).map((o) => [o.workspace_id, o.email]));
  const inst = new Set((installed ?? []).map((w) => w.workspace_id));
  const paying = s.active + s.pastDue;
  const kpis: [string, string, string?][] = [
    ["Receita mensal (MRR)", asaasOk ? brl(mrr(subs)) : "Asaas fora do ar", `${subs.length} assinaturas ativas no Asaas`],
    ["Pagando", String(paying), s.pastDue ? `${s.pastDue} com pagamento pendente` : undefined],
    ["Em teste", String(s.trial), `${s.trialEndingSoon} terminam em até 2 dias`],
    ["Cancelaram ou expiraram", String(s.churned), `de ${s.total} contas`],
    ["Cadastros", `${s.signups7} / ${s.signups30}`, "últimos 7 / 30 dias"],
    ["Conversão do teste", s.total ? `${Math.round((paying / s.total) * 100)}%` : "—", "contas pagando ÷ todas"],
  ];

  return (
    <>
      <PageHeader title="Painel do dono" desc="Visão do negócio Pinas Kit: só você vê esta página." />
      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map(([l, v, h]) => <Card key={l}><p className="text-sm text-mute">{l}</p><p className="mt-2 font-display text-3xl font-bold tabular-nums">{v}</p>{h && <p className="mt-1 text-sm text-mute">{h}</p>}</Card>)}
      </div>
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[760px] text-left text-[15px]">
          <thead className="border-b border-line text-sm text-mute"><tr>{["Conta", "Dono", "Situação", "Instalou?", "Criada em", "Teste até", "Pago até"].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
          <tbody>{(list ?? []).slice(0, 200).map((w) => {
            const [t, cls] = ST[w.plan_status] ?? [w.plan_status, ""];
            return (
              <tr key={w.id} className="border-b border-line last:border-0">
                <td className="px-4 py-2.5 font-semibold">{w.name}</td><td className="px-4 py-2.5 text-mute">{owner.get(w.id) ?? "—"}</td>
                <td className="px-4 py-2.5"><Badge className={cls}>{t}</Badge></td><td className="px-4 py-2.5">{inst.has(w.id) ? "Sim" : <span className="text-mute">Não</span>}</td>
                <td className="px-4 py-2.5 text-mute">{day(w.created_at)}</td><td className="px-4 py-2.5 text-mute">{day(w.trial_ends_at)}</td><td className="px-4 py-2.5 text-mute">{day(w.current_period_end)}</td>
              </tr>
            );
          })}</tbody>
        </table>
      </Card>
      {(list?.length ?? 0) > 200 && <p className="mt-2 text-sm text-mute">Mostrando as 200 contas mais recentes de {list!.length}.</p>}
    </>
  );
}
