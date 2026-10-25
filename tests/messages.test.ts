// Testes de mensagens prontas, etiquetas e lembretes. Rodar: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { addTag, cleanTag, fillTemplate, followupState } from "../src/lib/messages.ts";

test("mensagem pronta: troca as variáveis pelos dados do contato", () => {
  const lead = { name: "Ana Paula Souza", source_label: "Google Ads" };
  assert.equal(fillTemplate("Olá {primeiro_nome}! Vi que você veio pelo {origem}.", lead), "Olá Ana! Vi que você veio pelo Google Ads.");
  assert.equal(fillTemplate("Oi {nome}", lead), "Oi Ana Paula Souza");
});

test("mensagem pronta: contato sem nome não deixa espaço sobrando", () => {
  assert.equal(fillTemplate("Olá {primeiro_nome}, tudo bem?", { name: null, source_label: null }), "Olá, tudo bem?");
});

test("etiquetas: limpa, não repete e respeita o limite de 10", () => {
  assert.equal(cleanTag("  VIP   cliente "), "vip cliente");
  assert.deepEqual(addTag(["vip"], "VIP"), ["vip"]);
  assert.deepEqual(addTag([], "   "), []);
  const ten = Array.from({ length: 10 }, (_, i) => `t${i}`);
  assert.equal(addTag(ten, "nova").length, 10);
});

test("lembrete: atrasado, hoje ou futuro", () => {
  const now = new Date("2026-10-25T15:00:00Z"); // 12h em Brasília
  assert.equal(followupState(null, now), "none");
  assert.equal(followupState("2026-10-25T13:00:00Z", now), "late");
  assert.equal(followupState("2026-10-25T20:00:00Z", now), "today");
  assert.equal(followupState("2026-10-27T13:00:00Z", now), "future");
});
