// Painel do dono do SaaS: regras puras (testadas em tests/growth.test.ts).

/** Só quem está em SUPERADMIN_EMAILS (separados por vírgula) vê o painel do dono. */
export function isSuperAdmin(email: string | undefined | null, list = process.env.SUPERADMIN_EMAILS ?? ""): boolean {
  if (!email) return false;
  return list.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean).includes(email.toLowerCase());
}

const MONTHS: Record<string, number> = { WEEKLY: 12 / 52, BIWEEKLY: 12 / 26, MONTHLY: 1, BIMONTHLY: 2, QUARTERLY: 3, SEMIANNUALLY: 6, YEARLY: 12 };

/** Receita recorrente mensal: cada assinatura ativa dividida pelos meses do ciclo (anual de 499 = 41,58/mês). */
export function mrr(subs: { value: number; cycle: string }[]): number {
  const total = subs.reduce((a, s) => a + (Number(s.value) || 0) / (MONTHS[s.cycle] ?? 1), 0);
  return Math.round(total * 100) / 100;
}

export interface WsRow { plan_status: string; trial_ends_at: string; created_at: string }

/** Contagens por situação e cadastros recentes. Teste vencido ainda marcado "trial" conta como expirado. */
export function summarize(list: WsRow[], now = new Date()) {
  const t = now.getTime(), d = 86_400_000;
  const trialing = list.filter((w) => w.plan_status === "trial" && new Date(w.trial_ends_at).getTime() > t);
  return {
    total: list.length,
    trial: trialing.length,
    trialEndingSoon: trialing.filter((w) => new Date(w.trial_ends_at).getTime() - t <= 2 * d).length,
    active: list.filter((w) => w.plan_status === "active").length,
    pastDue: list.filter((w) => w.plan_status === "past_due").length,
    churned: list.filter((w) => w.plan_status === "canceled" || w.plan_status === "read_only" || (w.plan_status === "trial" && new Date(w.trial_ends_at).getTime() <= t)).length,
    signups7: list.filter((w) => t - new Date(w.created_at).getTime() <= 7 * d).length,
    signups30: list.filter((w) => t - new Date(w.created_at).getTime() <= 30 * d).length,
  };
}
