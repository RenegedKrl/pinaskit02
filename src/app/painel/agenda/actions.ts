"use server";
import { revalidatePath } from "next/cache";
import { canEdit, getSession, isAdmin } from "@/lib/session";
import { slugify } from "@/lib/crm";

type Res = { ok: boolean; error?: string };
const done = (): Res => { revalidatePath("/painel", "layout"); return { ok: true }; };
const HM = /^([01]\d|2[0-3]):[0-5]\d$/;

export interface PageInput { id?: string; slug: string; title: string; description: string; duration_min: number; days: number[]; start_time: string; end_time: string; window_days: number; min_notice_hours: number; active: boolean }

/** Página de agendamento (dono/admin). */
export async function saveBookingPage(p: PageInput): Promise<Res> {
  const { supabase, workspace, role } = await getSession();
  if (!isAdmin(role)) return { ok: false, error: "Só o dono ou um administrador configura a agenda." };
  const slug = slugify(p.slug || p.title);
  if (slug.length < 3) return { ok: false, error: "O endereço precisa ter pelo menos 3 letras." };
  if (!p.title.trim()) return { ok: false, error: "Dê um nome para o atendimento." };
  if (!HM.test(p.start_time) || !HM.test(p.end_time) || p.start_time >= p.end_time) return { ok: false, error: "Confira os horários: o fim precisa ser depois do início." };
  const days = [...new Set(p.days.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))].sort();
  if (!days.length) return { ok: false, error: "Escolha pelo menos um dia da semana." };
  const row = {
    slug, title: p.title.trim().slice(0, 80), description: p.description.trim().slice(0, 300) || null, days, start_time: p.start_time, end_time: p.end_time,
    duration_min: Math.min(240, Math.max(10, Math.round(p.duration_min))), window_days: Math.min(60, Math.max(1, Math.round(p.window_days))),
    min_notice_hours: Math.min(72, Math.max(0, Math.round(p.min_notice_hours))), active: !!p.active,
  };
  const { error } = p.id ? await supabase.from("booking_pages").update(row).eq("id", p.id).eq("workspace_id", workspace.id)
    : await supabase.from("booking_pages").insert({ ...row, workspace_id: workspace.id });
  if (error) return { ok: false, error: error.code === "23505" ? "Esse endereço já está em uso. Escolha outro." : "Não foi possível salvar." };
  return done();
}

/** Marca o atendimento como realizado, faltou ou cancelado. */
export async function setAppointmentStatus(id: string, status: "done" | "no_show" | "canceled" | "booked"): Promise<Res> {
  const { supabase, workspace, role } = await getSession();
  if (!canEdit(role)) return { ok: false, error: "Sem permissão." };
  const { error } = await supabase.from("appointments").update({ status }).eq("id", id).eq("workspace_id", workspace.id);
  if (error) return { ok: false, error: error.code === "23505" ? "Esse horário já foi ocupado por outra pessoa." : "Não foi possível salvar." };
  if (status === "canceled") await supabase.from("tasks").delete().eq("workspace_id", workspace.id).eq("appointment_id", id).is("done_at", null);
  return done();
}
