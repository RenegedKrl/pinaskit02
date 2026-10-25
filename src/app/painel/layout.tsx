import Link from "next/link";
import { Sidebar } from "@/components/painel/sidebar";
import { Tour } from "@/components/painel/tour";
import { Welcome } from "@/components/painel/welcome";
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
      <div className="min-w-0 flex-1 pb-20 md:pb-0">
        {banner && (
          <div className={`flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm md:px-8 ${banner.cls}`}>
            <span>{banner.text}</span>
            <Link href="/painel/assinatura" className="rounded-lg bg-primary px-3 py-1.5 font-semibold text-white">Assinar agora</Link>
          </div>
        )}
        <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">{children}</main>
        <Tour />
        <Welcome workspaceId={w.id} active={w.plan_status === "active"} />
      </div>
    </div>
  );
}
