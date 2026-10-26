import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSession, isAdmin } from "@/lib/session";
import { findDuplicates, type DupLead } from "@/lib/crm";
import { Empty, PageHeader } from "@/components/ui";
import { MergeGroup } from "@/components/contatos/merge-group";

/** Contatos repetidos: mesmo e-mail, telefone parecido ou mesmo nome completo. */
export default async function Duplicados() {
  const { supabase, workspace, role } = await getSession();
  const { data } = await supabase.from("leads").select("id, name, email, phone_e164, created_at").eq("workspace_id", workspace.id).order("created_at").limit(5000);
  const groups = findDuplicates((data ?? []) as DupLead[]).slice(0, 50);
  return (
    <>
      <Link href="/painel/contatos" className="mb-3 inline-flex items-center gap-1 text-sm text-mute"><ArrowLeft size={15} />Contatos</Link>
      <PageHeader title="Contatos repetidos" desc="Possíveis duplicados encontrados. Confira antes de juntar: o Pinas Kit mostra, você decide." />
      {!groups.length ? <Empty title="Nenhum repetido encontrado" desc="Comparamos e-mail, final do telefone e nome completo de todos os seus contatos." />
        : <div className="grid gap-4 xl:grid-cols-2">{groups.map((g) => <MergeGroup key={g.leads.map((l) => l.id).join()} reason={g.reason} leads={g.leads} admin={isAdmin(role)} />)}</div>}
    </>
  );
}
