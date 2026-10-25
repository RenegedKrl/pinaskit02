"use client";
import { useState } from "react";
import { Monitor, Smartphone } from "lucide-react";
import type { Mode, WidgetConfig } from "@shared/widget-config";

/** Prévia ilustrativa. O teste real é feito no site (Verificar instalação). */
export function Preview({ mode, c }: { mode: Mode; c: WidgetConfig }) {
  const [mobile, setMobile] = useState(false);
  const [open, setOpen] = useState(true);
  const f = c.form;
  const dark = f.theme === "dark";
  const formCard = (compact: boolean) => (
    <div className={`rounded-2xl p-4 text-left ${dark ? "bg-[#17151f] text-white" : "bg-white text-ink"} ${compact ? "" : "shadow-sm"}`}>
      {!compact && <><p className="font-display text-base font-bold">{f.title}</p><p className={`mb-2 text-xs ${dark ? "text-white/70" : "text-mute"}`}>{f.description}</p></>}
      {f.askName && <div className="mb-1.5 rounded-md border border-line px-2 py-1.5 text-xs text-mute">Seu nome</div>}
      <div className="mb-1.5 flex gap-1"><div className="rounded-md border border-line px-2 py-1.5 text-xs text-mute">BR +55</div><div className="flex-1 rounded-md border border-line px-2 py-1.5 text-xs text-mute">Seu WhatsApp</div></div>
      {f.askEmail && <div className="mb-1.5 rounded-md border border-line px-2 py-1.5 text-xs text-mute">Seu e-mail</div>}
      {!compact && f.question.enabled && <div className="mb-1.5 rounded-md border border-line px-2 py-1.5 text-xs text-mute">{f.question.label} ▾</div>}
      {!compact && f.askMessage && <div className="mb-1.5 h-10 rounded-md border border-line px-2 py-1.5 text-xs text-mute">Mensagem</div>}
      {f.consent && <p className={`mb-1.5 text-[10px] ${dark ? "text-white/70" : "text-mute"}`}>☐ Concordo em ser contatado…</p>}
      <div className="rounded-full py-2 text-center text-xs font-bold text-white" style={{ background: c.color }}>{f.submitLabel}</div>
    </div>
  );

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold">Prévia</span>
        <div className="flex gap-1 rounded-lg border border-line bg-white p-0.5">
          <button type="button" aria-label="Computador" onClick={() => setMobile(false)} className={`rounded-md p-1.5 ${!mobile ? "bg-primary-soft text-primary" : "text-mute"}`}><Monitor size={16} /></button>
          <button type="button" aria-label="Celular" onClick={() => setMobile(true)} className={`rounded-md p-1.5 ${mobile ? "bg-primary-soft text-primary" : "text-mute"}`}><Smartphone size={16} /></button>
        </div>
      </div>
      <div className={`mx-auto overflow-hidden rounded-xl border border-line bg-white ${mobile ? "max-w-[300px]" : ""}`}>
        <div className="flex items-center gap-1.5 border-b border-line bg-bg px-3 py-2">
          <i className="size-2.5 rounded-full bg-red-300" /><i className="size-2.5 rounded-full bg-amber-300" /><i className="size-2.5 rounded-full bg-emerald-300" />
          <span className="ml-2 text-xs text-mute">seusite.com.br</span>
        </div>
        <div className={`relative h-[460px] overflow-y-auto ${dark ? "bg-[#221f2c]" : "bg-[#f3f2f7]"}`}>
          <div className="space-y-2 p-4">
            <div className="h-24 rounded-lg bg-black/5" /><div className="h-3 w-2/3 rounded bg-black/10" /><div className="h-3 w-1/2 rounded bg-black/10" />
            <div className="h-16 rounded-lg bg-black/5" />
          </div>
          {mode !== "button" && <div className={`mx-auto px-4 ${f.width === "content" || mobile ? "" : "max-w-[300px]"}`}>{formCard(false)}</div>}
          <div className="mt-4 bg-black/15 p-4 text-center text-[11px] text-black/50">rodapé do site</div>
          {mode !== "form" && (
            <div className={`sticky bottom-0 flex flex-col gap-2 p-3 ${c.position === "left" ? "items-start" : "items-end"}`}>
              {open && (c.greeting || c.buttonForm) && !(mode === "both" && c.buttonClick !== "miniform") && (
                <div className="w-60 rounded-2xl bg-white p-3 text-left text-ink shadow-lg">
                  <p className="mb-2 text-xs font-semibold">{c.attendantName || c.greeting}</p>
                  {c.attendantName && <p className="mb-2 text-xs text-mute">{c.greeting}</p>}
                  {c.buttonForm ? formCard(true) : <div className="rounded-full py-2 text-center text-xs font-bold text-white" style={{ background: c.color }}>{c.label}</div>}
                </div>
              )}
              <button type="button" onClick={() => setOpen(!open)} aria-label="Abrir ou fechar balão" className="relative grid size-12 place-items-center rounded-full text-white shadow-lg" style={{ background: c.color }}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="#fff" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2z" /></svg>
                {c.online && <i className="absolute right-0.5 top-0.5 size-3 rounded-full border-2 border-white bg-emerald-500" />}
              </button>
            </div>
          )}
        </div>
      </div>
      <p className="mt-2 text-xs text-mute">Prévia ilustrativa. No seu site o formulário usa a fonte do site e entra antes do rodapé.</p>
    </div>
  );
}
