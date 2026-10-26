import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { brl } from "@/lib/plan";
import { proposalExpired, proposalTotal, type PropItem } from "@/lib/crm";
import { Answer } from "./answer";

export const metadata: Metadata = { title: "Proposta", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Página pública da proposta (link mandado pelo WhatsApp). Nunca mostra o telefone da conta. */
export default async function PropostaPublica({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[0-9a-f]{64}$/.test(token)) notFound();
  const db = supabaseAdmin();
  const { data: p } = await db.from("proposals").select("id, title, items, discount, total, notes, valid_until, status, created_at, decline_reason, workspaces(name), leads(name)").eq("token", token).maybeSingle();
  if (!p) notFound();
  if (p.status === "sent") await db.from("proposals").update({ status: "viewed", viewed_at: new Date().toISOString() }).eq("id", p.id);
  const items = (p.items ?? []) as PropItem[];
  const { subtotal } = proposalTotal(items, Number(p.discount));
  const biz = (p.workspaces as unknown as { name: string } | null)?.name ?? "";
  const client = (p.leads as unknown as { name: string | null } | null)?.name;
  const expired = proposalExpired(p.valid_until);
  const answered = p.status === "accepted" || p.status === "declined";

  return (
    <main className="min-h-dvh bg-[radial-gradient(60%_50%_at_50%_0%,#dbeafe,transparent)] bg-bg px-4 py-10 text-ink">
      <article className="mx-auto max-w-2xl overflow-hidden rounded-[28px] border border-line bg-card shadow-[0_30px_80px_-40px_rgba(15,23,42,.35)]">
        <header className="bg-[#0b1220] px-6 py-7 text-white sm:px-10">
          <p className="text-sm font-semibold uppercase tracking-[.14em] text-blue-300">{biz}</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">{p.title}</h1>
          <p className="mt-2 text-slate-300">{client ? `Para ${client} · ` : ""}{new Date(p.created_at).toLocaleDateString("pt-BR")}{p.valid_until ? ` · válida até ${p.valid_until.split("-").reverse().join("/")}` : ""}</p>
        </header>
        <div className="px-6 py-6 sm:px-10">
          <table className="w-full text-left text-[15px]">
            <thead className="border-b border-line text-sm text-mute"><tr><th className="pb-2 font-semibold">Item</th><th className="pb-2 text-right font-semibold">Qtd.</th><th className="pb-2 text-right font-semibold">Valor</th></tr></thead>
            <tbody>{items.map((i, n) => (
              <tr key={n} className="border-b border-line last:border-0"><td className="py-3 pr-2 font-medium">{i.name}</td><td className="py-3 text-right text-mute">{i.qty}</td><td className="py-3 text-right tabular-nums">{brl(i.qty * i.price)}</td></tr>
            ))}</tbody>
          </table>
          <div className="mt-4 space-y-1 rounded-2xl bg-bg p-4 text-right">
            {Number(p.discount) > 0 && <><p className="text-sm text-mute">Subtotal {brl(subtotal)}</p><p className="text-sm text-emerald-700">Desconto −{brl(Number(p.discount))}</p></>}
            <p className="font-display text-3xl font-bold tabular-nums">{brl(Number(p.total))}</p>
          </div>
          {p.notes && <div className="mt-5"><p className="text-sm font-semibold">Condições</p><p className="mt-1 whitespace-pre-wrap text-mute">{p.notes}</p></div>}
          <div className="mt-8">
            {p.status === "accepted" ? <p className="rounded-2xl bg-emerald-50 p-4 text-center font-semibold text-emerald-800">Proposta aceita. Obrigado! Em breve {biz || "a equipe"} fala com você.</p>
              : p.status === "declined" ? <p className="rounded-2xl bg-bg p-4 text-center text-mute">Você recusou esta proposta. Se mudar de ideia, fale com quem te atendeu.</p>
              : expired ? <p className="rounded-2xl bg-amber-50 p-4 text-center text-amber-900">Esta proposta venceu. Peça uma atualizada para quem te atendeu.</p>
              : <Answer token={token} />}
          </div>
        </div>
      </article>
      {!answered && <p className="mt-6 text-center text-xs text-mute">Proposta enviada pelo Pinas Kit</p>}
    </main>
  );
}
