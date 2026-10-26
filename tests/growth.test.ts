// Testes da fase 2: valor/motivo, horário, pixels, webhook, importação, e-mails do teste e painel do dono. Rodar: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanExtras, DEFAULT_CONFIG, isOpen, mergeConfig } from "../supabase/functions/_shared/widget-config.ts";
import { dailyDigestEmail, digestWorthSending, installNudgeEmail } from "../supabase/functions/_shared/email.ts";
import { leadPayload, safeWebhookUrl, sign } from "../supabase/functions/_shared/webhook.ts";
import { nudgeDue } from "../supabase/functions/_shared/trial.ts";
import { firePixels } from "../widget/src/core.ts";
import { parseMoney } from "../src/lib/copy.ts";
import { lostReasons } from "../src/lib/report.ts";
import { buildRows, guessFields, normalizePhone, parseCsv } from "../src/lib/csv.ts";
import { isSuperAdmin, mrr, summarize } from "../src/lib/admin-metrics.ts";

// ---------- valor da venda e motivo da perda ----------
test("valor: aceita formato brasileiro e com ponto, recusa lixo e negativo", () => {
  assert.equal(parseMoney("1.500,00"), 1500);
  assert.equal(parseMoney("R$ 2.345,67"), 2345.67);
  assert.equal(parseMoney("1500.5"), 1500.5);
  assert.equal(parseMoney(""), null);
  assert.equal(parseMoney("abc"), null);
  assert.equal(parseMoney("-10"), null);
});

test("motivos de perda: agrupa sem diferenciar maiúsculas, mais frequente primeiro, sem motivo separado", () => {
  const r = lostReasons([{ lost_reason: "Achou caro" }, { lost_reason: "achou caro" }, { lost_reason: null }, { lost_reason: "Sumiu" }]);
  assert.deepEqual(r[0], { reason: "Achou caro", count: 2, pct: 50 });
  assert.ok(r.some((x) => x.reason === "Sem motivo informado" && x.count === 1));
  assert.deepEqual(lostReasons([]), []);
});

// ---------- horário de atendimento ----------
const H = { enabled: true, days: [1, 2, 3, 4, 5], from: "08:00", to: "18:00", offMessage: "" };
test("horário: segunda 10h aberto, 19h fechado, domingo fechado (horário de Brasília)", () => {
  assert.equal(isOpen(H, new Date("2026-10-26T13:00:00Z")), true);   // seg 10:00 BRT
  assert.equal(isOpen(H, new Date("2026-10-26T22:00:00Z")), false);  // seg 19:00 BRT
  assert.equal(isOpen(H, new Date("2026-10-25T13:00:00Z")), false);  // dom
  assert.equal(isOpen({ ...H, enabled: false }, new Date("2026-10-25T13:00:00Z")), true);
});
test("horário: atravessa a meia-noite", () => {
  const n = { ...H, days: [0, 1, 2, 3, 4, 5, 6], from: "18:00", to: "02:00" };
  assert.equal(isOpen(n, new Date("2026-10-27T02:30:00Z")), true);   // 23:30 BRT
  assert.equal(isOpen(n, new Date("2026-10-27T15:00:00Z")), false);  // 12:00 BRT
});

test("config: campos novos ganham padrão e lixo é limpo antes de salvar", () => {
  const m = mergeConfig({ color: "#000" });
  assert.deepEqual(m.hours, DEFAULT_CONFIG.hours);
  assert.equal(m.rotation, false);
  assert.deepEqual(m.form.existing.map, { name: "", phone: "", email: "", message: "" });
  const dirty = mergeConfig({ hours: { enabled: 1, days: [9, 1, 1, -2, 3], from: "25:00", to: "17:30" }, pixels: { meta: "sim", adsSendTo: "javascript:alert(1)" }, rotation: "x" });
  const c = cleanExtras(dirty);
  assert.deepEqual(c.hours.days, [1, 3]);
  assert.equal(c.hours.from, "08:00"); assert.equal(c.hours.to, "17:30");
  assert.equal(c.pixels.adsSendTo, ""); assert.equal(c.pixels.meta, true); assert.equal(c.rotation, true);
  assert.equal(cleanExtras(mergeConfig({ pixels: { adsSendTo: "AW-123456789/AbC-dEf_1" } })).pixels.adsSendTo, "AW-123456789/AbC-dEf_1");
});

