"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canEdit, getSession, isAdmin } from "@/lib/session";
import { STATUS, statusLabel } from "@/lib/copy";

const VALID = new Set<string>(STATUS.map((s) => s.id));

export async function setStatus(fd: FormData) {
  const { supabase, workspace, role, user } = await getSession();
  const id = String(fd.get("id")), status = String(fd.get("status"));
  if (!canEdit(role) || !VALID.has(status)) return;
  const { data: old } = await supabase.from("leads").select("status").eq("id", id).eq("workspace_id", workspace.id).single();
  if (!old || old.status === status) return;
  await supabase.from("leads").update({ status, updated_at: new Date().toISOString() }).eq("id", id).eq("workspace_id", workspace.id);
  await supabase.from("lead_activities").insert({ workspace_id: workspace.id, lead_id: id, user_id: user.id, type: "status_change", body: { from: old.status, to: status } });
  // invalida todo o painel (ficha, lista, funil): sem isso a tela continuava mostrando a etapa antiga
  revalidatePath("/painel", "layout");
  const back = String(fd.get("back") || "");
  if (back.startsWith("/painel")) redirect(`${back}${back.includes("?") ? "&" : "?"}ok=${encodeURIComponent(`Movido para ${statusLabel(status)}`)}`);
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
