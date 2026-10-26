"use server";
import { revalidatePath } from "next/cache";
import { getSession, isAdmin } from "@/lib/session";
import { slugify } from "@/lib/crm";
import { cleanLinks, type BioLink } from "@/lib/bio";

export interface BioInput { id?: string; slug: string; title: string; subtitle: string; color: string; widget_id: string | null; whatsapp_label: string; booking_page_id: string | null; links: BioLink[]; active: boolean }

/** Página da bio (link na bio do Instagram + QR Code). Dono/admin. */
export async function saveBio(b: BioInput): Promise<{ ok: boolean; error?: string }> {
  const { supabase, workspace, role } = await getSession();
  if (!isAdmin(role)) return { ok: false, error: "Só o dono ou um administrador edita a página da bio." };
  const slug = slugify(b.slug || b.title);
  if (slug.length < 3) return { ok: false, error: "O endereço precisa ter pelo menos 3 letras." };
  if (!b.title.trim()) return { ok: false, error: "Escreva o nome que aparece no topo." };
  const row = {
    slug, title: b.title.trim().slice(0, 60), subtitle: b.subtitle.trim().slice(0, 160) || null,
    color: /^#[0-9a-fA-F]{6}$/.test(b.color) ? b.color : "#2563eb", widget_id: b.widget_id || null, booking_page_id: b.booking_page_id || null,
    whatsapp_label: b.whatsapp_label.trim().slice(0, 40) || "Falar no WhatsApp", links: cleanLinks(b.links), active: !!b.active,
  };
  const { error } = b.id ? await supabase.from("bio_pages").update(row).eq("id", b.id).eq("workspace_id", workspace.id)
    : await supabase.from("bio_pages").insert({ ...row, workspace_id: workspace.id });
  if (error) return { ok: false, error: error.code === "23505" ? "Esse endereço já está em uso. Escolha outro." : "Não foi possível salvar." };
  revalidatePath("/painel", "layout");
  return { ok: true };
}
