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

export async function createStage(name: string): Promise<Result> {
  try {
    const { supabase, workspace } = await admin();
    const err = stageNameError(name); if (err) return { ok: false, error: err };
    const { data: list } = await supabase.from("pipeline_stages").select("position, kind").eq("workspace_id", workspace.id);
    if ((list?.length ?? 0) >= MAX_STAGES) return { ok: false, error: `O funil pode ter no máximo ${MAX_STAGES} etapas.` };
    const pos = Math.max(0, ...(list ?? []).filter((s) => s.kind === "open").map((s) => s.position)) + 1;
    const { error } = await supabase.from("pipeline_stages").insert({ workspace_id: workspace.id, key: stageKey(name), name: name.trim(), position: pos, kind: "open" });
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
