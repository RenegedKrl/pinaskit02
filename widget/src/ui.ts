// Renderização: campos, formulário, botão flutuante e posicionamento antes do rodapé.
import { Ctx, LeadData, luminance, runAction, sendLead, track } from "./core";

const WA = '<svg viewBox="0 0 24 24" width="28" height="28" fill="#fff" aria-hidden="true"><path d="M12.04 2a9.9 9.9 0 0 0-8.6 14.86L2 22l5.25-1.38A9.9 9.9 0 1 0 12.04 2zm5.43 12.38c-.29-.15-1.7-.84-1.96-.93-.26-.1-.45-.15-.64.14-.19.29-.74.93-.9 1.12-.17.19-.33.21-.62.07a7.9 7.9 0 0 1-3.94-3.45c-.3-.5.3-.47.85-1.56.1-.19.05-.36-.02-.51-.07-.15-.64-1.55-.88-2.12-.23-.55-.47-.48-.64-.49h-.55c-.19 0-.51.07-.77.36-.26.29-1.01.99-1.01 2.41s1.04 2.79 1.18 2.98c.15.19 2.04 3.12 4.95 4.37 1.84.8 2.56.86 3.48.73.56-.08 1.7-.7 1.94-1.36.24-.67.24-1.24.17-1.36-.07-.12-.26-.19-.55-.34z"/></svg>';

const CODES: Array<[string, string]> = [["BR", "55"], ["PT", "351"], ["US", "1"], ["AR", "54"], ["MX", "52"], ["ES", "34"]];

export function css(color: string, dark: boolean): string {
  const bg = dark ? "#17151f" : "#fff", fg = dark ? "#f4f3f8" : "#18152c", mute = dark ? "#b7b3c6" : "#57536b",
    line = dark ? "#3a3648" : "#dcd9e6", field = dark ? "#211e2b" : "#fff";
  return `:host{all:initial;font-family:inherit}*{box-sizing:border-box;font-family:inherit}
.c{background:${bg};color:${fg};border-radius:16px;padding:20px;font-size:15px;line-height:1.45}
h3{margin:0 0 4px;font-size:20px;font-weight:700}p{margin:0 0 14px;color:${mute}}
label{display:block;font-size:13px;font-weight:600;margin:10px 0 4px}
input,select,textarea{width:100%;font-size:16px;padding:11px 12px;border:1px solid ${line};border-radius:10px;background:${field};color:${fg};outline:none}
input:focus,select:focus,textarea:focus{border-color:${color};box-shadow:0 0 0 3px ${color}33}
.ph{display:flex;gap:6px}.ph select{width:96px;flex:none}
.ck{display:flex;gap:8px;align-items:flex-start;font-size:13px;font-weight:400;color:${mute}}.ck input{width:auto;margin-top:3px}
button.s{margin-top:16px;width:100%;min-height:46px;border:0;border-radius:999px;background:${color};color:#fff;font-size:16px;font-weight:700;cursor:pointer}
button.s:disabled{opacity:.6}.e{color:#dc2626;font-size:13px;margin-top:8px;min-height:1em}.ok{font-weight:600}
.hp{position:absolute;left:-9999px;opacity:0;height:0;width:0}
.fab{position:fixed;bottom:20px;width:60px;height:60px;border-radius:50%;border:0;background:${color};cursor:pointer;display:grid;place-items:center;box-shadow:0 6px 20px rgba(0,0,0,.2);z-index:2147483000}
.dot{position:absolute;top:4px;right:4px;width:12px;height:12px;border-radius:50%;background:#10b981;border:2px solid #fff}
.bal{position:fixed;bottom:92px;width:320px;max-width:calc(100vw - 32px);box-shadow:0 12px 40px rgba(0,0,0,.18);z-index:2147483000}
.x{position:absolute;top:8px;right:10px;border:0;background:none;font-size:20px;color:${mute};cursor:pointer}
.at{display:flex;gap:10px;align-items:center;margin-bottom:8px}.at img,.at span{width:36px;height:36px;border-radius:50%;object-fit:cover;background:${color}22;display:grid;place-items:center;font-weight:700}
a.cta{display:block;text-align:center;margin-top:12px;padding:12px;border-radius:999px;background:${color};color:#fff;font-weight:700;text-decoration:none}
@media(min-width:760px){.g{display:grid;grid-template-columns:1fr 1.2fr;gap:28px;align-items:start}}`;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, html = ""): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (html) e.innerHTML = html;
  return e;
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

