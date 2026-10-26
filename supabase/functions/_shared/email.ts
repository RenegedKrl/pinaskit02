// E-mails transacionais (Resend). Montagem pura (testável) + envio.
// Variáveis: RESEND_API_KEY, EMAIL_FROM ("Pinas Kit <avisos@seudominio.com.br>"), APP_URL.

export interface Email { to: string[]; subject: string; html: string; text: string }

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function layout(title: string, lines: string[], button: { label: string; url: string }): string {
  return `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#1f2937">
<h2 style="color:#7C3AED;margin:0 0 16px">${esc(title)}</h2>
${lines.map((l) => `<p style="margin:0 0 10px;font-size:15px">${l}</p>`).join("\n")}
<p style="margin:20px 0"><a href="${esc(button.url)}" style="background:#7C3AED;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">${esc(button.label)}</a></p>
<p style="font-size:12px;color:#6b7280">Pinas Kit · você recebe este aviso por ser responsável por esta conta.</p></div>`;
}

export interface NewLead { name: string | null; phone: string; source: string; option: string | null; message: string | null; leadId: string }

/** Aviso de novo contato para os responsáveis da conta. */
export function newLeadEmail(to: string[], lead: NewLead, appUrl: string): Email {
  const who = lead.name || "Sem nome";
  const url = `${appUrl}/painel/contatos/${lead.leadId}`;
  const rows: [string, string | null][] = [
    ["Nome", who], ["WhatsApp", "+" + lead.phone], ["Origem", lead.source], ["Resposta", lead.option], ["Mensagem", lead.message],
  ];
  const filled = rows.filter(([, v]) => v) as [string, string][];
  return {
    to,
    subject: `Novo contato: ${who} (${lead.source})`,
    html: layout("Você recebeu um novo contato", filled.map(([k, v]) => `<b>${k}:</b> ${esc(v)}`), { label: "Ver contato", url }),
    text: `Você recebeu um novo contato.\n\n${filled.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\nVer contato: ${url}`,
  };
}

/** Aviso de que o teste grátis está acabando. */
export function trialEndingEmail(to: string[], trialEndsAt: Date, appUrl: string, now = new Date()): Email {
  const days = Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / 86_400_000));
  const when = days <= 0 ? "hoje" : days === 1 ? "amanhã" : `em ${days} dias`;
  const date = trialEndsAt.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const url = `${appUrl}/painel/assinatura`;
  return {
    to,
    subject: `Seu teste do Pinas Kit termina ${when}`,
    html: layout(`Seu teste termina ${when}`, [
      `O teste grátis do Pinas Kit vai até <b>${esc(date)}</b>.`,
      "Depois disso, seu botão e formulário param de receber contatos. Seus dados continuam guardados e você pode exportá-los.",
      "Para continuar captando sem interrupção, assine o plano Essencial (R$ 49,90/mês).",
    ], { label: "Assinar agora", url }),
    text: `O teste grátis do Pinas Kit vai até ${date}.\nDepois disso, seu botão e formulário param de receber contatos. Seus dados continuam guardados.\n\nAssinar: ${url}`,
  };
}

export interface Digest { newLeads: number; hot: number; followupsToday: number; won: number; revenue: number; topSource: string | null }

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Há algo útil para contar? Sem contato ontem e sem retorno hoje, não manda e-mail vazio. */
export function digestWorthSending(d: Digest): boolean {
  return d.newLeads > 0 || d.followupsToday > 0 || d.won > 0;
}

/** Resumo diário: o que chegou ontem e o que fazer hoje. */
export function dailyDigestEmail(to: string[], d: Digest, appUrl: string): Email {
  const lines = [
    `Ontem chegaram <b>${plural(d.newLeads, "contato", "contatos")}</b>${d.hot ? `, ${plural(d.hot, "quente", "quentes")}` : ""}.`,
    d.topSource && d.newLeads ? `A origem que mais trouxe contatos foi <b>${esc(d.topSource)}</b>.` : "",
    d.won ? `Você registrou <b>${plural(d.won, "venda", "vendas")}</b>${d.revenue ? ` (${brl(d.revenue)})` : ""}.` : "",
    d.followupsToday ? `Hoje você tem <b>${plural(d.followupsToday, "retorno marcado", "retornos marcados")}</b>.` : "Nenhum retorno marcado para hoje.",
  ].filter(Boolean);
  const subject = `Resumo de ontem: ${plural(d.newLeads, "contato", "contatos")}${d.followupsToday ? ` · ${plural(d.followupsToday, "retorno", "retornos")} hoje` : ""}`;
  const url = d.followupsToday ? `${appUrl}/painel/contatos?retorno=pendente` : `${appUrl}/painel`;
  return {
    to, subject,
    html: layout("Seu resumo do dia", lines, { label: d.followupsToday ? "Ver retornos de hoje" : "Abrir o painel", url }),
    text: `${lines.map((l) => l.replace(/<[^>]+>/g, "")).join("\n")}\n\nAbrir: ${url}`,
  };
}

/** Dia 2 do teste sem instalação: um empurrão com o caminho mais curto. */
export function installNudgeEmail(to: string[], appUrl: string): Email {
  const url = `${appUrl}/painel/captacao`;
  return {
    to,
    subject: "Falta só um passo para receber contatos",
    html: layout("Seu botão ainda não está no site", [
      "Você criou sua conta no Pinas Kit, mas ainda não detectamos o botão ou formulário no seu site.",
      "Leva 2 minutos: copie a linha de código e cole antes de <code>&lt;/body&gt;</code>. Não mexe com código? Use <b>Pedir para uma IA</b> ou o link direto na bio do Instagram.",
      "Seu teste grátis continua correndo — instale agora para aproveitar os dias que restam.",
    ], { label: "Instalar agora", url }),
    text: `Ainda não detectamos o Pinas Kit no seu site. Leva 2 minutos: ${url}`,
  };
}

/** Envia pelo Resend. Sem chave configurada, só registra no log (não quebra o fluxo). */
export async function sendEmail(e: Email): Promise<boolean> {
  const key = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("EMAIL_FROM") || "Pinas Kit <onboarding@resend.dev>";
  if (!key || !e.to.length) { console.warn("email não enviado: sem RESEND_API_KEY ou destinatário"); return false; }
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ from, to: e.to, subject: e.subject, html: e.html, text: e.text }),
  });
  if (!r.ok) console.error("resend", r.status, (await r.text()).slice(0, 200));
  return r.ok;
}
