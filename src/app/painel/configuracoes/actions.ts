"use server";
import { revalidatePath } from "next/cache";
import { getSession, isAdmin } from "@/lib/session";

const done = () => revalidatePath("/painel/configuracoes");

export async function saveBusiness(fd: FormData) {
  const { supabase, workspace, role } = await getSession();
  if (!isAdmin(role)) return;
  const url = String(fd.get("privacy") || "").trim();
  await supabase.from("workspaces").update({
    name: String(fd.get("name") || "").trim().slice(0, 80) || workspace.name,
    privacy_policy_url: /^https?:\/\//.test(url) ? url : null,
  }).eq("id", workspace.id);
  done();
}

export async function addDomain(fd: FormData) {
  const { supabase, workspace, role } = await getSession();
  if (!isAdmin(role)) return;
  const d = String(fd.get("domain") || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(d)) return;
  await supabase.from("sites").insert({ workspace_id: workspace.id, domain: d });
  done();
}

export async function removeDomain(fd: FormData) {
  const { supabase, workspace, role } = await getSession();
  if (!isAdmin(role)) return;
  await supabase.from("sites").delete().eq("id", String(fd.get("id"))).eq("workspace_id", workspace.id);
  done();
}

export async function invite(fd: FormData) {
  const { supabase, workspace, role } = await getSession();
  if (!isAdmin(role)) return;
  const email = String(fd.get("email") || "").trim().toLowerCase();
  const r = String(fd.get("role"));
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !["admin", "member", "viewer"].includes(r)) return;
  await supabase.from("invites").upsert({ workspace_id: workspace.id, email, role: r }, { onConflict: "workspace_id,email" });
  done();
}

export async function removeInvite(fd: FormData) {
  const { supabase, workspace, role } = await getSession();
  if (!isAdmin(role)) return;
  await supabase.from("invites").delete().eq("id", String(fd.get("id"))).eq("workspace_id", workspace.id);
  done();
}

export async function removeMember(fd: FormData) {
  const { supabase, workspace, role, user } = await getSession();
  const uid = String(fd.get("user_id"));
  if (!isAdmin(role) || uid === user.id) return;
  await supabase.from("workspace_members").delete().eq("workspace_id", workspace.id).eq("user_id", uid).neq("role", "owner");
  done();
}

export async function deleteData(fd: FormData) {
  const { supabase, workspace, role, user } = await getSession();
  if (role !== "owner" || fd.get("confirm") !== "APAGAR") return;
  const kinds = fd.getAll("kind").map(String);
  if (kinds.includes("leads")) await supabase.from("leads").delete().eq("workspace_id", workspace.id);
  if (kinds.includes("events")) await supabase.from("events").delete().eq("workspace_id", workspace.id);
  await supabase.from("audit_log").insert({ workspace_id: workspace.id, user_id: user.id, action: "delete_data", meta: { kinds } });
  done();
}
