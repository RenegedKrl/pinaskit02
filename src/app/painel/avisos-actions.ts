"use server";
import { getSession } from "@/lib/session";

export interface Notifications {
  seenAt: string;
  leads: { id: string; name: string | null; source_label: string | null; created_at: string }[];
  newCount: number;
  followups: number;
}

/** Sininho: contatos que chegaram desde a última vez que a pessoa abriu os avisos + retornos vencidos/de hoje. */
export async function getNotifications(): Promise<Notifications> {
  const { supabase, workspace, user } = await getSession();
  const { data: m } = await supabase.from("workspace_members").select("notifications_seen_at").eq("workspace_id", workspace.id).eq("user_id", user.id).single();
  const seenAt = m?.notifications_seen_at ?? new Date().toISOString();
  const tomorrow = new Date(Date.now() - 3 * 3600e3); tomorrow.setUTCHours(23, 59, 59, 999); tomorrow.setTime(tomorrow.getTime() + 3 * 3600e3);
  const [{ data: leads, count }, { count: due }] = await Promise.all([
    supabase.from("leads").select("id, name, source_label, created_at", { count: "exact" }).eq("workspace_id", workspace.id)
      .gt("created_at", seenAt).order("created_at", { ascending: false }).limit(8),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("workspace_id", workspace.id)
      .not("next_followup_at", "is", null).lte("next_followup_at", tomorrow.toISOString()),
  ]);
  return { seenAt, leads: leads ?? [], newCount: count ?? 0, followups: due ?? 0 };
}

export async function markNotificationsSeen(): Promise<void> {
  const { supabase } = await getSession();
  await supabase.rpc("mark_notifications_seen");
}
