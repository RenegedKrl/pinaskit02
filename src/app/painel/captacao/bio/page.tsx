import Link from "next/link";
import QRCode from "qrcode";
import { ArrowLeft } from "lucide-react";
import { getSession, isAdmin } from "@/lib/session";
import { appUrl } from "@/lib/app-url";
import { slugify } from "@/lib/crm";
import { trackedWhatsApp, type BioLink } from "@/lib/bio";
import { PageHeader } from "@/components/ui";
import { BioEditor } from "@/components/crm/bio-editor";

const qr = (text: string) => QRCode.toString(text, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#0b1220", light: "#ffffff" } });

/** Página da bio (estilo Linktree) e QR Codes com origem registrada. */
export default async function Bio() {
  const { supabase, workspace, role } = await getSession();
  const [{ data: bio }, { data: widgets }, { data: pages }, base] = await Promise.all([
    supabase.from("bio_pages").select("*").eq("workspace_id", workspace.id).order("created_at").limit(1).maybeSingle(),
    supabase.from("widgets").select("id, name, public_key").eq("workspace_id", workspace.id).eq("is_active", true).order("name"),
    supabase.from("booking_pages").select("id, title").eq("workspace_id", workspace.id).eq("active", true).order("title"),
    appUrl(),
  ]);
  const initial = bio ? { ...bio, subtitle: bio.subtitle ?? "", links: (bio.links ?? []) as BioLink[] }
    : { slug: slugify(workspace.name), title: workspace.name, subtitle: "", color: "#2563eb", widget_id: widgets?.[0]?.id ?? null, whatsapp_label: "Falar no WhatsApp", booking_page_id: null, links: [], active: true };
  const key = widgets?.find((w) => w.id === initial.widget_id)?.public_key;
  const api = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const [qrBio, qrStore] = bio ? await Promise.all([qr(`${base}/l/${bio.slug}?utm_source=qrcode&utm_medium=qrcode`), key && api ? qr(trackedWhatsApp(api, key, "qrcode")) : null]) : [null, null];
  return (
    <>
      <Link href="/painel/captacao" className="mb-3 inline-flex items-center gap-1 text-sm text-mute"><ArrowLeft size={15} />Botões e formulários</Link>
      <PageHeader title="Link da bio e QR Code" desc="Uma página sua para a bio do Instagram, com WhatsApp, agenda e links. E QR Codes para balcão e cartaz." />
      {isAdmin(role) ? <BioEditor initial={initial} widgets={(widgets ?? []).map(({ id, name }) => ({ id, name }))} pages={pages ?? []} appUrl={base} qrBio={qrBio} qrStore={qrStore} />
        : <p className="text-mute">Só o dono ou um administrador edita a página da bio.</p>}
    </>
  );
}
