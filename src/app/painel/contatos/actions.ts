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

type Res = { ok: boolean; error?: string };
async function editLead(id: string, patch: Record<string, unknown>, activity?: { type: string; body: unknown }): Promise<Res> {
  const { supabase, workspace, role, user } = await getSession();
  if (!canEdit(role)) return { ok: false, error: "Você tem acesso só de visualização." };
  const { error } = await supabase.from("leads").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id).eq("workspace_id", workspace.id);
  if (error) return { ok: false, error: "Não foi possível salvar." };
  if (activity) await supabase.from("lead_activities").insert({ workspace_id: workspace.id, lead_id: id, user_id: user.id, ...activity });
  revalidatePath("/painel", "layout");
  return { ok: true };
}

/** Responsável pelo contato (alguém da equipe) ou ninguém. */
export async function setOwner(id: string, ownerId: string): Promise<Res> {
  return editLead(id, { owner_id: ownerId || null }, { type: "owner_change", body: { to: ownerId || null } });
}

/** Etiquetas do contato (já limpas e sem repetição no navegador; o banco limita a 10). */
export async function setTags(id: string, tags: string[]): Promise<Res> {
  const clean = [...new Set(tags.map((t) => t.trim().toLowerCase().slice(0, 24)).filter(Boolean))].slice(0, 10);
  return editLead(id, { tags: clean });
}

/** Lembrete de retorno: data/hora e anotação curta. at vazio = remover lembrete. */
export async function setFollowup(id: string, at: string, note: string): Promise<Res> {
  const when = at ? new Date(at) : null;
  if (when && Number.isNaN(when.getTime())) return { ok: false, error: "Data inválida." };
  return editLead(id, { next_followup_at: when?.toISOString() ?? null, followup_note: when ? note.trim().slice(0, 200) || null : null },
    when ? { type: "followup", body: { at: when.toISOString(), note: note.trim().slice(0, 200) } } : undefined);
}
