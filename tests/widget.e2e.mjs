// Teste do widget no navegador, com a API simulada. Rodar: npm run build:widget && node tests/widget.e2e.mjs
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const W = readFileSync(new URL("../public/w.js", import.meta.url), "utf8");
const API = "https://api.test/functions/v1";
const tag = `<script async src="https://cdn.test/w.js" data-pk="k1" data-api="${API}"></script>`;

async function run(name, { mode, config = {}, body, query = "" }, check) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const leads = [], events = [];
  await page.route("https://cdn.test/w.js", (r) => r.fulfill({ body: W, contentType: "text/javascript" }));
  await page.route(`${API}/**`, async (r) => {
    const u = new URL(r.request().url());
    if (u.pathname.endsWith("/w-config")) return r.fulfill({ json: { ok: true, mode, capture: true, config }, headers: { "access-control-allow-origin": "*" } });
    if (u.pathname.endsWith("/w-lead")) { leads.push(JSON.parse(r.request().postData())); return r.fulfill({ json: { ok: true, action: { type: "message", message: "Recebido!" } }, headers: { "access-control-allow-origin": "*" } }); }
    if (u.pathname.endsWith("/w-events")) { events.push(JSON.parse(r.request().postData())); return r.fulfill({ json: { ok: true }, headers: { "access-control-allow-origin": "*" } }); }
    return r.fulfill({ status: 404, body: "" });
  });
  await page.route("https://site.test/**", (r) => r.fulfill({ contentType: "text/html", body: `<!doctype html><html><head><meta charset="utf-8"></head><body>${body}${tag}</body></html>` }));
  await page.goto("https://site.test/pagina" + query);
  await page.waitForTimeout(600);
  try { await check({ page, leads, events }); console.log("ok  -", name); }
  catch (e) { console.error("FALHOU -", name, "\n", e.message); process.exitCode = 1; }
  finally { await browser.close(); }
}

const fill = async (page, sel = "#pinas-form") => {
  const f = page.locator(sel);
  await f.locator('input[name="name"]').fill("Maria Teste");
  await f.locator('input[name="phone"]').fill("11987654321");
  const ck = f.locator('input[name="consent"]');
  if (await ck.count()) await ck.check();
  await f.locator("button.s").click();
};

await run("modo both: formulário antes do rodapé + botão + UTM", {
  mode: "both", body: `<main><h1>Oi</h1><p style="height:1500px">texto</p></main><footer id="rod">Rodapé</footer>`,
  query: "?utm_source=google&utm_medium=cpc&utm_campaign=promo&gclid=abc123",
}, async ({ page, leads }) => {
  const order = await page.evaluate(() => { const f = document.getElementById("pinas-form"); return f && f.nextElementSibling?.id; });
  assert.equal(order, "rod", "formulário deve ficar logo antes do <footer>");
  assert.equal(await page.locator("#pinas-btn").count(), 1, "botão deve existir");
  await fill(page);
  await page.waitForTimeout(400);
  assert.equal(leads.length, 1);
  assert.equal(leads[0].method, "page_form");
  assert.equal(leads[0].phone, "5511987654321");
  assert.equal(leads[0].attr.last.utm_source, "google");
  assert.equal(leads[0].attr.last.click_ids.gclid, "abc123");
  assert.match(await page.locator("#pinas-form .ok").innerText(), /Recebido!/);
});

await run("modo form: sem rodapé, entra no fim do <main>", {
  mode: "form", body: `<main id="m"><h1>Oi</h1></main><div class="copy">© site</div>`,
}, async ({ page }) => {
  assert.equal(await page.locator("#pinas-btn").count(), 0, "não deve ter botão");
  const parent = await page.evaluate(() => document.getElementById("pinas-form")?.parentElement?.id);
  assert.equal(parent, "m");
});

await run("rodapé por classe (div.site-footer)", {
  mode: "form", body: `<div><p>conteúdo</p></div><div class="site-footer" id="sf">rodapé</div>`,
}, async ({ page }) => {
  assert.equal(await page.evaluate(() => document.getElementById("pinas-form")?.nextElementSibling?.id), "sf");
});

