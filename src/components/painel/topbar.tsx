"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Home, MousePointerClick, Users, KanbanSquare, BarChart3, Settings, CreditCard, LogOut, LifeBuoy, ChevronDown, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
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
const circle = "grid size-10 place-items-center rounded-full border border-line bg-card text-ink transition-colors hover:border-primary/40 hover:text-primary";

function UserMenu({ name, email, signOut, superAdmin }: { name: string; email: string; signOut: () => Promise<void>; superAdmin?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close); return () => document.removeEventListener("mousedown", close);
  }, [open]);
  const item = "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ink hover:bg-bg";
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Menu da conta" className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 hover:bg-bg">
        <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white">{(name || email).charAt(0).toUpperCase()}</span>
        <span className="hidden text-left leading-tight xl:block">
          <span className="block max-w-36 truncate text-sm font-semibold">{name || "Minha conta"}</span>
          <span className="block max-w-36 truncate text-xs text-mute">{email}</span>
        </span>
        <ChevronDown size={16} className="hidden text-mute xl:block" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-60 rounded-2xl border border-line bg-card p-2 shadow-2xl" onClick={() => setOpen(false)}>
          {superAdmin && <Link href="/painel/admin" className={item}><Crown size={17} />Painel do dono</Link>}
          <Link href="/painel/assinatura" className={item}><CreditCard size={17} />Assinatura</Link>
          <Link href="/ajuda" className={item}><LifeBuoy size={17} />Central de ajuda</Link>
          {process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP && <SupportButton plain className={cn(item, "font-medium")} />}
          <ThemeToggle className={cn(item, "py-2 text-sm")} />
          <div className="my-1 border-t border-line" />
          <form action={signOut}><button className={cn(item, "text-red-700")}><LogOut size={17} />Sair</button></form>
        </div>
      )}
    </div>
  );
}

export function Topbar({ trialText, name, email, signOut, superAdmin }: { trialText: string | null; name: string; email: string; signOut: () => Promise<void>; superAdmin?: boolean }) {
  const path = usePathname();
  const active = (h: string) => (h === "/painel" ? path === h : path.startsWith(h));
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-card/90 backdrop-blur">
        <div className="flex h-16 items-center gap-4 px-4 md:px-6 xl:px-8">
          <Link href="/painel" aria-label="Início" className="shrink-0"><Logo /></Link>
          <nav className="mx-auto hidden items-center gap-1 rounded-full border border-line bg-bg p-1 md:flex">
            {NAV.map(({ href, label, icon: I }) => (
              <Link key={href} href={href} title={label}
                className={cn("flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold transition-colors xl:px-4",
                  active(href) ? "bg-primary text-white shadow-sm shadow-primary/30" : "text-mute hover:text-ink")}>
                <I size={16} className="xl:hidden" /><span className="hidden xl:inline">{label}</span>
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2 md:ml-0">
            {trialText && <Link href="/painel/assinatura" className="hidden rounded-full bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary 2xl:block">{trialText}</Link>}
            <Link href="/ajuda" aria-label="Ajuda" title="Ajuda" className={cn(circle, "hidden sm:grid")}><LifeBuoy size={18} /></Link>
            <NotificationBell />
            <UserMenu name={name} email={email} signOut={signOut} superAdmin={superAdmin} />
          </div>
        </div>
      </header>
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
