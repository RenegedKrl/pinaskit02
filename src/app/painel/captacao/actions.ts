"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canEdit, getSession } from "@/lib/session";
import { randomKey } from "@/lib/utils";
import { mergeConfig, type Mode, type WidgetConfig } from "@shared/widget-config";

export interface WidgetInput { name: string; mode: Mode; whatsapp: string; is_active: boolean; config: WidgetConfig }

const MODES = new Set(["button", "form", "both"]);

export async function saveWidget(id: string | null, input: WidgetInput): Promise<{ error?: string; id?: string }> {
  const { supabase, workspace, role } = await getSession();
  if (!canEdit(role)) return { error: "Você não tem permissão para editar." };
  const phone = input.whatsapp.replace(/\D/g, "");
  if (!input.name.trim()) return { error: "Dê um nome para identificar este ponto de contato." };
  if (phone.length < 12 || phone.length > 15) return { error: "Informe o WhatsApp com código do país e DDD. Ex.: 55 11 99999-8888." };
  if (!MODES.has(input.mode)) return { error: "Modo inválido." };
  const config = mergeConfig(input.config);
  const row = { name: input.name.trim().slice(0, 80), mode: input.mode, whatsapp_e164: phone, is_active: input.is_active, config };
  if (id) {
    const { error } = await supabase.from("widgets").update(row).eq("id", id).eq("workspace_id", workspace.id);
    if (error) return { error: "Não foi possível salvar. Tente novamente." };
    revalidatePath("/painel/captacao");
    return { id };
  }
  const { data, error } = await supabase.from("widgets").insert({ ...row, workspace_id: workspace.id, public_key: randomKey() }).select("id").single();
  if (error || !data) return { error: "Não foi possível criar. Tente novamente." };
  revalidatePath("/painel/captacao");
  return { id: data.id };
}

export async function deleteWidget(fd: FormData) {
  const { supabase, workspace, role } = await getSession();
  if (!canEdit(role)) return;
  await supabase.from("widgets").delete().eq("id", String(fd.get("id"))).eq("workspace_id", workspace.id);
  revalidatePath("/painel/captacao");
  redirect("/painel/captacao");
}
