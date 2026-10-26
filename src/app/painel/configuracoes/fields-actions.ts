"use server";
import { revalidatePath } from "next/cache";
import { getSession, isAdmin } from "@/lib/session";
import { fieldKey, FIELD_TYPES, type FieldType } from "@/lib/fields";

type Res = { ok: boolean; error?: string };

/** Novo campo do contato (dono/admin). A chave nasce do nome e nunca muda. */
export async function addField(label: string, type: FieldType, options: string[]): Promise<Res> {
  const { supabase, workspace, role } = await getSession();
  if (!isAdmin(role)) return { ok: false, error: "Só o dono ou um administrador cria campos." };
  const name = label.trim().slice(0, 40);
  if (!name) return { ok: false, error: "Dê um nome ao campo." };
  if (!(type in FIELD_TYPES)) return { ok: false, error: "Tipo inválido." };
  const opts = [...new Set(options.map((o) => o.trim().slice(0, 40)).filter(Boolean))].slice(0, 20);
  if (type === "select" && opts.length < 2) return { ok: false, error: "Uma lista precisa de pelo menos 2 opções." };
  const { count } = await supabase.from("custom_fields").select("id", { count: "exact", head: true }).eq("workspace_id", workspace.id);
  const { error } = await supabase.from("custom_fields").insert({ workspace_id: workspace.id, key: fieldKey(name), label: name, type, options: type === "select" ? opts : [], position: count ?? 0 });
  if (error) return { ok: false, error: error.code === "23505" ? "Já existe um campo com esse nome." : error.message.includes("limite") ? "O limite é de 20 campos." : "Não foi possível criar o campo." };
  revalidatePath("/painel", "layout");
  return { ok: true };
}

/** Apaga o campo. Os valores já guardados nos contatos ficam, mas param de aparecer. */
export async function removeField(id: string): Promise<Res> {
  const { supabase, workspace, role } = await getSession();
  if (!isAdmin(role)) return { ok: false, error: "Sem permissão." };
  await supabase.from("custom_fields").delete().eq("id", id).eq("workspace_id", workspace.id);
  revalidatePath("/painel", "layout");
  return { ok: true };
}
