import { canEdit, getSession, isAdmin } from "@/lib/session";
import { getStages } from "@/lib/stages";
import { PageHeader } from "@/components/ui";
import { Board, type BoardLead } from "@/components/funil/board";
import { StageEditor } from "@/components/funil/stage-editor";
import { PipelineTabs, type Pipeline } from "@/components/funil/pipelines";

export default async function Funil({ searchParams }: { searchParams: Promise<{ funil?: string }> }) {
  const sp = await searchParams;
  const { supabase, workspace, role } = await getSession();
  const [all, { data: pls }, { data: points }] = await Promise.all([
    getStages(supabase, workspace.id),
    supabase.from("pipelines").select("id, name, is_main").eq("workspace_id", workspace.id).order("is_main", { ascending: false }).order("position").order("created_at"),
    supabase.from("widgets").select("id, name").eq("workspace_id", workspace.id).order("name"),
  ]);
  const pipelines = (pls ?? []) as Pipeline[];
  const main = pipelines.find((p) => p.is_main);
  const current = pipelines.find((p) => p.id === sp.funil) ?? main;
  // Funil principal também mostra etapas antigas sem funil definido.
  const stages = all.filter((s) => (current?.is_main ? !s.pipeline_id || s.pipeline_id === current.id : s.pipeline_id === current?.id));
  const keys = stages.map((s) => s.key);
  const { data } = keys.length
    ? await supabase.from("leads").select("id, name, source_label, status, temperature, score, deal_value, updated_at, widget_id")
      .eq("workspace_id", workspace.id).in("status", keys).order("updated_at", { ascending: false }).limit(1000)
    : { data: [] };

  return (
    <>
      <PageHeader title="Funil" desc={current && !current.is_main ? `Funil ${current.name}: arraste os contatos entre as etapas.` : "Arraste os contatos entre as etapas para organizar o atendimento."}
        action={isAdmin(role) ? <StageEditor stages={stages} pipelineId={current?.is_main ? null : current?.id ?? null} /> : undefined} />
      {pipelines.length > 0 && (pipelines.length > 1 || isAdmin(role)) && <PipelineTabs pipelines={pipelines} current={current?.id ?? ""} admin={isAdmin(role)} />}
      <Board stages={stages} leads={(data ?? []) as BoardLead[]} points={points ?? []} edit={canEdit(role)} />
    </>
  );
}
