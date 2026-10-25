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
