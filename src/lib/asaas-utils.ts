// Funções puras de cobrança (testáveis sem servidor).
export const digits = (s: string) => s.replace(/\D/g, "");

/** Valida CPF (11) ou CNPJ (14) pelos dígitos verificadores. */
export function validDoc(raw: string): string | null {
  const d = digits(raw);
  if (/^(\d)\1+$/.test(d)) return null;
  if (d.length === 11) {
    for (const n of [9, 10]) {
      let s = 0;
      for (let i = 0; i < n; i++) s += Number(d[i]) * (n + 1 - i);
      if (((s * 10) % 11) % 10 !== Number(d[n])) return null;
    }
    return d;
  }
  if (d.length === 14) {
    for (const n of [12, 13]) {
      const w = n === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
      const s = w.reduce((a, x, i) => a + x * Number(d[i]), 0);
      const r = s % 11 < 2 ? 0 : 11 - (s % 11);
      if (r !== Number(d[n])) return null;
    }
    return d;
  }
  return null;
}

/** Cupons: variável PINAS_COUPONS="PROMO10:10,AMIGO20:20" (percentual de desconto). */
export function couponPercent(code: string): number {
  const c = code.trim().toUpperCase();
  if (!c) return 0;
  for (const pair of (process.env.PINAS_COUPONS || "").split(",")) {
    const [k, v] = pair.split(":");
    if (k?.trim().toUpperCase() === c) return Math.min(100, Math.max(0, Number(v) || 0));
  }
  return -1;
}

