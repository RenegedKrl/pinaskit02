"use server";
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { proposalExpired } from "@/lib/crm";

const TOKEN = /^[0-9a-f]{64}$/;

async function limited(key: string): Promise<boolean> {
  const ip = ((await headers()).get("x-forwarded-for") ?? "").split(",")[0].trim() || "0";
  const { data } = await supabaseAdmin().rpc("hit_rate_limit", { p_key: `${key}:${ip}`, p_window: 3600, p_max: 20 });
  return data === false;
}

/** Resposta do cliente: aceitar (move o contato para Venda com o valor) ou recusar (com motivo). */
export async function answerProposal(token: string, accept: boolean, name: string, reason: string): Promise<{ ok: boolean; error?: string }> {
  if (!TOKEN.test(token)) return { ok: false, error: "Link inválido." };
  if (await limited("prop")) return { ok: false, error: "Muitas tentativas. Tente de novo mais tarde." };
  const db = supabaseAdmin();
  const { data: p } = await db.from("proposals").select("id, workspace_id, lead_id, deal_id, status, total, valid_until, title").eq("token", token).maybeSingle();
  if (!p) return { ok: false, error: "Proposta não encontrada." };
  if (p.status === "accepted" || p.status === "declined") return { ok: false, error: "Esta proposta já foi respondida." };
  if (proposalExpired(p.valid_until)) return { ok: false, error: "Esta proposta venceu. Peça uma nova para quem te atendeu." };
  const who = name.trim().slice(0, 120);
  if (accept && who.length < 2) return { ok: false, error: "Escreva seu nome para confirmar." };
  const now = new Date().toISOString();
  await db.from("proposals").update({ status: accept ? "accepted" : "declined", answered_at: now, answer_name: who || null, decline_reason: accept ? null : reason.trim().slice(0, 300) || null }).eq("id", p.id);
  await db.from("lead_activities").insert({ workspace_id: p.workspace_id, lead_id: p.lead_id, type: accept ? "proposal_accepted" : "proposal_declined", body: { title: p.title, total: p.total, name: who, reason: reason.trim().slice(0, 300) || null } });
  if (accept) {
    const { data: won } = await db.from("pipeline_stages").select("key").eq("workspace_id", p.workspace_id).eq("kind", "won").single();
    await db.from("leads").update({ status: won?.key ?? "ganho", deal_value: p.total, updated_at: now }).eq("id", p.lead_id);
    if (p.deal_id) await db.from("deals").update({ status: "won", probability: 100, closed_at: now, value: p.total }).eq("id", p.deal_id);
  }
  return { ok: true };
}
