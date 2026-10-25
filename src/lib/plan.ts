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

export const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
