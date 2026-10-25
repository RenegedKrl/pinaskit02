// Todos os textos de status e etapas ficam aqui.
export const STATUS = [
  { id: "novo", label: "Novo", hint: "Ainda não foi atendido" },
  { id: "em_atendimento", label: "Em atendimento", hint: "Conversa em andamento" },
  { id: "proposta", label: "Proposta enviada", hint: "Orçamento ou proposta enviada" },
  { id: "negociacao", label: "Negociação", hint: "Ajustando condições" },
  { id: "ganho", label: "Venda concluída", hint: "Virou cliente" },
  { id: "perdido", label: "Não convertido", hint: "Desistiu ou não tinha perfil" },
] as const;
export type Status = (typeof STATUS)[number]["id"];
export const statusLabel = (s: string) => STATUS.find((x) => x.id === s)?.label ?? s;

export const TEMP = {
  frio: { label: "Frio", cls: "bg-sky-100 text-sky-800" },
  morno: { label: "Morno", cls: "bg-amber-100 text-amber-800" },
  quente: { label: "Quente", cls: "bg-red-100 text-red-700" },
} as const;

export const MODES = {
  button: { label: "Botão", desc: "Um botão de WhatsApp no canto da tela, com balão e mini-formulário opcional." },
  form: { label: "Formulário", desc: "Uma seção de formulário no fim da página, antes do rodapé." },
  both: { label: "Botão + Formulário", desc: "As duas portas de entrada. O botão leva até o formulário." },
} as const;

export const METHOD_LABEL: Record<string, string> = {
  button_form: "Formulário do botão",
  page_form: "Formulário da página",
  connected_form: "Formulário do seu site",
  direct_link: "Link direto",
};
