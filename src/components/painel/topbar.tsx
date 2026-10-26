"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CreditCard, LogOut, LifeBuoy, ChevronDown, Crown } from "lucide-react";
import { isActive, NAV } from "./nav";
import { MobileNav } from "./mobile-nav";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/painel/bell";
import { SupportButton } from "@/components/support-button";

const TOP = NAV.filter((n) => n.top);
const MORE = NAV.filter((n) => !n.top);

/** "Mais ▾": telas que não cabem nas abas. */
function MoreMenu({ path }: { path: string }) {
  const [open, setOpen] = useState(false); const ref = useRef<HTMLDivElement>(null);
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close); return () => document.removeEventListener("mousedown", close);
  }, [open]);
  const on = MORE.some((n) => isActive(path, n.href));
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className={cn("flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold xl:px-4", on ? "bg-primary text-white" : "text-mute hover:text-ink")}>
        Mais<ChevronDown size={15} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-60 rounded-2xl border border-line bg-card p-2 shadow-2xl">
          {MORE.map(({ href, label, icon: I }) => (
            <Link key={href} href={href} className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium", isActive(path, href) ? "bg-primary-soft text-primary" : "text-ink hover:bg-bg")}><I size={17} />{label}</Link>
          ))}
        </div>
      )}
    </div>
  );
}
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
  const active = (h: string) => isActive(path, h);
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-card/90 backdrop-blur">
        <div className="flex h-16 items-center gap-4 px-4 md:px-6 xl:px-8">
          <Link href="/painel/hoje" aria-label="Meu dia" className="shrink-0"><Logo /></Link>
          <nav className="mx-auto hidden items-center gap-1 rounded-full border border-line bg-bg p-1 md:flex">
            {TOP.map(({ href, label, icon: I }) => (
              <Link key={href} href={href} title={label}
                className={cn("flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold transition-colors xl:px-4",
                  active(href) ? "bg-primary text-white shadow-sm shadow-primary/30" : "text-mute hover:text-ink")}>
                <I size={16} className="xl:hidden" /><span className="hidden xl:inline">{label}</span>
              </Link>
            ))}
            <MoreMenu path={path} />
          </nav>
          <div className="ml-auto flex items-center gap-2 md:ml-0">
            {trialText && <Link href="/painel/assinatura" className="hidden rounded-full bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary 2xl:block">{trialText}</Link>}
            <Link href="/ajuda" aria-label="Ajuda" title="Ajuda" className={cn(circle, "hidden sm:grid")}><LifeBuoy size={18} /></Link>
            <NotificationBell />
            <UserMenu name={name} email={email} signOut={signOut} superAdmin={superAdmin} />
          </div>
        </div>
      </header>
      <MobileNav />
    </>
  );
}
