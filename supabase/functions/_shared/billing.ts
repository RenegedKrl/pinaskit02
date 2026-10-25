// Regras de cobrança puras (testáveis em tests/billing.test.ts).

/**
 * Até quando uma conta cancelada continua captando: o fim do período já pago
 * ou, se o teste grátis ainda não acabou, o fim do teste — o que for mais tarde.
 * null = sem acesso (nada pago e teste já vencido).
 */
export function accessUntilOnCancel(currentPeriodEnd: string | null, trialEndsAt: string | null, now = new Date()): string | null {
  const ends = [currentPeriodEnd, trialEndsAt]
    .filter((d): d is string => !!d)
    .map((d) => new Date(d))
    .filter((d) => d.getTime() > now.getTime());
  if (!ends.length) return currentPeriodEnd;
  return new Date(Math.max(...ends.map((d) => d.getTime()))).toISOString();
}
