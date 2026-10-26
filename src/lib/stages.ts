// Etapas do funil de cada conta (tabela pipeline_stages). As fixas ('new', 'won', 'lost') só podem ser renomeadas.
import { STATUS } from "./copy";

export type StageKind = "new" | "open" | "won" | "lost";
export interface Stage { id: string; key: string; name: string; hint: string | null; position: number; kind: StageKind; pipeline_id?: string | null }

export const MAX_STAGES = 10;

/** Ordem do funil: "Novo" primeiro, etapas livres no meio, venda e perda por último. */
const KIND_ORDER: Record<StageKind, number> = { new: 0, open: 1, won: 2, lost: 3 };
export function sortStages<T extends Pick<Stage, "kind" | "position">>(list: T[]): T[] {
  return [...list].sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || a.position - b.position);
}

/** Etapas padrão, usadas se a conta ainda não tiver as suas (antes da migração 0005). */
export const DEFAULT_STAGES: Stage[] = STATUS.map((s, i) => ({
  id: s.id, key: s.id, name: s.label, hint: s.hint, position: i,
  kind: s.id === "novo" ? "new" : s.id === "ganho" ? "won" : s.id === "perdido" ? "lost" : "open",
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getStages(supabase: any, workspaceId: string): Promise<Stage[]> {
  const { data } = await supabase.from("pipeline_stages").select("id, key, name, hint, position, kind, pipeline_id").eq("workspace_id", workspaceId);
  return data?.length ? sortStages(data as Stage[]) : DEFAULT_STAGES;
}

export const stageName = (stages: Pick<Stage, "key" | "name">[], key: string | null | undefined) =>
  stages.find((s) => s.key === key)?.name ?? key ?? "";

/** Gera a identificação interna de uma etapa nova a partir do nome ("Visita marcada" → "visita_marcada_4f2a"). */
export function stageKey(name: string, rand = Math.random().toString(36).slice(2, 6)): string {
  const base = name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 30);
  return `${base || "etapa"}_${rand}`;
}

/** Valida o nome digitado; devolve a mensagem de erro ou null. */
export function stageNameError(name: string): string | null {
  const n = name.trim();
  if (!n) return "Dê um nome para a etapa.";
  if (n.length > 40) return "Use no máximo 40 caracteres.";
  return null;
}
