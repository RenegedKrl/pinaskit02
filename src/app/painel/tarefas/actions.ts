"use server";
import { revalidatePath } from "next/cache";
import { canEdit, getSession } from "@/lib/session";
import { cleanSteps, sequenceTasks, TASK_KIND } from "@/lib/crm";

type Res = { ok: boolean; error?: string };
const done = (): Res => { revalidatePath("/painel", "layout"); return { ok: true }; };
async function editor() {
  const s = await getSession();
  if (!canEdit(s.role)) throw new Error("Você tem acesso só de visualização.");
  return s;
}
const wrap = async (fn: () => Promise<Res>): Promise<Res> => { try { return await fn(); } catch (e) { return { ok: false, error: (e as Error).message }; } };

export interface TaskInput { leadId: string | null; title: string; kind: string; dueAt: string; assigneeId: string | null; message?: string }

/** Nova tarefa (ligar, mandar proposta, cobrar…), com data/hora e responsável. */
export async function createTask(t: TaskInput): Promise<Res> {
  return wrap(async () => {
    const { supabase, workspace, user } = await editor();
    const due = new Date(t.dueAt);
    if (!t.title.trim()) return { ok: false, error: "Escreva o que precisa ser feito." };
    if (Number.isNaN(due.getTime())) return { ok: false, error: "Data inválida." };
    const { error } = await supabase.from("tasks").insert({
      workspace_id: workspace.id, lead_id: t.leadId, title: t.title.trim().slice(0, 140), kind: TASK_KIND[t.kind] ? t.kind : "other",
      due_at: due.toISOString(), assignee_id: t.assigneeId || user.id, message: t.message?.trim().slice(0, 1000) || null, created_by: user.id,
    });
    return error ? { ok: false, error: "Não foi possível criar a tarefa." } : done();
  });
}

/** Concluir ou reabrir. */
export async function toggleTask(id: string, isDone: boolean): Promise<Res> {
  return wrap(async () => {
    const { supabase, workspace } = await editor();
    const { error } = await supabase.from("tasks").update({ done_at: isDone ? new Date().toISOString() : null }).eq("id", id).eq("workspace_id", workspace.id);
    return error ? { ok: false, error: "Não foi possível salvar." } : done();
  });
}

/** Adiar: +1 dia, +3 dias ou para uma data. */
export async function snoozeTask(id: string, dueAt: string): Promise<Res> {
  return wrap(async () => {
    const { supabase, workspace } = await editor();
    const due = new Date(dueAt);
    if (Number.isNaN(due.getTime())) return { ok: false, error: "Data inválida." };
    const { error } = await supabase.from("tasks").update({ due_at: due.toISOString() }).eq("id", id).eq("workspace_id", workspace.id);
    return error ? { ok: false, error: "Não foi possível adiar." } : done();
  });
}

export async function deleteTask(id: string): Promise<Res> {
  return wrap(async () => {
    const { supabase, workspace } = await editor();
    await supabase.from("tasks").delete().eq("id", id).eq("workspace_id", workspace.id);
    return done();
  });
}

/**
 * Clique em "Abrir WhatsApp" no painel: marca o primeiro atendimento (tempo de resposta) e registra no histórico.
 * Se veio de uma tarefa de mensagem, conclui a tarefa.
 */
export async function markContacted(leadId: string, taskId?: string): Promise<Res> {
  return wrap(async () => {
    const { supabase, workspace, user } = await getSession();
    const now = new Date().toISOString();
    await supabase.from("leads").update({ first_response_at: now, first_response_by: user.id }).eq("id", leadId).eq("workspace_id", workspace.id).is("first_response_at", null);
    await supabase.from("lead_activities").insert({ workspace_id: workspace.id, lead_id: leadId, user_id: user.id, type: "whatsapp_open", body: {} });
    if (taskId) await supabase.from("tasks").update({ done_at: now }).eq("id", taskId).eq("workspace_id", workspace.id).is("done_at", null);
    return done();
  });
}

/** Coloca o contato numa sequência: cria uma tarefa com mensagem pronta para cada passo. */
export async function startSequence(leadId: string, sequenceId: string): Promise<Res> {
  return wrap(async () => {
    const { supabase, workspace, user } = await editor();
    const [{ data: seq }, { data: lead }] = await Promise.all([
      supabase.from("sequences").select("id, name, steps, active").eq("id", sequenceId).eq("workspace_id", workspace.id).maybeSingle(),
      supabase.from("leads").select("id, name, owner_id").eq("id", leadId).eq("workspace_id", workspace.id).maybeSingle(),
    ]);
    if (!seq || !seq.active) return { ok: false, error: "Sequência não encontrada ou desligada." };
    if (!lead) return { ok: false, error: "Contato não encontrado." };
    const { count } = await supabase.from("tasks").select("id", { count: "exact", head: true }).eq("lead_id", leadId).eq("sequence_id", sequenceId).is("done_at", null);
    if (count) return { ok: false, error: "Este contato já está nessa sequência." };
    const rows = sequenceTasks(cleanSteps(seq.steps), lead.name).map((t) => ({
      workspace_id: workspace.id, lead_id: leadId, assignee_id: lead.owner_id ?? user.id, kind: "whatsapp", source: "sequence",
      sequence_id: seq.id, created_by: user.id, ...t,
    }));
    const { error } = await supabase.from("tasks").insert(rows);
    if (error) return { ok: false, error: "Não foi possível iniciar a sequência." };
    await supabase.from("lead_activities").insert({ workspace_id: workspace.id, lead_id: leadId, user_id: user.id, type: "sequence_start", body: { name: seq.name, steps: rows.length } });
    return done();
  });
}

/** Para a sequência: apaga as mensagens que ainda não foram enviadas. */
export async function stopSequence(leadId: string, sequenceId: string): Promise<Res> {
  return wrap(async () => {
    const { supabase, workspace } = await editor();
    await supabase.from("tasks").delete().eq("workspace_id", workspace.id).eq("lead_id", leadId).eq("sequence_id", sequenceId).is("done_at", null);
    return done();
  });
}
