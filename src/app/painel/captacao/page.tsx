import Link from "next/link";
import { Plus, Link2 } from "lucide-react";
import { getSession } from "@/lib/session";
import { MODES } from "@/lib/copy";
import { formatPhone } from "@/lib/utils";
import { Badge, Card, Empty, PageHeader } from "@/components/ui";

export default async function Captacao() {
  const { supabase, workspace } = await getSession();
  const { data: widgets } = await supabase.from("widgets").select("id, name, mode, whatsapp_e164, is_active, first_seen_at, last_seen_at")
    .eq("workspace_id", workspace.id).order("created_at", { ascending: false });
  const add = <Link href="/painel/captacao/novo" className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 font-semibold text-white"><Plus size={18} />Novo</Link>;
  return (
    <>
      <PageHeader title="Botões e formulários" desc="Os lugares do seu site onde as pessoas falam com você." action={
        <div className="flex gap-2"><Link href="/painel/captacao/links" className="inline-flex h-11 items-center gap-2 rounded-lg border border-line bg-card px-4 font-semibold"><Link2 size={18} />Criar link com origem</Link>{add}</div>
      } />
      {!widgets?.length ? (
        <Empty title="Você ainda não criou nenhum botão ou formulário" desc="Crie o primeiro em 2 minutos: escolha o modo, o número de WhatsApp e cole uma linha no seu site." action={add} />
      ) : (
        <div className="grid gap-3">
          {widgets.map((w) => (
            <Card key={w.id} className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Link href={`/painel/captacao/${w.id}`} className="font-display font-semibold hover:text-primary">{w.name}</Link>
                <p className="text-sm text-mute">{MODES[w.mode as keyof typeof MODES].label} · {formatPhone(w.whatsapp_e164)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={w.is_active ? "bg-success-soft text-emerald-800" : "bg-bg text-mute"}>{w.is_active ? "Ativo" : "Desligado"}</Badge>
                <Badge className={w.first_seen_at ? "bg-success-soft text-emerald-800" : "bg-amber-50 text-amber-900"}>{w.first_seen_at ? "Instalado" : "Não instalado"}</Badge>
                <Link href={`/painel/captacao/${w.id}?instalar=1`} className="rounded-lg border border-line px-3 py-1.5 text-sm font-semibold">Instalar</Link>
                <Link href={`/painel/captacao/${w.id}`} className="rounded-lg border border-line px-3 py-1.5 text-sm font-semibold">Editar</Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
