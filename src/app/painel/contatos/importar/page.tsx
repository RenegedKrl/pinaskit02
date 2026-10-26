import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { canEdit, getSession } from "@/lib/session";
import { PageHeader } from "@/components/ui";
import { Importer } from "@/components/contatos/importer";

export default async function Importar() {
  const { role } = await getSession();
  return (
    <>
      <Link href="/painel/contatos" className="mb-3 inline-flex items-center gap-1 text-sm text-mute"><ArrowLeft size={15} />Voltar</Link>
      <PageHeader title="Importar contatos" desc="Traga a lista que você já tem (Excel, Google Planilhas ou outro CRM) em formato CSV." />
      {canEdit(role) ? <Importer /> : <p className="text-mute">Você tem acesso só de visualização.</p>}
    </>
  );
}
