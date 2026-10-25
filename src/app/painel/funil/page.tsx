import { canEdit, getSession, isAdmin } from "@/lib/session";
import { getStages } from "@/lib/stages";
import { PageHeader } from "@/components/ui";
import { Board, type BoardLead } from "@/components/funil/board";
import { StageEditor } from "@/components/funil/stage-editor";

export default async function Funil() {
  const { supabase, workspace, role } = await getSession();
  const [stages, { data }, { data: points }] = await Promise.all([
    getStages(supabase, workspace.id),
    supabase.from("leads").select("id, name, source_label, status, temperature, score, deal_value, updated_at, widget_id")
      .eq("workspace_id", workspace.id).order("updated_at", { ascending: false }).limit(1000),
    supabase.from("widgets").select("id, name").eq("workspace_id", workspace.id).order("name"),
  ]);

  return (
    <>
      <PageHeader title="Funil" desc="Arraste os contatos entre as etapas para organizar o atendimento."
        action={isAdmin(role) ? <StageEditor stages={stages} /> : undefined} />
      <Board stages={stages} leads={(data ?? []) as BoardLead[]} points={points ?? []} edit={canEdit(role)} />
    </>
  );
}
