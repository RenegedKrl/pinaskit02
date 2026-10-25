// Testes das regras compartilhadas (origem, pontuação, mensagem). Rodar: node --test tests/
import { test } from "node:test";
import assert from "node:assert/strict";
import { mergeConfig, renderTemplate, score, sourceLabel, DEFAULT_CONFIG } from "../supabase/functions/_shared/widget-config.ts";

test("origem: anúncios e orgânico", () => {
  assert.equal(sourceLabel({ click_ids: { gclid: "x" } }), "Google Ads");
  assert.equal(sourceLabel({ utm_source: "google", utm_medium: "cpc" }), "Google Ads");
  assert.equal(sourceLabel({ click_ids: { fbclid: "x" } }), "Meta Ads");
  assert.equal(sourceLabel({ utm_source: "facebook", utm_medium: "paid" }), "Meta Ads");
  assert.equal(sourceLabel({ utm_source: "ig", utm_medium: "social" }), "Instagram");
  assert.equal(sourceLabel({ utm_source: "instagram" }), "Instagram");
  assert.equal(sourceLabel({ utm_source: "fb" }), "Facebook");
  assert.equal(sourceLabel({ utm_source: "digital" }), "digital", "'digital' não pode virar Instagram");
  assert.equal(sourceLabel({ utm_source: "tiktok" }), "TikTok Ads");
  assert.equal(sourceLabel({ referrer: "https://www.google.com.br/" }), "Google (orgânico)");
  assert.equal(sourceLabel({ referrer: "https://chatgpt.com/" }), "ChatGPT");
  assert.equal(sourceLabel({}), "Acesso direto");
  assert.equal(sourceLabel({ referrer: "https://blog.qualquer.com" }), "Outros sites");
});

test("pontuação e temperatura", () => {
  const base = { hasEmail: false, paid: false, pages: 0, returnDays: 0, optionPoints: 0, bot: false };
  assert.deepEqual(score(base), { score: 10, temperature: "frio" });
  assert.equal(score({ ...base, paid: true }).temperature, "morno"); // 25
  assert.equal(score({ ...base, paid: true, returnDays: 1 }).temperature, "quente"); // 40
  assert.equal(score({ ...base, pages: 50 }).score, 30, "páginas têm teto de 10");
  assert.equal(score({ ...base, bot: true }).score, 0, "nunca negativo");
});

test("mensagem do WhatsApp", () => {
  assert.equal(renderTemplate("Olá, sou {nome}. {opcao} {mensagem}", { nome: "Ana", opcao: "Quero comprar já" }), "Olá, sou Ana. Momento: Quero comprar já.");
});

test("config salva incompleta herda o padrão", () => {
  const c = mergeConfig({ color: "#000", form: { title: "Fale" } });
  assert.equal(c.color, "#000");
  assert.equal(c.form.title, "Fale");
  assert.equal(c.form.submitLabel, DEFAULT_CONFIG.form.submitLabel);
  assert.deepEqual(mergeConfig(null), DEFAULT_CONFIG);
});