// ---------- pixels ----------
test("pixels: dispara só os ligados, só se existirem no site, e respeita o consentimento", () => {
  const calls: unknown[][] = [];
  const win = { fbq: (...a: unknown[]) => calls.push(["fbq", ...a]), gtag: (...a: unknown[]) => calls.push(["gtag", ...a]), dataLayer: [] as unknown[] };
  const cfg = mergeConfig({ pixels: { meta: true, google: true, adsSendTo: "AW-1/abcd" } });
  assert.deepEqual(firePixels(cfg, "page_form", win), ["meta", "ga4", "ads", "gtm"]);
  assert.deepEqual(calls[0], ["fbq", "track", "Lead", { content_name: "page_form" }]);
  assert.deepEqual(calls[2], ["gtag", "event", "conversion", { send_to: "AW-1/abcd" }]);
  assert.deepEqual(win.dataLayer[0], { event: "pinas_lead", pinas_method: "page_form" });
  assert.deepEqual(firePixels(cfg, "page_form", { ...win, PinasKitConsent: false }), []);
  assert.deepEqual(firePixels(mergeConfig({}), "page_form", win), []);
  assert.deepEqual(firePixels(cfg, "x", {}), [], "site sem pixel: não quebra");
  assert.deepEqual(firePixels(cfg, "x", { fbq: () => { throw new Error("pixel quebrado"); } }), [], "erro do pixel não trava o formulário");
});

// ---------- webhook ----------
test("webhook: só https público; bloqueia rede interna", () => {
  assert.equal(safeWebhookUrl("https://hooks.zapier.com/hooks/catch/1/abc"), true);
  assert.equal(safeWebhookUrl("https://script.google.com/macros/s/x/exec"), true);
  for (const bad of ["http://hooks.zapier.com/x", "https://localhost/x", "https://127.0.0.1/x", "https://10.0.0.5/x", "https://192.168.1.1/x",
    "https://172.20.1.1/x", "https://169.254.169.254/latest", "https://[::1]/x", "https://user:pw@site.com/x", "https://intranet/x", "nada"]) {
    assert.equal(safeWebhookUrl(bad), false, bad);
  }
});
test("webhook: corpo com UTM do último toque (ou do primeiro) e assinatura HMAC estável", async () => {
  const p = leadPayload({ id: "1", name: "Ana", phone: "5511999998888", email: null, source: "Google Ads", last: { utm_campaign: "promo" }, first: { utm_source: "google" },
    option: null, message: null, temperature: "quente", score: 50, widget: "w", attendant: null }, new Date("2026-10-26T12:00:00Z"));
  assert.equal(p.phone, "+5511999998888");
  assert.deepEqual(p.utm, { source: "google", medium: null, campaign: "promo", content: null, term: null });
  assert.equal(await sign("abc", "segredo"), await sign("abc", "segredo"));
  assert.notEqual(await sign("abc", "segredo"), await sign("abd", "segredo"));
  assert.match(await sign("abc", "segredo"), /^[0-9a-f]{64}$/);
});