/** Cria o formulário (página ou balão). */
export function buildForm(ctx: Ctx, method: LeadData["method"], compact: boolean): HTMLFormElement {
  const f = ctx.cfg.form;
  const form = el("form", { novalidate: "" });
  let h = compact ? "" : `<h3>${esc(f.title)}</h3><p>${esc(f.description)}</p>`;
  h += '<input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">';
  if (f.askName) h += '<label>Seu nome<input name="name" autocomplete="name" required></label>';
  h += `<label>Seu WhatsApp<div class="ph"><select name="ddi" aria-label="País">${CODES.map(([c, d]) => `<option value="${d}">${c} +${d}</option>`).join("")}</select><input name="phone" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="(11) 99999-9999" required></div></label>`;
  if (f.askEmail) h += '<label>Seu e-mail<input name="email" type="email" autocomplete="email"></label>';
  if (f.question.enabled && !compact) {
    h += `<label>${esc(f.question.label)}<select name="option"><option value="">Selecione</option>${f.question.options.map((o) => `<option>${esc(o.label)}</option>`).join("")}</select></label>`;
  }
  if (f.askMessage && !compact) h += '<label>Mensagem<textarea name="message" rows="3"></textarea></label>';
  if (f.consent) h += '<label class="ck"><input type="checkbox" name="consent" required> Concordo em ser contatado e com o uso dos meus dados para atendimento.</label>';
  h += `<button class="s" type="submit">${esc(f.submitLabel)}</button><div class="e" role="alert"></div>`;
  form.innerHTML = h;

  const phone = form.querySelector<HTMLInputElement>('[name="phone"]')!;
  const ddi = form.querySelector<HTMLSelectElement>('[name="ddi"]')!;
  phone.addEventListener("input", () => {
    if (ddi.value !== "55") return;
    const d = phone.value.replace(/\D/g, "").slice(0, 11);
    phone.value = d.length > 6 ? `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}` : d.length > 2 ? `(${d.slice(0, 2)}) ${d.slice(2)}` : d;
  });
  let viewed = false;
  form.addEventListener("focusin", () => { if (!viewed) { viewed = true; track(ctx, "form_view", { method }); } });

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const err = form.querySelector<HTMLDivElement>(".e")!;
    const btn = form.querySelector<HTMLButtonElement>("button.s")!;
    const v = (n: string) => (form.querySelector<HTMLInputElement>(`[name="${n}"]`)?.value || "").trim();
    const digits = v("phone").replace(/\D/g, "");
    err.textContent = "";
    if (f.askName && v("name").length < 2) return void (err.textContent = "Informe seu nome.");
    if (ddi.value === "55" ? !/^\d{10,11}$/.test(digits) : digits.length < 6) return void (err.textContent = "Informe um WhatsApp válido, com DDD.");
    if (v("email") && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v("email"))) return void (err.textContent = "E-mail inválido.");
    const consent = form.querySelector<HTMLInputElement>('[name="consent"]');
    if (consent && !consent.checked) return void (err.textContent = "Marque a autorização para continuar.");
    btn.disabled = true; btn.textContent = "Enviando…";
    const win = ctx.cfg.after.type === "whatsapp" ? window.open("", "_blank") : null;
    try {
      const a = await sendLead(ctx, {
        name: v("name"), phone: ddi.value + digits, email: v("email"), option: v("option"), message: v("message"),
        consent: !!consent?.checked, method, hp: v("website"),
      });
      const msg = runAction(a, win);
      if (msg !== null) form.innerHTML = `<p class="ok">${esc(msg)}</p>`;
      else { btn.disabled = false; btn.textContent = f.submitLabel; }
    } catch {
      if (win) win.close();
      btn.disabled = false; btn.textContent = f.submitLabel;
      err.textContent = "Não foi possível enviar. Tente novamente.";
    }
  });
  return form;
}

