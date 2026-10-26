// Texto do histórico do contato (puro).
import { METHOD_LABEL } from "./copy";
import { brl } from "./plan";

type A = { type: string; body: Record<string, unknown> | null };
type Fmt = { stage: (k: unknown) => string; member: (id: unknown) => string; date: (s: string) => string };

export function activityText(a: A, f: Fmt): string {
  const b = (a.body ?? {}) as Record<string, string & number>;
  switch (a.type) {
    case "note": return b.text;
    case "status_change": return `Etapa: ${f.stage(b.from)} → ${f.stage(b.to)}${b.deal_value ? ` · ${brl(Number(b.deal_value))}` : ""}${b.lost_reason ? ` · motivo: ${b.lost_reason}` : ""}`;
    case "owner_change": return b.to ? `Responsável: ${f.member(b.to)}` : "Responsável removido";
    case "followup": return `Lembrete de retorno para ${f.date(b.at)}${b.note ? `: ${b.note}` : ""}`;
    case "form_submit": return `Enviou o formulário (${METHOD_LABEL[b.method] ?? "site"})${b.url ? ` em ${b.url}` : ""}`;
    case "whatsapp_open": return "Abriu conversa no WhatsApp pelo painel";
    case "sequence_start": return `Entrou na sequência “${b.name}” (${b.steps} mensagens)`;
    case "deal_close": return `Negociação “${b.title}” ${b.status === "won" ? "ganha" : "perdida"} · ${brl(Number(b.value))}`;
    case "proposal_sent": return `Proposta “${b.title}” criada · ${brl(Number(b.total))}`;
    case "proposal_accepted": return `✅ Cliente aceitou a proposta “${b.title}” · ${brl(Number(b.total))}${b.name ? ` (${b.name})` : ""}`;
    case "proposal_declined": return `Cliente recusou a proposta “${b.title}”${b.reason ? `: ${b.reason}` : ""}`;
    case "booking": return `Agendou ${b.page ? `“${b.page}” ` : ""}para ${f.date(b.at)}`;
    case "nps": return `Respondeu a pesquisa: nota ${b.score}${b.comment ? ` · “${b.comment}”` : ""}`;
    case "merge": return `Contato repetido juntado a este (${b.name || "sem nome"} · +${b.phone})`;
    case "import": return "Importado de planilha";
    default: return a.type;
  }
}
