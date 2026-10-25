// Utilidades das Edge Functions públicas.
import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js@2";

export const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type",
};

export function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "content-type": "application/json", ...extra } });
}

let client: SupabaseClient | null = null;
/** Cliente com service role: só existe no servidor. */
export function db(): SupabaseClient {
  if (!client) client = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
  return client;
}

export function ip(req: Request): string {
  return (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "0.0.0.0";
}

/** true = dentro do limite. Usa a função SQL hit_rate_limit. */
export async function allow(key: string, windowSec: number, max: number): Promise<boolean> {
  const { data, error } = await db().rpc("hit_rate_limit", { p_key: key, p_window: windowSec, p_max: max });
  if (error) { console.error("rate_limit", error.message); return true; }
  return data === true;
}

export interface WidgetRow {
  id: string; workspace_id: string; mode: string; whatsapp_e164: string; is_active: boolean; config: unknown;
  first_seen_at: string | null;
  workspaces: { plan_status: string; trial_ends_at: string; current_period_end: string | null };
}

export async function widgetByKey(key: string | null): Promise<WidgetRow | null> {
  if (!key || !/^[a-zA-Z0-9_-]{6,40}$/.test(key)) return null;
  const { data } = await db().from("widgets")
    .select("id, workspace_id, mode, whatsapp_e164, is_active, config, first_seen_at, workspaces(plan_status, trial_ends_at, current_period_end)")
    .eq("public_key", key).maybeSingle();
  return (data as WidgetRow | null) ?? null;
}

/** Captura liberada? Teste vencido ou plano inativo = só link direto. */
export function canCapture(w: WidgetRow): boolean {
  const ws = w.workspaces;
  if (ws.plan_status === "active" || ws.plan_status === "past_due") return true;
  if (ws.plan_status === "trial") return new Date(ws.trial_ends_at).getTime() > Date.now();
  // cancelada: continua captando até o fim do período já pago
  if (ws.plan_status === "canceled") return !!ws.current_period_end && new Date(ws.current_period_end).getTime() > Date.now();
  return false;
}

/** Origem autorizada? Sem domínios cadastrados = aceita (cliente ainda configurando). */
export async function originAllowed(req: Request, workspaceId: string): Promise<boolean> {
  const origin = req.headers.get("origin") || req.headers.get("referer") || "";
  let host = "";
  try { host = new URL(origin).hostname.toLowerCase(); } catch { return false; }
  const app = Deno.env.get("APP_ORIGIN_HOST");
  if (app && host === app) return true;
  const { data } = await db().from("sites").select("domain").eq("workspace_id", workspaceId);
  if (!data || !data.length) return true;
  return data.some(({ domain }: { domain: string }) => host === domain || host.endsWith("." + domain));
}

/** Mascara telefone e e-mail antes de qualquer log. */
export function mask(s: string): string {
  return s.replace(/\d{4,}/g, (d) => d.slice(0, 2) + "***").replace(/[^@\s]+@/g, "***@");
}

export const BOT_UA = /bot|crawl|spider|headless|preview|gptbot|claudebot|perplexity|facebookexternalhit|lighthouse/i;

/** E-mails de quem administra a conta (dono e admins): destinatários dos avisos. */
export async function adminEmails(workspaceId: string): Promise<string[]> {
  const { data } = await db().from("workspace_members").select("email").eq("workspace_id", workspaceId).in("role", ["owner", "admin"]);
  return (data ?? []).map((m: { email: string | null }) => m.email).filter((e): e is string => !!e);
}
