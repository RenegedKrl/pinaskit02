"use server";
import { revalidatePath } from "next/cache";
import { canEdit, getSession } from "@/lib/session";

type Res = { ok: boolean; error?: string };

/** Cria ou edita uma mensagem pronta de WhatsApp da conta. */
export async function saveTemplate(id: string | null, name: string, body: string): Promise<Res> {
  const { supabase, workspace, role } = await getSession();
  if (!canEdit(role)) return { ok: false, error: "Você tem acesso só de visualização." };
  const n = name.trim(), b = body.trim();
  if (!n || n.length > 40) return { ok: false, error: "Dê um nome de até 40 caracteres." };
  if (!b || b.length > 1000) return { ok: false, error: "Escreva a mensagem (até 1000 caracteres)." };
  const { error } = id
    ? await supabase.from("message_templates").update({ name: n, body: b }).eq("id", id).eq("workspace_id", workspace.id)
    : await supabase.from("message_templates").insert({ workspace_id: workspace.id, name: n, body: b });
  if (error) return { ok: false, error: "Não foi possível salvar." };
  revalidatePath("/painel", "layout");
  return { ok: true };
}

export async function deleteTemplate(id: string): Promise<Res> {
  const { supabase, workspace, role } = await getSession();
  if (!canEdit(role)) return { ok: false, error: "Você tem acesso só de visualização." };
  const { error } = await supabase.from("message_templates").delete().eq("id", id).eq("workspace_id", workspace.id);
  if (error) return { ok: false, error: "Não foi possível apagar." };
  revalidatePath("/painel", "layout");
  return { ok: true };
}
