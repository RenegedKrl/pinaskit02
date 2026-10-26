"use server";
import { revalidatePath } from "next/cache";
import { canEdit, getSession, isAdmin } from "@/lib/session";
import { cleanItems, proposalTotal, type PropItem } from "@/lib/crm";

type Res = { ok: boolean; error?: string; id?: string; token?: string };
const done = (extra: Partial<Res> = {}): Res => { revalidatePath("/painel", "layout"); return { ok: true, ...extra }; };
const wrap = async (fn: () => Promise<Res>): Promise<Res> => { try { return await fn(); } catch (e) { return { ok: false, error: (e as Error).message }; } };
async function editor() {
  const s = await getSession();
  if (!canEdit(s.role)) throw new Error("Você tem acesso só de visualização.");
  return s;
}

export interface DealInput { id?: string; leadId: string; title: string; productId: string | null; value: number; expectedClose: string | null; probability: number }

/** Cria ou edita uma negociação do contato. */
export async function saveDeal(d: DealInput): Promise<Res> {
  return wrap(async () => {
    const { supabase, workspace, user } = await editor();
    if (!d.title.trim()) return { ok: false, error: "Dê um nome para a negociação." };
    const row = {
      title: d.title.trim().slice(0, 120), product_id: d.productId || null, value: Math.max(0, Math.round((Number(d.value) || 0) * 100) / 100),
      expected_close: /^\d{4}-\d{2}-\d{2}$/.test(d.expectedClose ?? "") ? d.expectedClose : null, probability: Math.min(100, Math.max(0, Math.round(d.probability))),
    };
    const q = d.id
      ? supabase.from("deals").update(row).eq("id", d.id).eq("workspace_id", workspace.id)
      : supabase.from("deals").insert({ ...row, workspace_id: workspace.id, lead_id: d.leadId, owner_id: user.id });
    const { error } = await q;
    return error ? { ok: false, error: "Não foi possível salvar a negociação." } : done();
  });
}

/** Ganhou ou perdeu: fecha a negociação. Ganhou → soma no valor do contato. */
export async function closeDeal(id: string, status: "won" | "lost" | "open"): Promise<Res> {
  return wrap(async () => {
    const { supabase, workspace, user } = await editor();
    const { data: d } = await supabase.from("deals").select("id, lead_id, value, title").eq("id", id).eq("workspace_id", workspace.id).single();
    if (!d) return { ok: false, error: "Negociação não encontrada." };
    const { error } = await supabase.from("deals").update({ status, closed_at: status === "open" ? null : new Date().toISOString(), probability: status === "won" ? 100 : status === "lost" ? 0 : 50 }).eq("id", id);
    if (error) return { ok: false, error: "Não foi possível salvar." };
    if (status !== "open") {
      await supabase.from("lead_activities").insert({ workspace_id: workspace.id, lead_id: d.lead_id, user_id: user.id, type: "deal_close", body: { title: d.title, status, value: d.value } });
      if (status === "won") {
        const { data: all } = await supabase.from("deals").select("value").eq("lead_id", d.lead_id).eq("status", "won");
        await supabase.from("leads").update({ deal_value: (all ?? []).reduce((a, x) => a + Number(x.value), 0) }).eq("id", d.lead_id);
      }
    }
    return done();
  });
}

export async function deleteDeal(id: string): Promise<Res> {
  return wrap(async () => {
    const { supabase, workspace } = await editor();
    await supabase.from("deals").delete().eq("id", id).eq("workspace_id", workspace.id);
    return done();
  });
}

/** Catálogo de produtos e serviços (dono/admin). */
export async function saveProduct(p: { id?: string; name: string; price: number; active: boolean }): Promise<Res> {
  return wrap(async () => {
    const { supabase, workspace, role } = await getSession();
    if (!isAdmin(role)) return { ok: false, error: "Só o dono ou um administrador mexe no catálogo." };
    if (!p.name.trim()) return { ok: false, error: "Dê um nome ao produto." };
    const row = { name: p.name.trim().slice(0, 80), price: Math.max(0, Math.round((Number(p.price) || 0) * 100) / 100), active: !!p.active };
    const { error } = p.id ? await supabase.from("products").update(row).eq("id", p.id).eq("workspace_id", workspace.id)
      : await supabase.from("products").insert({ ...row, workspace_id: workspace.id });
    return error ? { ok: false, error: "Não foi possível salvar o produto." } : done();
  });
}

export interface ProposalInput { leadId: string; dealId: string | null; title: string; items: PropItem[]; discount: number; notes: string; validUntil: string | null }

/** Cria a proposta e devolve o link público para mandar pelo WhatsApp. */
export async function createProposal(p: ProposalInput): Promise<Res> {
  return wrap(async () => {
    const { supabase, workspace, user } = await editor();
    const items = cleanItems(p.items);
    if (!p.title.trim()) return { ok: false, error: "Dê um título para a proposta." };
    if (!items.length) return { ok: false, error: "Adicione pelo menos um item com nome." };
    const discount = Math.max(0, Math.round((Number(p.discount) || 0) * 100) / 100);
    const { total } = proposalTotal(items, discount);
    const { data, error } = await supabase.from("proposals").insert({
      workspace_id: workspace.id, lead_id: p.leadId, deal_id: p.dealId || null, title: p.title.trim().slice(0, 120), items, discount, total,
      notes: p.notes.trim().slice(0, 2000) || null, valid_until: /^\d{4}-\d{2}-\d{2}$/.test(p.validUntil ?? "") ? p.validUntil : null, created_by: user.id,
    }).select("id, token").single();
    if (error || !data) return { ok: false, error: "Não foi possível criar a proposta." };
    await supabase.from("lead_activities").insert({ workspace_id: workspace.id, lead_id: p.leadId, user_id: user.id, type: "proposal_sent", body: { title: p.title, total } });
    return done({ id: data.id, token: data.token });
  });
}

export async function deleteProposal(id: string): Promise<Res> {
  return wrap(async () => {
    const { supabase, workspace } = await editor();
    await supabase.from("proposals").delete().eq("id", id).eq("workspace_id", workspace.id);
    return done();
  });
}
