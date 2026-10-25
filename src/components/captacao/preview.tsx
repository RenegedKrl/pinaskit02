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
                <svg viewBox="0 0 24 24" width="24" height="24" fill="#fff" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" /></svg>
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
