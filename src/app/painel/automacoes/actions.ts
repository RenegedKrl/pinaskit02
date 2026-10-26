"use server";
import { revalidatePath } from "next/cache";
import { canEdit, getSession, isAdmin } from "@/lib/session";
import { cleanSteps, type SeqStep } from "@/lib/crm";
import { cleanRule, type RuleInput } from "@/lib/automations";

type Res = { ok: boolean; error?: string };
const done = (): Res => { revalidatePath("/painel", "layout"); return { ok: true }; };

/** Regra "quando → então" (dono/admin). */
export async function saveRule(r: RuleInput & { id?: string }): Promise<Res> {
  const { supabase, workspace, role } = await getSession();
  if (!isAdmin(role)) return { ok: false, error: "Só o dono ou um administrador cria automações." };
  const row = cleanRule(r);
  if ("error" in row) return { ok: false, error: row.error };
  if (row.trigger === "stage_enter") {
    const { data: st } = await supabase.from("pipeline_stages").select("key").eq("workspace_id", workspace.id).eq("key", row.stage_key!).maybeSingle();
    if (!st) return { ok: false, error: "Escolha uma etapa do funil." };
  }
  const { error } = r.id ? await supabase.from("automations").update(row).eq("id", r.id).eq("workspace_id", workspace.id)
    : await supabase.from("automations").insert({ ...row, workspace_id: workspace.id });
  return error ? { ok: false, error: "Não foi possível salvar a automação." } : done();
}

export async function toggleRule(id: string, active: boolean): Promise<Res> {
  const { supabase, workspace, role } = await getSession();
  if (!isAdmin(role)) return { ok: false, error: "Sem permissão." };
  await supabase.from("automations").update({ active }).eq("id", id).eq("workspace_id", workspace.id);
  return done();
}

export async function deleteRule(id: string): Promise<Res> {
  const { supabase, workspace, role } = await getSession();
  if (!isAdmin(role)) return { ok: false, error: "Sem permissão." };
  await supabase.from("automations").delete().eq("id", id).eq("workspace_id", workspace.id);
  return done();
}

/** Sequência de mensagens (dia 1, dia 3, dia 7…). */
export async function saveSequence(s: { id?: string; name: string; steps: SeqStep[]; active: boolean }): Promise<Res> {
  const { supabase, workspace, role } = await getSession();
  if (!canEdit(role)) return { ok: false, error: "Você tem acesso só de visualização." };
  const steps = cleanSteps(s.steps);
  if (!s.name.trim()) return { ok: false, error: "Dê um nome para a sequência." };
  if (!steps.length) return { ok: false, error: "Escreva a mensagem de pelo menos um passo." };
  const row = { name: s.name.trim().slice(0, 60), steps, active: !!s.active };
  const { error } = s.id ? await supabase.from("sequences").update(row).eq("id", s.id).eq("workspace_id", workspace.id)
    : await supabase.from("sequences").insert({ ...row, workspace_id: workspace.id });
  return error ? { ok: false, error: "Não foi possível salvar a sequência." } : done();
}

export async function deleteSequence(id: string): Promise<Res> {
  const { supabase, workspace, role } = await getSession();
  if (!canEdit(role)) return { ok: false, error: "Sem permissão." };
  await supabase.from("tasks").delete().eq("workspace_id", workspace.id).eq("sequence_id", id).is("done_at", null);
  await supabase.from("sequences").delete().eq("id", id).eq("workspace_id", workspace.id);
  return done();
}
