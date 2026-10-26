"use server";
import { revalidatePath } from "next/cache";
import { canEdit, getSession, isAdmin } from "@/lib/session";
import { cleanCustom, type CustomField } from "@/lib/fields";

type Res = { ok: boolean; error?: string; token?: string };
const done = (extra: Partial<Res> = {}): Res => { revalidatePath("/painel", "layout"); return { ok: true, ...extra }; };

/** Campos personalizados e aniversário do contato. */
export async function saveLeadExtra(leadId: string, values: Record<string, unknown>, birthday: string): Promise<Res> {
  const { supabase, workspace, role } = await getSession();
  if (!canEdit(role)) return { ok: false, error: "Você tem acesso só de visualização." };
  const { data: fields } = await supabase.from("custom_fields").select("key, label, type, options").eq("workspace_id", workspace.id);
  const custom = cleanCustom((fields ?? []) as CustomField[], values);
  const bday = /^\d{4}-\d{2}-\d{2}$/.test(birthday) ? birthday : null;
  const { error } = await supabase.from("leads").update({ custom, birthday: bday, updated_at: new Date().toISOString() }).eq("id", leadId).eq("workspace_id", workspace.id);
  return error ? { ok: false, error: "Não foi possível salvar." } : done();
}

/** Link da pesquisa de satisfação (gera na primeira vez). */
export async function npsLink(leadId: string): Promise<Res> {
  const { supabase, workspace, role } = await getSession();
  if (!canEdit(role)) return { ok: false, error: "Sem permissão." };
  const { data: l } = await supabase.from("leads").select("nps_token").eq("id", leadId).eq("workspace_id", workspace.id).single();
  if (!l) return { ok: false, error: "Contato não encontrado." };
  if (l.nps_token) return { ok: true, token: l.nps_token };
  const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  const { error } = await supabase.from("leads").update({ nps_token: token }).eq("id", leadId).eq("workspace_id", workspace.id);
  return error ? { ok: false, error: "Não foi possível gerar o link." } : { ok: true, token };
}

/** Junta dois contatos repetidos: o primeiro fica, o segundo é apagado e o histórico passa para o primeiro. */
export async function mergeLeads(keepId: string, dropId: string): Promise<Res> {
  const { supabase, role } = await getSession();
  if (!isAdmin(role)) return { ok: false, error: "Só o dono ou um administrador pode juntar contatos." };
  const { error } = await supabase.rpc("merge_leads", { p_keep: keepId, p_drop: dropId });
  return error ? { ok: false, error: "Não foi possível juntar os contatos." } : done();
}
