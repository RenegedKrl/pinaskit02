"use server";
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { brTime, freeSlots, type BookingCfg } from "@/lib/crm";
import { normalizePhone } from "@/lib/csv";

/**
 * Agendamento público: confere se o horário ainda está livre, cria/atualiza o contato (origem "Agendamento"),
 * marca o horário e cria a tarefa de lembrete 1 hora antes para o responsável.
 */
export async function book(slug: string, startsAt: string, name: string, phone: string, note: string): Promise<{ ok: boolean; error?: string }> {
  const db = supabaseAdmin();
  const ip = ((await headers()).get("x-forwarded-for") ?? "").split(",")[0].trim() || "0";
  const { data: allowed } = await db.rpc("hit_rate_limit", { p_key: `book:${ip}`, p_window: 3600, p_max: 8 });
  if (allowed === false) return { ok: false, error: "Muitas tentativas. Tente de novo mais tarde." };
  const { data: p } = await db.from("booking_pages").select("*, workspaces(plan_status)").eq("slug", slug).eq("active", true).maybeSingle();
  if (!p || (p.workspaces as unknown as { plan_status: string } | null)?.plan_status === "read_only") return { ok: false, error: "Agenda indisponível." };
  const who = name.trim().slice(0, 120), digits = normalizePhone(phone);
  if (who.length < 2) return { ok: false, error: "Informe seu nome." };
  if (!digits) return { ok: false, error: "Informe um WhatsApp válido, com DDD." };
  const start = new Date(startsAt);
  const { data: taken } = await db.from("appointments").select("starts_at").eq("page_id", p.id).eq("status", "booked").gte("starts_at", new Date().toISOString());
  const free = freeSlots(p as BookingCfg, (taken ?? []).map((t) => t.starts_at)).flatMap((d) => d.slots);
  if (Number.isNaN(start.getTime()) || !free.includes(start.toISOString())) return { ok: false, error: "Esse horário acabou de ser ocupado. Escolha outro." };
  const end = new Date(start.getTime() + p.duration_min * 60_000);

  // contato: o mesmo WhatsApp não duplica
  const { data: existing } = await db.from("leads").select("id, name, owner_id").eq("workspace_id", p.workspace_id).eq("phone_e164", digits).maybeSingle();
  let leadId = existing?.id as string | undefined, owner = existing?.owner_id as string | null | undefined;
  if (!leadId) {
    const { data: lead, error } = await db.from("leads").insert({
      workspace_id: p.workspace_id, phone_e164: digits, name: who, source_label: "Agendamento", capture_method: "booking",
      answers: { option: p.title, message: note.trim().slice(0, 500) || null },
    }).select("id, owner_id").single();
    if (error || !lead) return { ok: false, error: "Não foi possível agendar. Tente de novo." };
    leadId = lead.id; owner = lead.owner_id;
  }
  const { data: appt, error: apErr } = await db.from("appointments").insert({
    workspace_id: p.workspace_id, page_id: p.id, lead_id: leadId, starts_at: start.toISOString(), ends_at: end.toISOString(), name: who, phone: digits, note: note.trim().slice(0, 500) || null,
  }).select("id").single();
  if (apErr || !appt) return { ok: false, error: apErr?.code === "23505" ? "Esse horário acabou de ser ocupado. Escolha outro." : "Não foi possível agendar." };
  const assignee = owner ?? (await db.from("workspace_members").select("user_id").eq("workspace_id", p.workspace_id).eq("role", "owner").limit(1).single()).data?.user_id ?? null;
  await db.from("tasks").insert({
    workspace_id: p.workspace_id, lead_id: leadId, assignee_id: assignee, kind: "meeting", source: "booking", appointment_id: appt.id,
    title: `${p.title} com ${who.split(" ")[0]} às ${brTime(start.toISOString())}`, due_at: new Date(start.getTime() - 3600_000).toISOString(),
    message: `Olá, ${who.split(" ")[0]}! Lembrando do seu horário hoje às ${brTime(start.toISOString())}. Até já!`,
  });
  await db.from("lead_activities").insert({ workspace_id: p.workspace_id, lead_id: leadId, type: "booking", body: { page: p.title, at: start.toISOString() } });
  return { ok: true };
}
