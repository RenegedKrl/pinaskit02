import { redirect } from "next/navigation";
import { canEdit, getSession } from "@/lib/session";
import { DEFAULT_CONFIG } from "@shared/widget-config";
import { PageHeader } from "@/components/ui";
import { Editor } from "@/components/captacao/editor";

export default async function Novo() {
  const { role, workspace } = await getSession();
  if (!canEdit(role)) redirect("/painel/captacao");
  return (
    <>
      <PageHeader title="Novo botão ou formulário" desc="Escolha como as pessoas vão chegar até você. Dá para mudar depois sem mexer no site." />
      <Editor id={null} name={workspace.name} mode="both" whatsapp="55" isActive config={DEFAULT_CONFIG} />
    </>
  );
}