// ---------- importação ----------
test("CSV: ponto e vírgula do Excel, aspas, BOM e linhas vazias", () => {
  const rows = parseCsv('﻿Nome;WhatsApp;E-mail\r\n"Silva; Ana";(11) 99999-8888;ana@x.com\r\n\r\nBruno;11 98888 7777;\n');
  assert.deepEqual(rows, [["Nome", "WhatsApp", "E-mail"], ["Silva; Ana", "(11) 99999-8888", "ana@x.com"], ["Bruno", "11 98888 7777", ""]]);
  assert.deepEqual(parseCsv('a,b\n"x ""y""",2'), [["a", "b"], ['x "y"', "2"]]);
});
test("CSV: adivinha colunas, normaliza telefone e ignora inválidos e repetidos", () => {
  assert.deepEqual(guessFields(["Nome do cliente", "Celular", "Email", "Origem", "Obs", "Telefone 2"]), ["name", "phone", "email", "source", "ignore", "ignore"]);
  assert.equal(normalizePhone("(11) 99999-8888"), "5511999998888");
  assert.equal(normalizePhone("+351 912 345 678"), "351912345678");
  assert.equal(normalizePhone("123"), null);
  const { rows, skipped } = buildRows([["Ana", "11999998888", "ana@x"], ["Ana 2", "(11) 99999-8888", ""], ["Sem", "", ""]], ["name", "phone", "email"]);
  assert.equal(rows.length, 1); assert.equal(skipped, 2);
  assert.equal(rows[0].email, null, "e-mail inválido vira vazio");
});

// ---------- e-mails ----------
test("resumo diário: não manda em dia sem novidade; texto no plural certo", () => {
  const zero = { newLeads: 0, hot: 0, followupsToday: 0, won: 0, revenue: 0, topSource: null };
  assert.equal(digestWorthSending(zero), false);
  assert.equal(digestWorthSending({ ...zero, followupsToday: 1 }), true);
  const e = dailyDigestEmail(["a@x.com"], { newLeads: 12, hot: 3, followupsToday: 2, won: 1, revenue: 1500, topSource: "Google Ads" }, "https://app");
  assert.equal(e.subject, "Resumo de ontem: 12 contatos · 2 retornos hoje");
  assert.match(e.text, /3 quentes/); assert.match(e.text, /1 venda \(R\$\s?1\.500,00\)/); assert.match(e.text, /contatos\?retorno=pendente/);
  assert.match(dailyDigestEmail([], { ...zero, newLeads: 1, topSource: "<b>x</b>" }, "u").html, /&lt;b&gt;x/, "origem escapada");
});
test("e-mails do teste: aviso do dia 2 só sem instalação e dentro do teste", () => {
  const now = new Date("2026-10-26T12:00:00Z"), d = 86_400_000;
  assert.equal(nudgeDue(new Date(now.getTime() + 5 * d), false, now), true);   // dia 2
  assert.equal(nudgeDue(new Date(now.getTime() + 6 * d), false, now), false);  // dia 1: cedo
  assert.equal(nudgeDue(new Date(now.getTime() + 5 * d), true, now), false);   // já instalou
  assert.equal(nudgeDue(new Date(now.getTime() - d), false, now), false);      // teste acabou
  assert.match(installNudgeEmail(["a@x"], "https://app").text, /\/painel\/captacao/);
});

// ---------- painel do dono ----------
test("dono: lista de e-mails, MRR por ciclo e contagens", () => {
  assert.equal(isSuperAdmin("Kaka@Gmail.com", "x@y.com, kaka@gmail.com"), true);
  assert.equal(isSuperAdmin("outro@gmail.com", "kaka@gmail.com"), false);
  assert.equal(isSuperAdmin("kaka@gmail.com", ""), false);
  assert.equal(mrr([{ value: 49.9, cycle: "MONTHLY" }, { value: 499, cycle: "YEARLY" }, { value: 139.9, cycle: "QUARTERLY" }]), 138.12);
  const now = new Date("2026-10-26T12:00:00Z"), iso = (days: number) => new Date(now.getTime() + days * 86_400_000).toISOString();
  const s = summarize([
    { plan_status: "trial", trial_ends_at: iso(1), created_at: iso(-6) }, { plan_status: "trial", trial_ends_at: iso(-1), created_at: iso(-8) },
    { plan_status: "active", trial_ends_at: iso(-20), created_at: iso(-27) }, { plan_status: "canceled", trial_ends_at: iso(-40), created_at: iso(-47) },
  ], now);
  assert.deepEqual(s, { total: 4, trial: 1, trialEndingSoon: 1, active: 1, pastDue: 0, churned: 2, signups7: 1, signups30: 3 });
});
