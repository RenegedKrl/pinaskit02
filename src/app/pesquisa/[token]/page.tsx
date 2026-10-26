import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { Survey } from "./survey";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pesquisa de satisfação", robots: { index: false, follow: false } };

/** Pesquisa de satisfação pública (nota de 0 a 10). */
export default async function Pesquisa({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[0-9a-f]{64}$/.test(token)) notFound();
  const { data: l } = await supabaseAdmin().from("leads").select("name, workspaces(name)").eq("nps_token", token).maybeSingle();
  if (!l) notFound();
  const biz = (l.workspaces as unknown as { name: string } | null)?.name ?? "nós";
  return (
    <main className="grid min-h-dvh place-items-center bg-[radial-gradient(60%_50%_at_50%_0%,#dbeafe,transparent)] bg-bg px-4 py-10 text-ink">
      <div className="w-full max-w-lg rounded-[28px] border border-line bg-card p-6 text-center shadow-[0_30px_80px_-40px_rgba(15,23,42,.35)] sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[.14em] text-primary">{biz}</p>
        <h1 className="mt-2 font-display text-2xl font-bold">{l.name ? `${l.name.split(" ")[0]}, de 0 a 10` : "De 0 a 10"}, quanto você recomendaria {biz} para um amigo?</h1>
        <Survey token={token} />
      </div>
    </main>
  );
}
