import { Check, ExternalLink } from "lucide-react";
import { getSession, isAdmin, trialDaysLeft } from "@/lib/session";
import { asaas, PAY_STATUS, type AsaasPayment } from "@/lib/asaas";
import { brl, PLAN, CYCLES, discount, everyText, perMonth } from "@/lib/plan";
import { Badge, Button, Card, Field, Input, PageHeader } from "@/components/ui";
import { cancel, subscribe } from "./actions";

const STATUS: Record<string, { t: string; cls: string }> = {
  trial: { t: "Teste grátis", cls: "bg-primary-soft text-primary" },
  active: { t: "Ativa", cls: "bg-emerald-50 text-emerald-800" },
  past_due: { t: "Pagamento pendente", cls: "bg-amber-50 text-amber-900" },
  read_only: { t: "Somente leitura", cls: "bg-red-50 text-red-800" },
  canceled: { t: "Cancelada", cls: "bg-bg text-mute" },
};
const fmt = (d: string) => d.split("-").reverse().join("/");
const METHOD: Record<string, string> = { CREDIT_CARD: "Cartão", PIX: "PIX", BOLETO: "Boleto", UNDEFINED: "A escolher" };

export default async function Assinatura({ searchParams }: { searchParams: Promise<{ erro?: string; ok?: string; cancelada?: string }> }) {
  const sp = await searchParams;
  const { workspace: w, role, user } = await getSession();
  const st = STATUS[w.plan_status] ?? STATUS.trial;
  const hasSub = !!w.asaas_subscription_id && !["canceled", "read_only"].includes(w.plan_status);
  let payments: AsaasPayment[] = [];
  if (w.asaas_subscription_id) {
    try { payments = (await asaas<{ data: AsaasPayment[] }>(`/subscriptions/${w.asaas_subscription_id}/payments?limit=12`)).data; } catch { /* Asaas fora do ar: mostra sem faturas */ }
  }
  const open = payments.find((p) => p.status === "PENDING" || p.status === "OVERDUE");

  return (
    <>
      <PageHeader title="Assinatura" desc="Um plano só, com tudo liberado. Cancele quando quiser." />
      {sp.erro && <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-red-800">{sp.erro}</p>}
      {sp.ok && <p className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-emerald-800">Assinatura criada. Assim que o pagamento for confirmado, seu plano fica ativo.</p>}
      {sp.cancelada && <p className="mb-4 rounded-lg bg-bg px-4 py-3">Assinatura cancelada. Você continua com acesso até o fim do período já pago ou do teste grátis, o que for mais tarde.</p>}

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Plano {PLAN.name}</h2>
            <Badge className={st.cls}>{st.t}</Badge>
          </div>
          <p className="mt-3 font-display text-3xl font-bold">{brl(PLAN.monthly)}<span className="text-base font-normal text-mute">/mês</span></p>
          <p className="text-mute">ou {brl(PLAN.yearly)}/ano (sai {brl(PLAN.yearlyPerMonth)}/mês)</p>
          {w.plan_status === "trial" && <p className="mt-2 text-sm">Restam <b>{trialDaysLeft(w)}</b> dias de teste. Se assinar agora, a 1ª cobrança vence só no fim do teste.</p>}
          {w.current_period_end && w.plan_status !== "trial" && <p className="mt-2 text-sm text-mute">{w.plan_status === "canceled" ? "Acesso até" : "Período atual até"} {new Date(w.current_period_end).toLocaleDateString("pt-BR")}.</p>}
          <ul className="mt-4 space-y-2">
            {PLAN.features.map((f) => <li key={f} className="flex gap-2 text-[15px]"><Check size={18} className="mt-0.5 shrink-0 text-success" />{f}</li>)}
          </ul>
        </Card>

        {!hasSub ? (
          <Card>
            <h2 className="mb-4 font-display text-lg font-semibold">Assinar</h2>
            {!isAdmin(role) ? <p className="text-mute">Peça para o dono da conta assinar.</p> : (
              <form action={subscribe} className="space-y-4">
                <fieldset>
                  <legend className="mb-2 text-sm font-semibold">Período</legend>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {CYCLES.map((c, i) => (
                      <label key={c.id} className="relative cursor-pointer rounded-lg border border-line p-3 has-checked:border-primary has-checked:bg-primary-soft/50">
                        <input type="radio" name="cycle" value={c.id} defaultChecked={i === 0} className="sr-only" />
                        <b>{c.label}</b>{discount(c) > 0 && <span className="ml-1 text-xs font-semibold text-success">-{discount(c)}%</span>}
                        <br /><span className="text-sm text-mute">{brl(c.price)} {everyText(c.months)}</span>
                        {c.months > 1 && <><br /><span className="text-xs text-mute">sai {brl(perMonth(c))}/mês</span></>}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <fieldset>
                  <legend className="mb-2 text-sm font-semibold">Forma de pagamento</legend>
                  <div className="grid grid-cols-3 gap-2">
                    {[["CREDIT_CARD", "Cartão"], ["PIX", "PIX"], ["BOLETO", "Boleto"]].map(([v, l], i) => (
                      <label key={v} className="cursor-pointer rounded-lg border border-line p-3 text-center has-checked:border-primary has-checked:bg-primary-soft/50">
                        <input type="radio" name="method" value={v} defaultChecked={i === 0} className="sr-only" />{l}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <Field label="Nome completo ou razão social"><Input name="name" required autoComplete="name" /></Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="CPF ou CNPJ"><Input name="doc" required inputMode="numeric" placeholder="000.000.000-00" /></Field>
                  <Field label="CEP"><Input name="cep" required inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" /></Field>
                </div>
                <Field label="Cupom (opcional)"><Input name="coupon" className="uppercase" /></Field>
                <p className="text-xs text-mute">A cobrança vai para {user.email}. Você será levado à página segura de pagamento do Asaas.</p>
                <Button className="w-full">Continuar para o pagamento</Button>
              </form>
            )}
          </Card>
        ) : (
          <Card>
            <h2 className="mb-2 font-display text-lg font-semibold">Sua assinatura</h2>
            {open && (
              <div className="mb-4 rounded-lg bg-amber-50 p-3 text-amber-900">
                Fatura de {brl(open.value)} com vencimento em {fmt(open.dueDate)}.{" "}
                <a href={open.invoiceUrl} target="_blank" rel="noopener" className="font-semibold underline">Pagar agora</a>
              </div>
            )}
            <p className="text-sm text-mute">Para trocar cartão ou forma de pagamento, abra a fatura em aberto: a página do Asaas permite escolher outra forma.</p>
            {role === "owner" && (
              <details className="mt-6">
                <summary className="cursor-pointer text-sm text-red-700">Cancelar assinatura</summary>
                <form action={cancel} className="mt-3 space-y-3">
                  <p className="text-sm">Você mantém o acesso até o fim do período pago. Depois, o painel fica somente leitura e seus contatos continuam salvos para exportar.</p>
                  <Field label="Conte o motivo (opcional)"><Input name="reason" /></Field>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="confirm" /> Entendi e quero cancelar</label>
                  <Button variant="danger" size="sm">Cancelar assinatura</Button>
                </form>
              </details>
            )}
          </Card>
        )}
      </div>

      {payments.length > 0 && (
        <Card className="mt-4">
          <h2 className="mb-3 font-display font-semibold">Faturas</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[15px]">
              <thead className="text-sm text-mute"><tr><th className="py-2">Vencimento</th><th>Valor</th><th>Forma</th><th>Situação</th><th /></tr></thead>
              <tbody className="divide-y divide-line">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2">{fmt(p.dueDate)}</td><td>{brl(p.value)}</td><td>{METHOD[p.billingType] ?? p.billingType}</td>
                    <td>{PAY_STATUS[p.status] ?? p.status}</td>
                    <td className="text-right"><a href={p.invoiceUrl} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-primary">Ver <ExternalLink size={14} /></a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
