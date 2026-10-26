"use server";
import { revalidatePath } from "next/cache";
import { getSession, isAdmin } from "@/lib/session";

/** Meta do mês por pessoa (dono/admin). month = "AAAA-MM-01". */
export async function saveGoal(userId: string, month: string, revenue: number, sales: number): Promise<{ ok: boolean; error?: string }> {
  const { supabase, workspace, role } = await getSession();
  if (!isAdmin(role)) return { ok: false, error: "Só o dono ou um administrador define metas." };
  if (!/^\d{4}-\d{2}-01$/.test(month)) return { ok: false, error: "Mês inválido." };
  const { error } = await supabase.from("goals").upsert({
    workspace_id: workspace.id, user_id: userId, month,
    target_revenue: Math.max(0, Math.round((Number(revenue) || 0) * 100) / 100), target_sales: Math.max(0, Math.round(Number(sales) || 0)),
  }, { onConflict: "workspace_id,user_id,month" });
  if (error) return { ok: false, error: "Não foi possível salvar a meta." };
  revalidatePath("/painel/equipe");
  return { ok: true };
}

/** Liga/desliga "ver só os meus contatos" para uma pessoa (dono/admin). */
export async function setSeeOnlyOwn(userId: string, on: boolean): Promise<{ ok: boolean; error?: string }> {
  const { supabase, workspace, role, user } = await getSession();
  if (!isAdmin(role)) return { ok: false, error: "Sem permissão." };
  if (userId === user.id) return { ok: false, error: "Você não pode restringir a si mesmo." };
  const { data: m } = await supabase.from("workspace_members").select("role").eq("workspace_id", workspace.id).eq("user_id", userId).single();
  if (m?.role === "owner") return { ok: false, error: "O dono sempre vê todos os contatos." };
  const { error } = await supabase.from("workspace_members").update({ see_only_own: on }).eq("workspace_id", workspace.id).eq("user_id", userId);
  if (error) return { ok: false, error: "Não foi possível salvar." };
  revalidatePath("/painel", "layout");
  return { ok: true };
}
