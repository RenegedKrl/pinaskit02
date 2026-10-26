import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays, ExternalLink } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { trackedWhatsApp, type BioLink } from "@/lib/bio";
import { WhatsAppIcon } from "@/components/ui";

export const dynamic = "force-dynamic";

async function load(slug: string) {
  if (!/^[a-z0-9][a-z0-9-]{2,39}$/.test(slug)) return null;
  const { data } = await supabaseAdmin().from("bio_pages").select("title, subtitle, color, whatsapp_label, links, active, widgets(public_key, is_active), booking_pages(slug, title, active), workspaces(plan_status)").eq("slug", slug).maybeSingle();
  return data?.active ? data : null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const b = await load((await params).slug);
  return b ? { title: b.title, description: b.subtitle ?? undefined } : { title: "Página não encontrada" };
}

/** Página pública da bio. O botão de WhatsApp passa pelo servidor (registra a origem) e o número nunca aparece aqui. */
export default async function BioPublica({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ utm_source?: string; utm_medium?: string }> }) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const b = await load(slug);
  if (!b || (b.workspaces as unknown as { plan_status: string } | null)?.plan_status === "read_only") notFound();
  const w = b.widgets as unknown as { public_key: string; is_active: boolean } | null;
  const page = b.booking_pages as unknown as { slug: string; title: string; active: boolean } | null;
  const via = sp.utm_medium === "qrcode" ? "qrcode" : "bio";
  const api = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const links = (b.links ?? []) as BioLink[];
  return (
    <main className="min-h-dvh px-5 py-12 text-slate-900" style={{ background: `linear-gradient(180deg, ${b.color}26, #ffffff 40%)` }}>
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto grid size-24 place-items-center rounded-full text-4xl font-bold text-white shadow-lg" style={{ background: b.color }}>{b.title.charAt(0).toUpperCase()}</div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">{b.title}</h1>
        {b.subtitle && <p className="mt-1.5 text-slate-600">{b.subtitle}</p>}
        <div className="mt-8 space-y-3">
          {w?.is_active && api && (
            <a href={trackedWhatsApp(api, w.public_key, via)} rel="noopener" className="flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-4 text-lg font-bold text-white shadow-lg shadow-emerald-500/25 transition hover:brightness-95">
              <WhatsAppIcon size={22} />{b.whatsapp_label}
            </a>
          )}
          {page?.active && <a href={`/agendar/${page.slug}`} className="flex items-center justify-center gap-2 rounded-2xl py-4 text-lg font-bold text-white shadow-lg transition hover:brightness-95" style={{ background: b.color }}><CalendarDays size={20} />{page.title}</a>}
          {links.map((l) => (
            <a key={l.url} href={l.url} target="_blank" rel="noopener nofollow" className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-4 font-semibold shadow-sm transition hover:border-slate-300">{l.label}<ExternalLink size={15} className="text-slate-400" /></a>
          ))}
        </div>
        <p className="mt-10 text-xs text-slate-400">Feito com Pinas Kit</p>
      </div>
    </main>
  );
}
