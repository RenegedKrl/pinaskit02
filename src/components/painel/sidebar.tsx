"use client";
import { Logo } from "@/components/logo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, MousePointerClick, Users, KanbanSquare, Settings, CreditCard, LogOut, ChevronsLeft, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV = [
  { href: "/painel", label: "Início", icon: Home },
  { href: "/painel/captacao", label: "Botões e formulários", icon: MousePointerClick },
  { href: "/painel/contatos", label: "Contatos", icon: Users },
  { href: "/painel/funil", label: "Funil", icon: KanbanSquare },
  { href: "/painel/configuracoes", label: "Configurações", icon: Settings },
];

export function Sidebar({ trialText, signOut }: { trialText: string | null; signOut: () => Promise<void> }) {
  const path = usePathname();
  const [small, setSmall] = useState(false);
  useEffect(() => { try { setSmall(localStorage.getItem("pk-menu") === "1"); } catch { /* ignore */ } }, []);
  const toggle = () => { setSmall((s) => { try { localStorage.setItem("pk-menu", s ? "0" : "1"); } catch { /* ignore */ } return !s; }); };
  const active = (h: string) => (h === "/painel" ? path === h : path.startsWith(h));

  return (
    <>
      <aside className={cn("sticky top-0 hidden h-dvh flex-col border-r border-line bg-card p-3 md:flex", small ? "w-[68px]" : "w-60")}>
        <div className="mb-6 flex items-center justify-between px-2 pt-2">
          <Logo compact={small} />
          <button onClick={toggle} aria-label={small ? "Abrir menu" : "Recolher menu"} className="rounded-md p-1.5 text-mute hover:bg-primary-soft">
            {small ? <Menu size={18} /> : <ChevronsLeft size={18} />}
          </button>
        </div>
        <nav className="space-y-1">
          {NAV.map(({ href, label, icon: I }) => (
            <Link key={href} href={href} title={small ? label : undefined}
              className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium", active(href) ? "bg-primary-soft text-primary" : "text-ink hover:bg-bg")}>
              <I size={18} />{!small && label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-2">
          {trialText && !small && (
            <div className="rounded-xl bg-primary-soft p-3 text-sm">
              <p className="font-semibold text-ink">{trialText}</p>
              <Link href="/painel/assinatura" className="mt-2 block rounded-lg bg-primary py-2 text-center font-semibold text-white">Assinar</Link>
            </div>
          )}
          <Link href="/painel/assinatura" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] text-ink hover:bg-bg"><CreditCard size={18} />{!small && "Assinatura"}</Link>
          <ThemeToggle compact={small} className="w-full" />
          <form action={signOut}><button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] text-ink hover:bg-bg"><LogOut size={18} />{!small && "Sair"}</button></form>
        </div>
      </aside>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-line bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
        {[NAV[0], NAV[2], NAV[3], NAV[4]].map(({ href, label, icon: I }) => (
          <Link key={href} href={href} className={cn("flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs", active(href) ? "text-primary" : "text-mute")}>
            <I size={20} />{href === "/painel/configuracoes" ? "Mais" : label}
          </Link>
        ))}
      </nav>
    </>
  );
}
