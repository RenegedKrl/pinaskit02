// Automações "quando → então" (puro, testado em tests/crm.test.ts).
export type Trigger = "lead_created" | "lead_hot" | "stage_enter" | "stale";
export const TRIGGERS: Record<Trigger, string> = {
  lead_created: "Quando chegar um contato novo",
  lead_hot: "Quando o contato ficar quente",
  stage_enter: "Quando o contato entrar na etapa",
  stale: "Quando o contato ficar parado há",
};

export interface RuleInput {
  name: string; trigger: Trigger; stage_key: string | null; days: number; task_title: string; task_kind: string;
  task_days: number; task_message: string | null; assign: "lead_owner" | "workspace_owner"; active: boolean;
}

const KINDS = new Set(["call", "whatsapp", "proposal", "charge", "meeting", "followup", "recall", "other"]);

export function cleanRule(r: RuleInput): RuleInput | { error: string } {
  if (!(r.trigger in TRIGGERS)) return { error: "Escolha quando a regra roda." };
  const name = String(r.name ?? "").trim().slice(0, 60), title = String(r.task_title ?? "").trim().slice(0, 140);
  if (!name) return { error: "Dê um nome para a automação." };
  if (!title) return { error: "Escreva o título da tarefa que será criada." };
  if (r.trigger === "stage_enter" && !/^[a-z0-9_]{2,40}$/.test(r.stage_key ?? "")) return { error: "Escolha uma etapa do funil." };
  return {
    name, trigger: r.trigger, stage_key: r.trigger === "stage_enter" ? r.stage_key : null,
    days: Math.min(365, Math.max(1, Math.round(Number(r.days) || 3))), task_title: title,
    task_kind: KINDS.has(r.task_kind) ? r.task_kind : "followup", task_days: Math.min(730, Math.max(0, Math.round(Number(r.task_days) || 0))),
    task_message: String(r.task_message ?? "").trim().slice(0, 1000) || null,
    assign: r.assign === "workspace_owner" ? "workspace_owner" : "lead_owner", active: r.active !== false,
  };
}

/** Modelos prontos, incluindo pós-venda e recompra. stage: "won" troca pela etapa de venda da conta. */
export const PRESETS: (Omit<RuleInput, "stage_key" | "active"> & { stage?: "won" | "proposta"; group: string })[] = [
  { group: "Vendas", name: "Contato quente → atender já", trigger: "lead_hot", days: 3, task_title: "Contato quente: falar agora", task_kind: "call", task_days: 0, task_message: null, assign: "workspace_owner" },
  { group: "Vendas", name: "Parado há 3 dias → aviso", trigger: "stale", days: 3, task_title: "Contato parado há 3 dias: retomar conversa", task_kind: "followup", task_days: 0, task_message: "Oi {primeiro_nome}! Passando para saber se ficou alguma dúvida. Posso te ajudar?", assign: "lead_owner" },
  { group: "Vendas", name: "Proposta → cobrar em 2 dias", trigger: "stage_enter", stage: "proposta", days: 3, task_title: "Cobrar resposta da proposta", task_kind: "charge", task_days: 2, task_message: "Oi {primeiro_nome}! Conseguiu ver a proposta? Fico à disposição para ajustar o que precisar.", assign: "lead_owner" },
  { group: "Pós-venda", name: "Venda → pedir avaliação em 7 dias", trigger: "stage_enter", stage: "won", days: 3, task_title: "Pedir avaliação do atendimento", task_kind: "recall", task_days: 7, task_message: "Oi {primeiro_nome}! Como foi sua experiência com a gente? Sua opinião ajuda muito.", assign: "lead_owner" },
  { group: "Pós-venda", name: "Venda → retorno em 6 meses", trigger: "stage_enter", stage: "won", days: 3, task_title: "Retorno de 6 meses (recompra)", task_kind: "recall", task_days: 180, task_message: "Oi {primeiro_nome}! Já faz 6 meses desde seu último atendimento. Vamos agendar o retorno?", assign: "lead_owner" },
  { group: "Pós-venda", name: "Venda → retorno em 1 ano", trigger: "stage_enter", stage: "won", days: 3, task_title: "Retorno de 1 ano (recompra)", task_kind: "recall", task_days: 365, task_message: "Oi {primeiro_nome}! Faz um ano que você é nosso cliente. Que tal renovar?", assign: "lead_owner" },
];

/** Frase da regra para mostrar na lista. */
export function describeRule(r: Pick<RuleInput, "trigger" | "days" | "task_title" | "task_days">, stageName: string): string {
  const when = r.trigger === "stage_enter" ? `${TRIGGERS.stage_enter} “${stageName}”` : r.trigger === "stale" ? `${TRIGGERS.stale} ${r.days} ${r.days === 1 ? "dia" : "dias"}` : TRIGGERS[r.trigger];
  const due = r.task_days === 0 ? "para hoje" : r.task_days === 1 ? "para amanhã" : `para daqui a ${r.task_days} dias`;
  return `${when} → criar a tarefa “${r.task_title}” ${due}`;
}
