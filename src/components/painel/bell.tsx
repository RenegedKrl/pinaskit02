"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, BellRing } from "lucide-react";
import { getNotifications, markNotificationsSeen, type Notifications } from "@/app/painel/avisos-actions";
import { cn, dateTime } from "@/lib/utils";

/** Sininho de avisos: contatos novos desde a última olhada e retornos de hoje. Atualiza a cada minuto. */
export function NotificationBell({ compact, className = "" }: { compact?: boolean; className?: string }) {
  const [data, setData] = useState<Notifications | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const load = useCallback(() => { getNotifications().then(setData).catch(() => {}); }, []);

  useEffect(() => {
    load();
    const t = window.setInterval(() => { if (document.visibilityState === "visible") load(); }, 60_000);
    return () => window.clearInterval(t);
  }, [load]);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close); return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const count = (data?.newCount ?? 0) + (data?.followups ?? 0);
  function toggle() {
    const next = !open; setOpen(next);
    if (next && data?.newCount) markNotificationsSeen().catch(() => {}); // abriu = viu (o contador zera na próxima atualização)
    if (!next) load();
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button onClick={toggle} aria-label={`Avisos${count ? `: ${count} novos` : ""}`} aria-expanded={open}
        className={cn("relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[14.5px] font-medium hover:bg-white/5 hover:text-white", compact && "justify-center px-0")}>
        {count ? <BellRing size={18} className="text-amber-300" /> : <Bell size={18} />}{!compact && "Avisos"}
        {count > 0 && <span className={cn("grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white", compact ? "absolute -right-0.5 -top-0.5" : "ml-auto")}>{count > 99 ? "99+" : count}</span>}
      </button>
      {open && (
        <div className="absolute left-full top-0 z-50 ml-2 w-80 rounded-xl border border-line bg-card p-2 text-ink shadow-2xl max-md:left-auto max-md:right-0 max-md:top-full max-md:mt-2 max-md:ml-0">
          <p className="px-2 pb-1 pt-1 text-xs font-semibold uppercase tracking-wide text-mute">Avisos</p>
          {!!data?.followups && (
            <Link href="/painel/contatos?retorno=pendente" onClick={() => setOpen(false)} className="mb-1 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900 hover:brightness-95">
              <BellRing size={15} />{data.followups} {data.followups === 1 ? "retorno para hoje" : "retornos para hoje"}
            </Link>
          )}
          {data?.leads.length ? data.leads.map((l) => (
            <Link key={l.id} href={`/painel/contatos/${l.id}`} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 hover:bg-bg">
              <p className="text-sm font-semibold">Novo contato: {l.name || "Sem nome"}</p>
              <p className="text-xs text-mute">{l.source_label || "Acesso direto"} · {dateTime(l.created_at)}</p>
            </Link>
          )) : !data?.followups && <p className="px-3 py-4 text-center text-sm text-mute">Nenhum aviso novo. Quando chegar um contato, ele aparece aqui.</p>}
          {(data?.newCount ?? 0) > (data?.leads.length ?? 0) && <Link href="/painel/contatos" onClick={() => setOpen(false)} className="block px-3 py-2 text-sm font-semibold text-primary">Ver todos os {data!.newCount} novos</Link>}
        </div>
      )}
    </div>
  );
}
