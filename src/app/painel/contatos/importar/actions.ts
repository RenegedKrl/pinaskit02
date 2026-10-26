"use server";
import { revalidatePath } from "next/cache";
import { canEdit, getSession } from "@/lib/session";
import { normalizePhone, type ImportRow } from "@/lib/csv";

const MAX = 2000;

/** Importa contatos. Quem já existe (mesmo WhatsApp) é mantido como está. */
export async function importLeads(rows: ImportRow[]): Promise<{ ok: boolean; added?: number; existing?: number; error?: string }> {
  const { supabase, workspace, role } = await getSession();
  if (!canEdit(role)) return { ok: false, error: "Você tem acesso só de visualização." };
  if (["read_only", "canceled"].includes(workspace.plan_status)) return { ok: false, error: "Assine para importar contatos." };
  if (!Array.isArray(rows) || !rows.length) return { ok: false, error: "Nenhuma linha válida." };
  if (rows.length > MAX) return { ok: false, error: `Importe no máximo ${MAX} contatos por vez.` };

  const { data: stage } = await supabase.from("pipeline_stages").select("key").eq("workspace_id", workspace.id).eq("kind", "new").maybeSingle();
  const clean = rows.map((r) => ({ ...r, phone: normalizePhone(String(r.phone ?? "")) })).filter((r): r is ImportRow => !!r.phone);
  let added = 0;
  for (let i = 0; i < clean.length; i += 500) {
    const chunk = clean.slice(i, i + 500).map((r) => ({
      workspace_id: workspace.id, phone_e164: r.phone, name: r.name?.slice(0, 120) || null, email: r.email?.slice(0, 200) || null,
      source_label: r.source?.slice(0, 60) || "Importado", capture_method: "import", status: stage?.key ?? "novo",
    }));
    const { data, error } = await supabase.from("leads").upsert(chunk, { onConflict: "workspace_id,phone_e164", ignoreDuplicates: true }).select("id");
    if (error) return { ok: false, error: "Não foi possível importar. Nenhum contato desta parte foi salvo.", added };
    added += data?.length ?? 0;
  }
  revalidatePath("/painel", "layout");
  return { ok: true, added, existing: clean.length - added };
}
