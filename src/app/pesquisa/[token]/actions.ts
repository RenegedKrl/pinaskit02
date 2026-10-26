"use server";
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/admin";

/** Grava a nota (0–10) e o comentário. Uma resposta por dia por contato. */
export async function answerSurvey(token: string, score: number, comment: string): Promise<{ ok: boolean; error?: string }> {
  if (!/^[0-9a-f]{64}$/.test(token) || !Number.isInteger(score) || score < 0 || score > 10) return { ok: false, error: "Resposta inválida." };
  const db = supabaseAdmin();
  const ip = ((await headers()).get("x-forwarded-for") ?? "").split(",")[0].trim() || "0";
  const { data: allowed } = await db.rpc("hit_rate_limit", { p_key: `nps:${ip}`, p_window: 3600, p_max: 10 });
  if (allowed === false) return { ok: false, error: "Muitas tentativas. Tente mais tarde." };
  const { data: l } = await db.from("leads").select("id, workspace_id").eq("nps_token", token).maybeSingle();
  if (!l) return { ok: false, error: "Pesquisa não encontrada." };
  const { count } = await db.from("nps_responses").select("id", { count: "exact", head: true }).eq("lead_id", l.id).gte("created_at", new Date(Date.now() - 86_400_000).toISOString());
  if (count) return { ok: true };
  const text = comment.trim().slice(0, 1000) || null;
  await db.from("nps_responses").insert({ workspace_id: l.workspace_id, lead_id: l.id, score, comment: text });
  await db.from("lead_activities").insert({ workspace_id: l.workspace_id, lead_id: l.id, type: "nps", body: { score, comment: text } });
  return { ok: true };
}
