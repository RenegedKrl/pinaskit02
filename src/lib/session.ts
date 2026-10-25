import { redirect } from "next/navigation";
import { cache } from "react";
import { supabaseServer } from "./supabase/server";

export type Role = "owner" | "admin" | "member" | "viewer";
export interface Workspace {
  id: string; name: string; plan_status: string; trial_ends_at: string; current_period_end: string | null;
  privacy_policy_url: string | null; whatsapp_support: string | null; asaas_subscription_id: string | null;
}

/** Usuário, workspace e papel atuais. Redireciona para /entrar se não houver sessão. */
export const getSession = cache(async () => {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");
  const { data: m } = await supabase.from("workspace_members")
    .select("role, workspaces(id, name, plan_status, trial_ends_at, current_period_end, privacy_policy_url, whatsapp_support, asaas_subscription_id)")
    .eq("user_id", user.id).limit(1).single();
  if (!m) redirect("/entrar?erro=sem-workspace");
  return { supabase, user, role: m.role as Role, workspace: m.workspaces as unknown as Workspace };
});

export function canEdit(role: Role) { return role !== "viewer"; }
export function isAdmin(role: Role) { return role === "owner" || role === "admin"; }

export function trialDaysLeft(w: Workspace): number {
  return Math.max(0, Math.ceil((new Date(w.trial_ends_at).getTime() - Date.now()) / 864e5));
}