function shadowHost(id: string, style: string): [HTMLElement, ShadowRoot] {
  const host = el("div", { id, "data-pinas": "" });
  const root = host.attachShadow({ mode: "open" });
  root.appendChild(el("style", {}, style));
  return [host, root];
}

/** Lugar do formulário: marcador > seletor > footer > nome de rodapé > main/body. */
export function findAnchor(insertBefore: string): { node: Element; where: "inside" | "before" | "end"; how: string } {
  const mark = document.querySelector("[data-pinas-form]");
  if (mark) return { node: mark, where: "inside", how: "marcador" };
  if (insertBefore) {
    try { const s = document.querySelector(insertBefore); if (s) return { node: s, where: "before", how: "seletor" }; } catch { /* ignore */ }
  }
  const vis = (e: Element) => (e as HTMLElement).offsetParent !== null || getComputedStyle(e).position === "fixed";
  const foot = Array.from(document.querySelectorAll('footer,[role="contentinfo"]')).filter((e) => vis(e) && !e.closest("[data-pinas]"));
  if (foot.length) {
    // usa o rodapé mais externo entre os últimos
    let f = foot[foot.length - 1];
    while (f.parentElement && f.parentElement.closest('footer,[role="contentinfo"]')) f = f.parentElement.closest('footer,[role="contentinfo"]')!;
    return { node: f, where: "before", how: "rodapé" };
  }
  const named = Array.from(document.querySelectorAll('[id*="footer" i],[class*="footer" i],[id*="rodape" i],[class*="rodape" i]')).filter(vis);
  if (named.length) {
    let n = named[named.length - 1];
    while (n.parentElement && n.parentElement !== document.body && /footer|rodape/i.test(n.parentElement.id + " " + n.parentElement.className)) n = n.parentElement;
    return { node: n, where: "before", how: "nome do rodapé" };
  }
  return { node: document.querySelector("main") || document.body, where: "end", how: "fim da página" };
}

/** Formulários que o site já tem (com telefone ou e-mail). */
export function existingForms(): HTMLFormElement[] {
  return Array.from(document.querySelectorAll("form")).filter((f) =>
    !f.closest("[data-pinas]") && f.querySelector('input[type="tel"],input[type="email"],input[name*="phone" i],input[name*="tel" i],input[name*="whats" i]'));
}

export function mountPageForm(ctx: Ctx): HTMLElement | null {
  const f = ctx.cfg.form;
  let ref: Element | null = null;
  if (f.existing.action !== "add" && f.existing.selector) {
    try { ref = document.querySelector(f.existing.selector); } catch { /* ignore */ }
  }
  if (f.existing.action === "connect") return null;
  const a = ref ? { node: ref, where: "before" as const, how: "substituindo formulário" } : findAnchor(f.insertBefore);
  const dark = f.theme === "dark" || (f.theme === "auto" && luminance(a.node.parentElement || document.body) < 0.45);
  const [host, root] = shadowHost("pinas-form", css(ctx.cfg.color, dark) + ":host{display:block;margin:48px auto;padding:0 16px}");
  let max = 640;
  if (f.width === "content") {
    const inner = (a.node.firstElementChild || a.node).getBoundingClientRect().width;
    if (inner > 320) max = Math.min(inner, 1200);
  }
  host.style.maxWidth = max + "px";
  const card = el("div", { class: "c" });
  const form = buildForm(ctx, "page_form", false);
  if (max >= 760) {
    const g = el("div", { class: "g" });
    const intro = el("div", {}, `<h3>${esc(f.title)}</h3><p>${esc(f.description)}</p>`);
    form.querySelector("h3")?.remove(); form.querySelector("p")?.remove();
    g.append(intro, form); card.appendChild(g);
  } else card.appendChild(form);
  root.appendChild(card);
  if (a.where === "inside") a.node.appendChild(host);
  else if (a.where === "before") a.node.parentNode!.insertBefore(host, a.node);
  else a.node.appendChild(host);
  if (ref && f.existing.action === "replace") (ref as HTMLElement).style.display = "none";
  track(ctx, "form_detected", { placed: a.how });
  return host;
}

