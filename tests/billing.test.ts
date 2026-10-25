// Testes das regras de cobrança. Rodar: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { accessUntilOnCancel } from "../supabase/functions/_shared/billing.ts";

const now = new Date("2026-10-25T12:00:00Z");

test("cancelou durante o teste sem pagar: acesso até o fim do teste", () => {
  assert.equal(accessUntilOnCancel(null, "2026-10-31T23:00:00Z", now), "2026-10-31T23:00:00.000Z");
});

test("cancelou com período pago: acesso até o fim do período", () => {
  assert.equal(accessUntilOnCancel("2026-11-24T03:00:00Z", "2026-10-20T00:00:00Z", now), "2026-11-24T03:00:00.000Z");
});

test("teste ainda rodando e período pago menor: vale o mais tarde", () => {
  assert.equal(accessUntilOnCancel("2026-10-28T00:00:00Z", "2026-10-31T00:00:00Z", now), "2026-10-31T00:00:00.000Z");
});

test("nada pago e teste vencido: sem acesso", () => {
  assert.equal(accessUntilOnCancel(null, "2026-10-20T00:00:00Z", now), null);
});
