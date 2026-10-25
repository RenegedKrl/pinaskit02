"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canEdit, getSession, isAdmin } from "@/lib/session";


/** Muda a etapa do contato. A etapa precisa existir na conta (o banco recusa as outras). */
export async function setStatus(fd: FormData): Promise<{ ok: boolean }> {
  const { supabase, workspace, role, user } = await getSession();
  const id = String(fd.get("id")), status = String(fd.get("status"));
  if (!canEdit(role) || !/^[a-z0-9_]{2,40}$/.test(status)) return { ok: false };
  const { data: old } = await supabase.from("leads").select("status").eq("id", id).eq("workspace_id", workspace.id).single();
  if (!old) return { ok: false };
  if (old.status === status) return { ok: true };
  const { error } = await supabase.from("leads").update({ status, updated_at: new Date().toISOString() }).eq("id", id).eq("workspace_id", workspace.id);
  if (error) return { ok: false };
  await supabase.from("lead_activities").insert({ workspace_id: workspace.id, lead_id: id, user_id: user.id, type: "status_change", body: { from: old.status, to: status } });
  // invalida todo o painel (ficha, lista, funil): sem isso a tela continuava mostrando a etapa antiga
  revalidatePath("/painel", "layout");
  return { ok: true };
}

export async function updateLead(fd: FormData) {
  const { supabase, workspace, role } = await getSession();
  if (!canEdit(role)) return;
  const id = String(fd.get("id"));
  const value = String(fd.get("deal_value") || "").replace(/\./g, "").replace(",", ".");
  await supabase.from("leads").update({
    name: String(fd.get("name") || "").slice(0, 120) || null,
    email: String(fd.get("email") || "").slice(0, 200) || null,
    deal_value: value ? Number(value) || null : null,
    updated_at: new Date().toISOString(),
  }).eq("id", id).eq("workspace_id", workspace.id);
  revalidatePath(`/painel/contatos/${id}`);
}

export async function addNote(fd: FormData) {
  const { supabase, workspace, role, user } = await getSession();
  const id = String(fd.get("id")), text = String(fd.get("note") || "").trim().slice(0, 2000);
  if (!canEdit(role) || !text) return;
  await supabase.from("lead_activities").insert({ workspace_id: workspace.id, lead_id: id, user_id: user.id, type: "note", body: { text } });
  revalidatePath(`/painel/contatos/${id}`);
}

export async function deleteLead(fd: FormData) {
  const { supabase, workspace, role } = await getSession();
  if (!isAdmin(role)) return;
  await supabase.from("leads").delete().eq("id", String(fd.get("id"))).eq("workspace_id", workspace.id);
  redirect("/painel/contatos");
}