/** Modo "conectar": escuta o formulário do cliente e envia uma cópia. */
export function connectForm(ctx: Ctx) {
  const sel = ctx.cfg.form.existing.selector;
  let f: HTMLFormElement | null = null;
  try { f = sel ? document.querySelector<HTMLFormElement>(sel) : null; } catch { /* ignore */ }
  if (!f) return;
  f.addEventListener("submit", () => {
    const pick = (q: string) => (f!.querySelector<HTMLInputElement>(q)?.value || "").trim();
    const phone = pick('input[type="tel"],input[name*="whats" i],input[name*="phone" i],input[name*="tel" i],input[name*="celular" i]').replace(/\D/g, "");
    if (phone.length < 8) return;
    sendLead(ctx, {
      method: "connected_form", phone: phone.length <= 11 ? "55" + phone : phone,
      name: pick('input[autocomplete="name"],input[name*="name" i],input[name*="nome" i]'),
      email: pick('input[type="email"],input[name*="mail" i]'),
      message: pick("textarea"),
    }).catch(() => {});
  });
}

export function mountButton(ctx: Ctx, pageForm: HTMLElement | null) {
  const c = ctx.cfg;
  const side = c.position === "left" ? "left" : "right";
  const [host, root] = shadowHost("pinas-btn", css(c.color, false) + `.fab,.bal{${side}:20px}`);
  const fab = el("button", { class: "fab", "aria-label": c.label }, WA + (c.online ? '<i class="dot"></i>' : ""));
  root.appendChild(fab);
  const direct = `${ctx.api}/b-redirect?k=${encodeURIComponent(ctx.key)}&vid=${ctx.vid}&src=w`;
  let bal: HTMLElement | null = null;

  const open = () => {
    if (bal) { bal.remove(); bal = null; return; }
    bal = el("div", { class: "bal c", role: "dialog", "aria-label": c.label });
    const close = el("button", { class: "x", "aria-label": "Fechar" }, "×");
    close.onclick = () => { bal?.remove(); bal = null; };
    bal.appendChild(close);
    const av = c.attendantAvatar ? `<img src="${esc(c.attendantAvatar)}" alt="">` : c.attendantName ? `<span>${esc(c.attendantName[0])}</span>` : "";
    bal.appendChild(el("div", { class: "at" }, `${av}<div><strong>${esc(c.attendantName || c.greeting)}</strong></div>`));
    if (c.attendantName) bal.appendChild(el("p", {}, esc(c.greeting)));
    if (ctx.capture && c.buttonForm) bal.appendChild(buildForm(ctx, "button_form", true));
    else {
      const a = el("a", { class: "cta", href: direct, target: "_blank", rel: "noopener" }, esc(c.label));
      a.onclick = () => track(ctx, "click", { via: "balloon" });
      bal.appendChild(a);
    }
    root.appendChild(bal);
  };

  fab.onclick = () => {
    const action = pageForm ? c.buttonClick : c.buttonForm || c.greeting ? "miniform" : "whatsapp";
    if (action === "scroll" && pageForm) {
      pageForm.scrollIntoView({ behavior: "smooth", block: "center" });
      (pageForm.shadowRoot?.querySelector("input:not(.hp)") as HTMLInputElement | null)?.focus({ preventScroll: true });
    } else if (action === "whatsapp" || !ctx.capture) {
      track(ctx, "click", { via: "fab" });
      window.open(direct, "_blank", "noopener");
    } else open();
  };

  if (pageForm && "IntersectionObserver" in window) {
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && bal) { bal.remove(); bal = null; }
      host.style.display = e.isIntersecting ? "none" : "";
    }, { threshold: 0.25 }).observe(pageForm);
  }
  document.body.appendChild(host);
  track(ctx, "widget_view", {});
}

