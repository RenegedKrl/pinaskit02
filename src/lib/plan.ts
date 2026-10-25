// Plano único, igual ao modelo do CentralKit.
export const PLAN = {
  name: "Essencial",
  monthly: 49.9,
  yearly: 499,
  yearlyPerMonth: 41.58,
  trialDays: 7,
  features: [
    "Botões e formulários ilimitados",
    "Contatos ilimitados",
    "Origem de cada contato (anúncios, páginas e campanhas)",
    "Formulário no fim da página, botão flutuante ou os dois",
    "Funil de atendimento e pontuação de contatos",
    "Exportação para Excel",
    "Usuários ilimitados na equipe",
  ],
} as const;

/** Períodos de cobrança (o "id" é o ciclo do Asaas). Preço total do período; o resto é calculado. */
export const CYCLES = [
  { id: "MONTHLY", label: "Mensal", months: 1, price: 49.9 },
  { id: "QUARTERLY", label: "Trimestral", months: 3, price: 139.9 },
  { id: "SEMIANNUALLY", label: "Semestral", months: 6, price: 269.9 },
  { id: "YEARLY", label: "Anual", months: 12, price: 499 },
] as const;
export type CycleId = (typeof CYCLES)[number]["id"];
export const cycleById = (id: string) => CYCLES.find((c) => c.id === id) ?? CYCLES[0];
/** Quanto sai por mês, arredondado para baixo no centavo (nunca promete menos do que cobra). */
export const perMonth = (c: { price: number; months: number }) => Math.floor((c.price / c.months) * 100) / 100;
/** Desconto inteiro em % em relação a pagar o mensal pelo mesmo tempo. */
export const discount = (c: { price: number; months: number }) => Math.round((1 - c.price / (CYCLES[0].price * c.months)) * 100);
/** Texto do período em português ("a cada 3 meses"). */
export const everyText = (months: number) => (months === 1 ? "por mês" : months === 12 ? "por ano" : `a cada ${months} meses`);

export const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
