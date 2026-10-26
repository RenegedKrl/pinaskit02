"use client";
import { Logo } from "@/components/logo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CreditCard, LogOut, ChevronsLeft, Menu, LifeBuoy, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/painel/bell";
import { SupportButton } from "@/components/support-button";
import { isActive, NAV_GROUPS } from "./nav";
import { MobileNav } from "./mobile-nav";

const row = "flex items-center gap-3 rounded-lg px-3 py-2 text-[14.5px] hover:bg-white/5 hover:text-white";

/** Menu lateral escuro (padrão do painel), com as telas em grupos e opção de recolher. */
export function Sidebar({ trialText, signOut, superAdmin }: { trialText: string | null; signOut: () => Promise<void>; superAdmin?: boolean }) {
  const path = usePathname();
  const [small, setSmall] = useState(false);
  useEffect(() => { try { setSmall(localStorage.getItem("pk-menu") === "1"); } catch { /* ignore */ } }, []);
  const toggle = () => { setSmall((s) => { try { localStorage.setItem("pk-menu", s ? "0" : "1"); } catch { /* ignore */ } return !s; }); };
  const active = (h: string) => isActive(path, h);

  return (
    <>
      <aside className={cn("sticky top-0 z-30 hidden h-dvh flex-col bg-[#0b1220] p-3 text-slate-300 md:flex", small ? "w-[68px]" : "w-60")}>
        <div className={cn("mb-5 flex items-center px-2 pt-2", small ? "justify-center" : "justify-between")}>
          {!small && <Link href="/painel/hoje" aria-label="Meu dia"><Logo className="text-white" /></Link>}
          <button onClick={toggle} aria-label={small ? "Abrir menu" : "Recolher menu"} className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white">
            {small ? <Menu size={20} /> : <ChevronsLeft size={18} />}
          </button>
        </div>
        <nav className="-mx-1 min-h-0 flex-1 space-y-4 overflow-y-auto px-1">
          {NAV_GROUPS.map((g) => (
            <div key={g.title} className="space-y-0.5">
              {!small && <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{g.title}</p>}
              {g.items.map(({ href, label, icon: I }) => (
                <Link key={href} href={href} title={small ? label : undefined}
                  className={cn("relative flex items-center gap-3 rounded-lg px-3 py-2 text-[14.5px] font-medium transition-colors", small && "justify-center px-0",
                    active(href) ? "bg-white/10 text-white before:absolute before:bottom-2 before:left-0 before:top-2 before:w-0.5 before:rounded-full before:bg-blue-400" : "hover:bg-white/5 hover:text-white")}>
                  <I size={18} className={active(href) ? "text-blue-400" : ""} />{!small && label}
                </Link>
              ))}
            </div>
          ))}
          <NotificationBell menu compact={small} />
        </nav>
        <div className="mt-3 space-y-1 border-t border-white/10 pt-3">
          {trialText && !small && (
            <div className="mb-2 rounded-xl border border-white/10 bg-gradient-to-br from-blue-500/20 to-violet-500/10 p-3 text-sm">
              <p className="font-semibold text-white">{trialText}</p>
              <p className="mt-0.5 text-xs text-slate-400">Assine para não perder o acesso.</p>
              <Link href="/painel/assinatura" className="mt-2 block rounded-lg bg-blue-500 py-2 text-center font-semibold text-white hover:bg-blue-400">Assinar</Link>
            </div>
          )}
          {superAdmin && <Link href="/painel/admin" title={small ? "Painel do dono" : undefined} className={cn(row, small && "justify-center px-0")}><Crown size={18} />{!small && "Painel do dono"}</Link>}
          <Link href="/ajuda" title={small ? "Ajuda" : undefined} className={cn(row, small && "justify-center px-0")}><LifeBuoy size={18} />{!small && "Ajuda"}</Link>
          {process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP && <span title={small ? "Fale com o suporte" : undefined}><SupportButton plain compact={small} className={cn(row, "w-full font-normal", small && "justify-center px-0")} /></span>}
          <Link href="/painel/assinatura" title={small ? "Assinatura" : undefined} className={cn(row, small && "justify-center px-0")}><CreditCard size={18} />{!small && "Assinatura"}</Link>
          <ThemeToggle compact={small} className={cn("w-full py-2 text-[14.5px] text-slate-300 hover:bg-white/5 hover:text-white", small && "justify-center px-0")} />
          <form action={signOut}><button title={small ? "Sair" : undefined} className={cn(row, "w-full", small && "justify-center px-0")}><LogOut size={18} />{!small && "Sair"}</button></form>
        </div>
      </aside>
      <MobileNav />
    </>
  );
}
