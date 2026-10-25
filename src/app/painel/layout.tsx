import Link from "next/link";
import { Sidebar } from "@/components/painel/sidebar";
import { Tour } from "@/components/painel/tour";
import { Welcome } from "@/components/painel/welcome";
import { NotificationBell } from "@/components/painel/bell";
import { getSession, trialDaysLeft } from "@/lib/session";
import { signOut } from "@/app/entrar/actions";

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const { workspace: w } = await getSession();
  const days = trialDaysLeft(w);
  const trialText = w.plan_status === "trial" ? `Teste grátis: ${days} ${days === 1 ? "dia restante" : "dias restantes"}` : null;
  const banner =
    w.plan_status === "read_only" ? { cls: "bg-red-50 text-red-800", text: "Seu acesso está em modo somente leitura. Seus contatos continuam salvos e você pode exportá-los. Assine para voltar a receber contatos." }
    : w.plan_status === "past_due" ? { cls: "bg-amber-50 text-amber-900", text: "Não identificamos o pagamento da sua assinatura. Pague para não perder a captação de contatos." }
    : trialText ? { cls: "bg-primary-soft text-ink", text: `${trialText}. Assine para não perder o acesso.` } : null;

  return (
    <div className="flex min-h-dvh">
      <Sidebar trialText={trialText} signOut={signOut} />
      <div className="relative min-w-0 flex-1 pb-20 md:pb-0">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(60%_100%_at_20%_0%,color-mix(in_oklab,var(--color-primary)_10%,transparent),transparent),radial-gradient(40%_80%_at_90%_0%,color-mix(in_oklab,#8b5cf6_8%,transparent),transparent)]" />
        {banner && (
          <div className={`flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm md:px-8 ${banner.cls}`}>
            <span>{banner.text}</span>
            <Link href="/painel/assinatura" className="rounded-lg bg-primary px-3 py-1.5 font-semibold text-white">Assinar agora</Link>
          </div>
        )}
        <main className="w-full px-4 py-5 md:px-6 md:py-6 xl:px-8">{children}</main>
        <div className="fixed right-3 top-3 z-40 rounded-full bg-[#0b1220] text-slate-300 shadow-lg md:hidden"><NotificationBell compact className="[&>button]:h-10 [&>button]:w-10" /></div>
        <Tour />
        <Welcome workspaceId={w.id} active={w.plan_status === "active"} />
      </div>
    </div>
  );
}