await run("marcador data-pinas-form tem prioridade", {
  mode: "form", body: `<section><div id="aqui" data-pinas-form></div></section><footer>r</footer>`,
}, async ({ page }) => {
  assert.equal(await page.evaluate(() => document.getElementById("pinas-form")?.parentElement?.id), "aqui");
});

await run("modo button: sem formulário na página", {
  mode: "button", body: `<main>x</main><footer>r</footer>`,
}, async ({ page }) => {
  assert.equal(await page.locator("#pinas-form").count(), 0);
  assert.equal(await page.locator("#pinas-btn").count(), 1);
});

await run("conectar formulário existente: envia cópia do contato", {
  mode: "form", config: { form: { existing: { action: "connect", selector: "#contato" } } },
  body: `<form id="contato" onsubmit="event.preventDefault()"><input name="nome"><input type="tel" name="telefone"><button>Enviar</button></form><footer>r</footer>`,
}, async ({ page, leads, events }) => {
  assert.equal(await page.locator("#pinas-form").count(), 0, "não deve criar outro formulário");
  await page.fill('#contato input[name="nome"]', "João");
  await page.fill('#contato input[name="telefone"]', "(21) 99876-5432");
  await page.click("#contato button");
  await page.waitForTimeout(1200);
  assert.equal(leads.length, 1);
  assert.equal(leads[0].method, "connected_form");
  assert.equal(leads[0].phone, "5521998765432");
  assert.equal(leads[0].name, "João");
  const all = events.flatMap((e) => e.events ?? e.e ?? []);
  assert.ok(all.some((e) => e.type === "form_detected"), "deve registrar form_detected");
});

await run("validação: telefone inválido não envia", {
  mode: "form", body: `<main>x</main><footer>r</footer>`,
}, async ({ page, leads }) => {
  const f = page.locator("#pinas-form");
  await f.locator('input[name="name"]').fill("Ana");
  await f.locator('input[name="phone"]').fill("123");
  if (await f.locator('input[name="consent"]').count()) await f.locator('input[name="consent"]').check();
  await f.locator("button.s").click();
  await page.waitForTimeout(300);
  assert.equal(leads.length, 0);
  assert.match(await f.locator(".e").innerText(), /WhatsApp válido/);
});

// Estruturas reais de plataformas (marcação típica gerada por cada uma)
const before = (page, id) => page.evaluate((x) => document.getElementById("pinas-form")?.nextElementSibling?.id === x, id);

await run("WordPress tema clássico (#colophon.site-footer)", {
  mode: "both",
  body: `<div id="page" class="site"><header id="masthead" class="site-header">menu</header><div id="content" class="site-content"><main id="main" class="site-main"><article>post</article></main></div><footer id="colophon" class="site-footer" role="contentinfo"><div class="site-info">© loja</div></footer></div>`,
}, async ({ page }) => {
  assert.ok(await before(page, "colophon"), "formulário deveria entrar antes do #colophon");
  assert.equal(await page.locator("#pinas-btn").count(), 1);
});

await run("WordPress tema de blocos (footer.wp-block-template-part)", {
  mode: "form",
  body: `<div class="wp-site-blocks"><header class="wp-block-template-part">topo</header><main class="wp-block-group"><p>conteúdo</p></main><footer id="wpf" class="wp-block-template-part"><div class="wp-block-group">rodapé</div></footer></div>`,
}, async ({ page }) => { assert.ok(await before(page, "wpf")); });

await run("Elementor (rodapé sem tag <footer>)", {
  mode: "form",
  body: `<div class="elementor elementor-location-header" data-elementor-type="header">topo</div><div class="elementor" data-elementor-type="wp-page"><section class="elementor-section">página</section></div><div id="elf" class="elementor elementor-location-footer" data-elementor-type="footer"><section class="elementor-section"><div class="elementor-container">rodapé</div></section></div>`,
}, async ({ page }) => { assert.ok(await before(page, "elf"), "formulário deveria entrar antes do rodapé do Elementor"); });

