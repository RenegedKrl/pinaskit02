"use client";
import { Logo } from "@/components/logo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, MousePointerClick, Users, KanbanSquare, BarChart3, Settings, CreditCard, LogOut, ChevronsLeft, Menu, LifeBuoy } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/painel/bell";
import { SupportButton } from "@/components/support-button";

const NAV = [
  { href: "/painel", label: "Início", icon: Home },
  { href: "/painel/captacao", label: "Botões e formulários", icon: MousePointerClick },
  { href: "/painel/contatos", label: "Contatos", icon: Users },
  { href: "/painel/funil", label: "Funil", icon: KanbanSquare },
  { href: "/painel/relatorios", label: "Relatórios", icon: BarChart3 },
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
      <aside className={cn("sticky top-0 z-30 hidden h-dvh flex-col bg-[#0b1220] p-3 text-slate-300 md:flex", small ? "w-[68px]" : "w-60")}>
        <div className={cn("mb-6 flex items-center px-2 pt-2", small ? "justify-center" : "justify-between")}>
          {!small && <Link href="/painel" aria-label="Início"><Logo className="text-white" /></Link>}
          <button onClick={toggle} aria-label={small ? "Abrir menu" : "Recolher menu"} className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white">
            {small ? <Menu size={20} /> : <ChevronsLeft size={18} />}
          </button>
        </div>
        {!small && <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Menu</p>}
        <nav className="space-y-0.5">
          {NAV.map(({ href, label, icon: I }) => (
            <Link key={href} href={href} title={small ? label : undefined}
              className={cn("relative flex items-center gap-3 rounded-lg px-3 py-2 text-[14.5px] font-medium transition-colors",
                small && "justify-center px-0",
                active(href) ? "bg-white/10 text-white before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.5 before:rounded-full before:bg-blue-400" : "hover:bg-white/5 hover:text-white")}>
              <I size={18} className={active(href) ? "text-blue-400" : ""} />{!small && label}
            </Link>
          ))}
        </nav>
        <NotificationBell menu compact={small} className="mt-1" />
        <div className="mt-auto space-y-1">
          {trialText && !small && (
            <div className="mb-2 rounded-xl border border-white/10 bg-gradient-to-br from-blue-500/20 to-violet-500/10 p-3 text-sm">
              <p className="font-semibold text-white">{trialText}</p>
              <p className="mt-0.5 text-xs text-slate-400">Assine para não perder o acesso.</p>
              <Link href="/painel/assinatura" className="mt-2 block rounded-lg bg-blue-500 py-2 text-center font-semibold text-white hover:bg-blue-400">Assinar</Link>
            </div>
          )}
          <Link href="/ajuda" title={small ? "Ajuda" : undefined} className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-[14.5px] hover:bg-white/5 hover:text-white", small && "justify-center px-0")}><LifeBuoy size={18} />{!small && "Ajuda"}</Link>
          {process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP && <span title={small ? "Fale com o suporte" : undefined}><SupportButton plain compact={small} className={cn("w-full gap-3 px-3 py-2 text-[14.5px] font-normal hover:bg-white/5 hover:text-white", small && "justify-center px-0")} /></span>}
          <Link href="/painel/assinatura" title={small ? "Assinatura" : undefined} className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-[14.5px] hover:bg-white/5 hover:text-white", small && "justify-center px-0")}><CreditCard size={18} />{!small && "Assinatura"}</Link>
          <ThemeToggle compact={small} className={cn("w-full py-2 text-[14.5px] text-slate-300 hover:bg-white/5 hover:text-white", small && "justify-center px-0")} />
          <form action={signOut}><button title={small ? "Sair" : undefined} className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[14.5px] hover:bg-white/5 hover:text-white", small && "justify-center px-0")}><LogOut size={18} />{!small && "Sair"}</button></form>
        </div>
      </aside>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-line bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
        {[NAV[0], NAV[2], NAV[3], NAV[5]].map(({ href, label, icon: I }) => (
          <Link key={href} href={href} className={cn("flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs", active(href) ? "text-primary" : "text-mute")}>
            <I size={20} />{href === "/painel/configuracoes" ? "Mais" : label}
          </Link>
        ))}
      </nav>
    </>
  );
}
