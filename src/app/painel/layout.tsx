import Link from "next/link";
import { cookies } from "next/headers";
import { Topbar } from "@/components/painel/topbar";
import { Sidebar } from "@/components/painel/sidebar";
import { Tour } from "@/components/painel/tour";
import { Welcome } from "@/components/painel/welcome";
import { NotificationBell } from "@/components/painel/bell";
import { getSession, trialDaysLeft } from "@/lib/session";
import { signOut } from "@/app/entrar/actions";

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const { workspace: w, user } = await getSession();
  const side = (await cookies()).get("pk-layout")?.value === "lateral";
  const days = trialDaysLeft(w);
  const trialText = w.plan_status === "trial" ? `Teste grátis: ${days} ${days === 1 ? "dia restante" : "dias restantes"}` : null;
  const banner =
    w.plan_status === "read_only" ? { cls: "bg-red-50 text-red-800", text: "Seu acesso está em modo somente leitura. Seus contatos continuam salvos e você pode exportá-los. Assine para voltar a receber contatos." }
    : w.plan_status === "past_due" ? { cls: "bg-amber-50 text-amber-900", text: "Não identificamos o pagamento da sua assinatura. Pague para não perder a captação de contatos." }
    : trialText ? { cls: "bg-primary-soft text-ink", text: `${trialText}. Assine para não perder o acesso.` } : null;

  const content = (
    <>
      {banner && (
        <div className={`flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm md:px-6 xl:px-8 ${banner.cls}`}>
          <span>{banner.text}</span>
          <Link href="/painel/assinatura" className="rounded-full bg-primary px-4 py-1.5 font-semibold text-white">Assinar agora</Link>
        </div>
      )}
      <main className="w-full px-4 py-5 md:px-6 md:py-7 xl:px-8">{children}</main>
      <Tour />
      <Welcome workspaceId={w.id} active={w.plan_status === "active"} />
    </>
  );

  if (side) return (
    <div className="flex min-h-dvh">
      <Sidebar trialText={trialText} signOut={signOut} />
      <div className="relative min-w-0 flex-1 pb-20 md:pb-0">
        {content}
        <div className="fixed right-3 top-3 z-40 md:hidden"><NotificationBell /></div>
      </div>
    </div>
  );
  return (
    <div className="min-h-dvh pb-20 md:pb-0">
      <Topbar trialText={trialText} name={w.name ?? ""} email={user.email ?? ""} signOut={signOut} />
      {content}
    </div>
  );
}
