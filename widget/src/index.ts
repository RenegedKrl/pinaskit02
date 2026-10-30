// Pinas Kit — script de instalação.
// <script async src="https://SEU-DOMINIO/w.js" data-pk="CHAVE" data-api="https://PROJETO.supabase.co/functions/v1"></script>
import { mergeConfig, Mode } from "../../supabase/functions/_shared/widget-config";
import { attribution, Ctx, flush, ids, rulesPass, track } from "./core";
import { connectForm, existingForms as forms, mountButton, mountPageForm } from "./ui";

declare global { interface Window { __pinas?: boolean; PinasKitConsent?: boolean } }

(function () {
  const s = document.currentScript as HTMLScriptElement | null;
  if (!s || window.__pinas) return;
  const key = s.getAttribute("data-pk");
  const api = (s.getAttribute("data-api") || "").replace(/\/$/, "");
  if (!key || !api) return;
  window.__pinas = true;
  attribution();
  const { vid, sid } = ids();
  const base = { key, api, vid, sid };
  track(base, "pageview");

  fetch(`${api}/w-config?k=${encodeURIComponent(key)}`)
    .then((r) => r.json())
    .then((d: { ok: boolean; mode: Mode; capture: boolean; config: unknown }) => {
      if (!d.ok) return;
      const ctx: Ctx = { ...base, cfg: mergeConfig(d.config), capture: d.capture, renderedAt: Date.now() };
      const start = () => {
        const found = forms();
        if (found.length) track(ctx, "form_detected", { existing: found.length, ids: found.slice(0, 5).map((f) => f.id || f.getAttribute("name") || "") });
        let page: HTMLElement | null = null;
        if (d.mode !== "button" && d.capture && rulesPass(ctx.cfg.formRules)) {
          const ex = ctx.cfg.form.existing;
          // Com seletor e sem "replace": só escuta o formulário do site ("connect" é o valor antigo).
          if (ex.selector && ex.action !== "replace") connectForm(ctx);
          else page = mountPageForm(ctx);
        }
        if (d.mode !== "form" && rulesPass(ctx.cfg.buttonRules)) mountButton(ctx, page);
      };
      if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
      else start();
    })
    .catch(() => {});

  addEventListener("pagehide", () => flush(base));
  addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flush(base); });
})();

