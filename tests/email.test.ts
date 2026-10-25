// Testes dos e-mails (montagem). Rodar: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { newLeadEmail, trialEndingEmail } from "../supabase/functions/_shared/email.ts";

test("novo contato: assunto, campos preenchidos e link", () => {
  const e = newLeadEmail(["dono@x.com"], { name: "Ana", phone: "5511900001111", source: "Google Ads", option: null, message: "Oi", leadId: "abc" }, "https://app.com");
  assert.equal(e.subject, "Novo contato: Ana (Google Ads)");
  assert.match(e.text, /WhatsApp: \+5511900001111/);
  assert.doesNotMatch(e.text, /Resposta:/, "campo vazio não aparece");
  assert.match(e.html, /https:\/\/app\.com\/painel\/contatos\/abc/);
});

test("novo contato: escapa HTML vindo do visitante", () => {
  const e = newLeadEmail(["d@x.com"], { name: "<script>x</script>", phone: "551190000", source: "Acesso direto", option: null, message: null, leadId: "1" }, "https://app.com");
  assert.doesNotMatch(e.html, /<script>/);
  assert.match(e.html, /&lt;script&gt;/);
});

test("fim do teste: texto de quando termina", () => {
  const now = new Date("2026-10-29T12:00:00Z");
  assert.equal(trialEndingEmail(["d@x.com"], new Date("2026-10-31T12:00:00Z"), "https://app.com", now).subject, "Seu teste do Pinas Kit termina em 2 dias");
  assert.equal(trialEndingEmail(["d@x.com"], new Date("2026-10-30T12:00:00Z"), "https://app.com", now).subject, "Seu teste do Pinas Kit termina amanhã");
  assert.match(trialEndingEmail(["d@x.com"], new Date("2026-10-30T12:00:00Z"), "https://app.com", now).html, /\/painel\/assinatura/);
});
