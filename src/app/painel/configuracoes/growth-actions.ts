"use server";
import { revalidatePath } from "next/cache";
import { getSession, isAdmin } from "@/lib/session";
import { leadPayload, safeWebhookUrl, sign } from "@shared/webhook";

type Res = { ok: boolean; error?: string };
const done = (): Res => { revalidatePath("/painel/configuracoes"); return { ok: true }; };

/** Cada pessoa liga ou desliga os próprios avisos por e-mail. */
export async function setMyAlerts(newLead: boolean, daily: boolean): Promise<Res> {
  const { supabase, workspace } = await getSession();
  const { error } = await supabase.rpc("set_my_alerts", { p_ws: workspace.id, p_new_lead: newLead, p_daily: daily });
  return error ? { ok: false, error: "Não foi possível salvar." } : done();
}

/** Rodízio: WhatsApp do atendente e se ele está na fila (dono/admin). */
export async function setRotation(userId: string, phone: string, on: boolean): Promise<Res> {
  const { supabase, workspace, role } = await getSession();
  if (!isAdmin(role)) return { ok: false, error: "Só o dono ou um administrador pode mudar o rodízio." };
  const digits = phone.replace(/\D/g, "");
  if (digits && (digits.length < 10 || digits.length > 15)) return { ok: false, error: "WhatsApp inválido. Use DDI + DDD + número, ex.: 55 11 99999-8888." };
  if (on && !digits) return { ok: false, error: "Informe o WhatsApp antes de colocar na fila." };
  const { error } = await supabase.from("workspace_members").update({ whatsapp_e164: digits || null, in_rotation: on && !!digits })
    .eq("workspace_id", workspace.id).eq("user_id", userId);
  return error ? { ok: false, error: "Não foi possível salvar." } : done();
}

/** Endereço do webhook (vazio = desligar). */
export async function saveWebhook(url: string): Promise<Res> {
  const { supabase, workspace, role } = await getSession();
  if (!isAdmin(role)) return { ok: false, error: "Só o dono ou um administrador pode mudar integrações." };
  const clean = url.trim();
  if (clean && !safeWebhookUrl(clean)) return { ok: false, error: "Use um endereço https público (ex.: https://hooks.zapier.com/...)." };
  const { error } = await supabase.from("workspaces").update({ webhook_url: clean || null }).eq("id", workspace.id);
  return error ? { ok: false, error: "Não foi possível salvar." } : done();
}

export async function rotateSecret(): Promise<Res> {
  const { supabase, workspace, role } = await getSession();
  if (!isAdmin(role)) return { ok: false, error: "Sem permissão." };
  const { error } = await supabase.rpc("rotate_webhook_secret", { p_ws: workspace.id });
  return error ? { ok: false, error: "Não foi possível gerar." } : done();
}

/** Manda um contato de exemplo para o webhook e devolve o status recebido. */
export async function testWebhook(): Promise<Res & { status?: number }> {
  const { supabase, workspace, role } = await getSession();
  if (!isAdmin(role)) return { ok: false, error: "Sem permissão." };
  const { data: ws } = await supabase.from("workspaces").select("webhook_url, webhook_secret").eq("id", workspace.id).single();
  if (!ws?.webhook_url || !safeWebhookUrl(ws.webhook_url)) return { ok: false, error: "Salve um endereço https primeiro." };
  const payload = { ...leadPayload({ id: "00000000-0000-4000-8000-000000000000", name: "Contato de teste", phone: "5511999998888", email: "teste@exemplo.com",
    source: "Google Ads", last: { utm_source: "google", utm_medium: "cpc", utm_campaign: "teste-pinas" }, first: null, option: null,
    message: "Envio de teste do Pinas Kit", temperature: "morno", score: 25, widget: null, attendant: null }), test: true };
  const body = JSON.stringify(payload);
  try {
    const r = await fetch(ws.webhook_url, { method: "POST", redirect: "manual", signal: AbortSignal.timeout(5000), body,
      headers: { "content-type": "application/json", "user-agent": "PinasKit-Webhook/1", "x-pinas-event": "lead.created", "x-pinas-signature": `sha256=${await sign(body, ws.webhook_secret)}` } });
    return r.status >= 200 && r.status < 400 ? { ok: true, status: r.status } : { ok: false, status: r.status, error: `O endereço respondeu com erro ${r.status}.` };
  } catch { return { ok: false, error: "Não foi possível conectar ao endereço (fora do ar ou demorou mais de 5 s)." }; }
}
