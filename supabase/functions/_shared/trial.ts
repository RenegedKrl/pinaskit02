// Regras puras dos e-mails do teste grátis (testadas em tests/growth.test.ts).
export const TRIAL_DAYS = 7;

/** Aviso do dia 2: conta com 2+ dias de teste, ainda em teste e sem botão instalado. */
export function nudgeDue(trialEndsAt: Date, installed: boolean, now = new Date()): boolean {
  if (installed) return false;
  const left = trialEndsAt.getTime() - now.getTime();
  return left > 0 && left <= (TRIAL_DAYS - 2) * 86_400_000;
}
