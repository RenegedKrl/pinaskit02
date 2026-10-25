"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, MessageSquareText } from "lucide-react";
import { fillTemplate } from "@/lib/messages";

export interface Template { id: string; name: string; body: string }

/** "Mensagem pronta": escolhe um modelo e abre o WhatsApp com o texto já preenchido para este contato. */
export function TemplateMenu({ phone, lead, templates }: { phone: string; lead: { name: string | null; source_label: string | null }; templates: Template[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close); return () => document.removeEventListener("mousedown", close);
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="inline-flex h-11 items-center gap-2 rounded-lg border border-line bg-card px-4 font-semibold hover:bg-bg">
        <MessageSquareText size={18} />Mensagem pronta<ChevronDown size={16} />
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-80 rounded-xl border border-line bg-card p-2 shadow-xl">
          {templates.length ? templates.map((t) => {
            const text = fillTemplate(t.body, lead);
            return (
              <a key={t.id} href={`https://wa.me/${phone}?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener" onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 hover:bg-bg">
                <p className="text-sm font-semibold">{t.name}</p>
                <p className="line-clamp-2 text-xs text-mute">{text}</p>
              </a>
            );
          }) : <p className="px-3 py-2 text-sm text-mute">Você ainda não criou mensagens prontas.</p>}
          <Link href="/painel/configuracoes#mensagens" className="mt-1 block border-t border-line px-3 pt-2 text-sm font-semibold text-primary">Gerenciar mensagens prontas</Link>
        </div>
      )}
    </div>
  );
}
