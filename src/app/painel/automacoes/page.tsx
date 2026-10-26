import { canEdit, getSession, isAdmin } from "@/lib/session";
import { getStages } from "@/lib/stages";
import { PageHeader } from "@/components/ui";
import { RulesManager, type Rule } from "@/components/crm/rules";
import { SequencesManager, type Seq } from "@/components/crm/sequences";

/** Automações: regras "quando → então" (incluindo pós-venda) e sequências de mensagens. */
export default async function Automacoes() {
  const { supabase, workspace, role } = await getSession();
  const [{ data: rules }, { data: seqs }, stages, { data: running }] = await Promise.all([
    supabase.from("automations").select("*").eq("workspace_id", workspace.id).order("created_at"),
    supabase.from("sequences").select("id, name, steps, active").eq("workspace_id", workspace.id).order("name"),
    getStages(supabase, workspace.id),
    supabase.from("tasks").select("sequence_id, lead_id").eq("workspace_id", workspace.id).eq("source", "sequence").is("done_at", null).limit(5000),
  ]);
  const count = (id: string) => new Set((running ?? []).filter((t) => t.sequence_id === id).map((t) => t.lead_id)).size;
  return (
    <>
      <PageHeader title="Automações" desc="O Pinas Kit lembra por você: regras que criam tarefas sozinhas e sequências de mensagens prontas." />
      <div className="grid gap-4 xl:grid-cols-2">
        <RulesManager rules={(rules ?? []) as Rule[]} stages={stages} admin={isAdmin(role)} />
        <SequencesManager sequences={((seqs ?? []) as Omit<Seq, "running">[]).map((s) => ({ ...s, running: count(s.id) }))} edit={canEdit(role)} />
      </div>
    </>
  );
}
