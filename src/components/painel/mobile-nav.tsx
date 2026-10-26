"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { isActive, MOBILE, NAV, NAV_GROUPS } from "./nav";

/** Barra de baixo no celular: 3 atalhos + "Mais", que abre todas as telas. */
export function MobileNav() {
  const path = usePathname(); const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  const quick = MOBILE.map((h) => NAV.find((n) => n.href === h)!);
  const moreActive = !quick.some((n) => isActive(path, n.href));
  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 md:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-card p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between"><p className="font-display font-semibold">Todas as telas</p>
              <button onClick={() => setOpen(false)} aria-label="Fechar" className="rounded-full p-1.5 text-mute hover:bg-bg"><X size={18} /></button></div>
            {NAV_GROUPS.map((g) => (
              <div key={g.title} className="mb-3"><p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-mute">{g.title}</p>
                <div className="grid grid-cols-3 gap-2">{g.items.map(({ href, label, icon: I }) => (
                  <Link key={href} href={href} className={cn("flex flex-col items-center gap-1 rounded-2xl border p-3 text-center text-xs font-medium", isActive(path, href) ? "border-primary bg-primary-soft text-primary" : "border-line")}>
                    <I size={20} />{label}
                  </Link>
                ))}</div></div>
            ))}
          </div>
        </div>
      )}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-line bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
        {quick.map(({ href, label, icon: I }) => (
          <Link key={href} href={href} className={cn("flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs", isActive(path, href) ? "text-primary" : "text-mute")}><I size={20} />{label}</Link>
        ))}
        <button type="button" onClick={() => setOpen(true)} className={cn("flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs", moreActive ? "text-primary" : "text-mute")}><LayoutGrid size={20} />Mais</button>
      </nav>
    </>
  );
}
