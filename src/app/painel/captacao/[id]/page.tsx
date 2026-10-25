import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { canEdit, getSession } from "@/lib/session";
import { mergeConfig, type Mode } from "@shared/widget-config";
import { Button, Card, PageHeader } from "@/components/ui";
import { Editor } from "@/components/captacao/editor";
import { Install } from "@/components/captacao/install";
import { deleteWidget } from "../actions";

export default async function EditWidget({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ instalar?: string }> }) {
  const { id } = await params;
  const { instalar } = await searchParams;
  const { supabase, workspace, role } = await getSession();
  const { data: w } = await supabase.from("widgets").select("*").eq("id", id).eq("workspace_id", workspace.id).maybeSingle();
  if (!w) notFound();
  const appUrl = await widgetBaseUrl();
  const apiUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1`;
  return (
    <>
      <Link href="/painel/captacao" className="mb-3 inline-flex items-center gap-1 text-sm text-mute"><ArrowLeft size={15} />Voltar</Link>
      <PageHeader title={w.name} desc="Edite à vontade: o seu site recebe as mudanças sozinho." />
      <Card className={`mb-6 ${instalar ? "border-primary" : ""}`}>
        <h2 className="mb-4 font-display text-lg font-semibold">Instalar no site</h2>
        <Install publicKey={w.public_key} installed={!!w.first_seen_at} appUrl={appUrl} apiUrl={apiUrl} />
      </Card>
      {canEdit(role) ? (
        <>
          <Editor id={w.id} name={w.name} mode={w.mode as Mode} whatsapp={w.whatsapp_e164} isActive={w.is_active} config={mergeConfig(w.config)} />
          <form action={deleteWidget} className="mt-8">
            <input type="hidden" name="id" value={w.id} />
            <Button variant="danger" size="sm">Excluir este ponto de contato</Button>
            <p className="mt-1 text-sm text-mute">Os contatos já recebidos continuam salvos.</p>
          </form>
        </>
      ) : <p className="text-mute">Você tem acesso só de visualização.</p>}
    </>
  );
}

// Endereço público de onde o site do cliente baixa o w.js. Nunca pode ser localhost:
// um site real não acessa o computador de quem copiou o código.
const PUBLIC_APP_URL = "https://pinaskit.vercel.app";
async function widgetBaseUrl(): Promise<string> {
  const env = process.env.NEXT_PUBLIC_APP_URL;
  if (env && !/localhost|127\.0\.0\.1/.test(env)) return env.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  if (host && !/localhost|127\.0\.0\.1/.test(host)) return `https://${host}`;
  return PUBLIC_APP_URL;
}