await run("Wix (#SITE_FOOTER dentro de #site-root)", {
  mode: "both",
  body: `<div id="SITE_CONTAINER"><div id="main_MF"><div id="site-root"><header id="SITE_HEADER">topo</header><main id="PAGES_CONTAINER"><div id="SITE_PAGES">seção</div></main><footer id="SITE_FOOTER" class="wixui-footer"><div>rodapé</div></footer></div></div></div>`,
}, async ({ page, leads }) => {
  assert.ok(await before(page, "SITE_FOOTER"), "formulário deveria entrar antes do #SITE_FOOTER");
  await fill(page);
  await page.waitForTimeout(400);
  assert.equal(leads.length, 1, "contato deveria ser enviado no Wix");
});

await run("CSS agressivo do site não quebra o formulário", {
  mode: "form",
  body: `<style>*{font-size:40px!important;color:red!important}input,button{display:none!important}</style><main>conteúdo</main><footer id="f2">rodapé</footer>`,
}, async ({ page, leads }) => {
  assert.ok(await before(page, "f2"));
  await fill(page);
  await page.waitForTimeout(400);
  assert.equal(leads.length, 1, "o CSS do site não deveria esconder os campos do formulário");
});

// ---------- Fase 2 ----------
await run("pixels: avisa Meta, GA4, Google Ads e GTM ao enviar", {
  mode: "form", config: { pixels: { meta: true, google: true, adsSendTo: "AW-123456789/AbCdEf" } },
  body: `<script>window.__px=[];window.fbq=(...a)=>__px.push(["fbq",...a]);window.gtag=(...a)=>__px.push(["gtag",...a]);window.dataLayer=[];</script><main>Oi</main><footer>R</footer>`,
}, async ({ page, leads }) => {
  await fill(page);
  await page.waitForTimeout(400);
  assert.equal(leads.length, 1);
  const px = await page.evaluate(() => window.__px);
  assert.deepEqual(px[0], ["fbq", "track", "Lead", { content_name: "page_form" }]);
  assert.deepEqual(px[1], ["gtag", "event", "generate_lead", { method: "page_form" }]);
  assert.deepEqual(px[2], ["gtag", "event", "conversion", { send_to: "AW-123456789/AbCdEf" }]);
  assert.equal(await page.evaluate(() => window.dataLayer[0].event), "pinas_lead");
});

await run("pixels: sem consentimento não dispara nada", {
  mode: "form", config: { pixels: { meta: true, google: true } },
  body: `<script>window.PinasKitConsent=false;window.__px=[];window.fbq=(...a)=>__px.push(a);window.gtag=(...a)=>__px.push(a);</script><main>Oi</main><footer>R</footer>`,
}, async ({ page, leads }) => {
  await fill(page);
  await page.waitForTimeout(400);
  assert.equal(leads.length, 1, "o contato é enviado mesmo assim");
  assert.equal((await page.evaluate(() => window.__px)).length, 0);
});

await run("fora do horário: balão avisa e sem bolinha de online", {
  mode: "button", config: { greeting: "Olá!", buttonForm: true, online: true, hours: { enabled: true, days: [], from: "08:00", to: "18:00", offMessage: "Voltamos às 8h" } },
  body: `<main>Oi</main>`,
}, async ({ page, leads }) => {
  const btn = page.locator("#pinas-btn");
  assert.equal(await btn.locator(".dot").count(), 0, "sem bolinha de online");
  await btn.locator(".fab").click();
  assert.match(await btn.locator(".bal").innerText(), /Voltamos às 8h/);
  await fill(page, "#pinas-btn .bal");
  await page.waitForTimeout(400);
  assert.equal(leads.length, 1, "captura o contato mesmo fora do horário");
});

await run("formulário do site: usa os campos escolhidos no painel", {
  mode: "form", config: { form: { existing: { action: "connect", selector: "#orc", map: { phone: "fone_cliente", name: "quem", email: "", message: "" } } } },
  body: `<form id="orc" onsubmit="event.preventDefault()"><input type="tel" name="fixo" value="1133334444"><input name="quem" value="João Mapeado"><input name="fone_cliente" value="(21) 98888-7777"><button>Enviar</button></form>`,
}, async ({ page, leads }) => {
  await page.locator("#orc button").click();
  await page.waitForTimeout(500);
  assert.equal(leads.length, 1);
  assert.equal(leads[0].phone, "5521988887777", "usou o telefone mapeado, não o primeiro tel da página");
  assert.equal(leads[0].name, "João Mapeado");
});
