"use server";
import { revalidatePath } from "next/cache";
import { getSession, isAdmin } from "@/lib/session";
import { MAX_STAGES, stageKey, stageNameError } from "@/lib/stages";

type Result = { ok: true } | { ok: false; error: string };
const done = (): Result => { revalidatePath("/painel", "layout"); return { ok: true }; };

async function admin() {
  const s = await getSession();
  if (!isAdmin(s.role)) throw new Error("Só o dono ou um administrador pode mudar as etapas.");
  return s;
}

export async function createStage(name: string, pipelineId?: string | null): Promise<Result> {
  try {
    const { supabase, workspace } = await admin();
    const err = stageNameError(name); if (err) return { ok: false, error: err };
    let lq = supabase.from("pipeline_stages").select("position, kind").eq("workspace_id", workspace.id);
    if (pipelineId) lq = lq.eq("pipeline_id", pipelineId);
    const { data: list } = await lq;
    if ((list?.length ?? 0) >= MAX_STAGES) return { ok: false, error: `O funil pode ter no máximo ${MAX_STAGES} etapas.` };
    const pos = Math.max(0, ...(list ?? []).filter((s) => s.kind === "open").map((s) => s.position)) + 1;
    const { error } = await supabase.from("pipeline_stages").insert({ workspace_id: workspace.id, key: stageKey(name), name: name.trim(), position: pos, kind: "open", ...(pipelineId ? { pipeline_id: pipelineId } : {}) });
    return error ? { ok: false, error: "Não foi possível criar a etapa." } : done();
  } catch (e) { return { ok: false, error: (e as Error).message }; }
}

export async function renameStage(id: string, name: string, hint: string): Promise<Result> {
  try {
    const { supabase, workspace } = await admin();
    const err = stageNameError(name); if (err) return { ok: false, error: err };
    const { error } = await supabase.from("pipeline_stages").update({ name: name.trim(), hint: hint.trim().slice(0, 80) || null })
      .eq("id", id).eq("workspace_id", workspace.id);
    return error ? { ok: false, error: "Não foi possível renomear." } : done();
  } catch (e) { return { ok: false, error: (e as Error).message }; }
}

/** Salva a nova ordem das etapas livres (as fixas não se movem). */
export async function reorderStages(ids: string[]): Promise<Result> {
  try {
    const { supabase, workspace } = await admin();
    for (const [i, id] of ids.entries()) {
      await supabase.from("pipeline_stages").update({ position: i + 1 }).eq("id", id).eq("workspace_id", workspace.id).eq("kind", "open");
    }
    return done();
  } catch (e) { return { ok: false, error: (e as Error).message }; }
}

/** Apaga uma etapa livre, movendo os contatos dela para outra etapa. */
export async function deleteStage(id: string, moveTo: string): Promise<Result> {
  try {
    const { supabase } = await admin();
    const { error } = await supabase.rpc("delete_stage", { p_stage: id, p_move_to: moveTo });
    return error ? { ok: false, error: error.message.includes("fixa") ? "Esta etapa é fixa: pode ser renomeada, mas não apagada." : "Não foi possível apagar a etapa." } : done();
  } catch (e) { return { ok: false, error: (e as Error).message }; }
}

/** Novo funil (pós-venda, suporte, outro produto), já com 3 etapas para começar. Até 5 funis. */
export async function createPipeline(name: string): Promise<Result & { id?: string }> {
  try {
    const { supabase, workspace } = await admin();
    const n = name.trim().slice(0, 40);
    if (!n) return { ok: false, error: "Dê um nome para o funil." };
    const { data, error } = await supabase.from("pipelines").insert({ workspace_id: workspace.id, name: n, position: 1 }).select("id").single();
    if (error || !data) return { ok: false, error: error?.message.includes("limite") ? "O limite é de 5 funis." : "Não foi possível criar o funil." };
    await supabase.from("pipeline_stages").insert(["Entrada", "Em andamento", "Concluído"].map((s, i) => ({
      workspace_id: workspace.id, pipeline_id: data.id, key: stageKey(s), name: s, position: i + 1, kind: "open",
    })));
    revalidatePath("/painel", "layout");
    return { ok: true, id: data.id };
  } catch (e) { return { ok: false, error: (e as Error).message }; }
}

export async function renamePipeline(id: string, name: string): Promise<Result> {
  try {
    const { supabase, workspace } = await admin();
    if (!name.trim()) return { ok: false, error: "Dê um nome para o funil." };
    const { error } = await supabase.from("pipelines").update({ name: name.trim().slice(0, 40) }).eq("id", id).eq("workspace_id", workspace.id);
    return error ? { ok: false, error: "Não foi possível renomear." } : done();
  } catch (e) { return { ok: false, error: (e as Error).message }; }
}

/** Apaga um funil extra. Precisa estar vazio (o banco recusa se houver contatos nas etapas dele). */
export async function deletePipeline(id: string): Promise<Result> {
  try {
    const { supabase, workspace } = await admin();
    const { error } = await supabase.from("pipelines").delete().eq("id", id).eq("workspace_id", workspace.id);
    if (error) return { ok: false, error: error.message.includes("principal") ? "O funil principal não pode ser apagado." : "Mova os contatos deste funil para outro antes de apagar." };
    return done();
  } catch (e) { return { ok: false, error: (e as Error).message }; }
}
