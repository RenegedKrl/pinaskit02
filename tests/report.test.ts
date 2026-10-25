// Testes do relatório de vendas por origem. Rodar: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { bestRow, conversion, nextGroup, normalize } from "../src/lib/report.ts";

test("conversão: vendas ÷ contatos, com teto de 100% e traço sem contatos", () => {
  assert.equal(conversion(9, 120), "7,5%");
  assert.equal(conversion(0, 10), "0,0%");
  assert.equal(conversion(5, 3), "100,0%");
  assert.equal(conversion(0, 0), "—");
});

test("descer de nível: origem → campanha → anúncio → fim", () => {
  assert.equal(nextGroup("origem"), "campanha");
  assert.equal(nextGroup("campanha"), "anuncio");
  assert.equal(nextGroup("anuncio"), null);
});

test("normaliza números que chegam como texto e soma o total", () => {
  const { rows, total } = normalize([
    { label: "Meta Ads", leads: "120", open: "18", won: "9", lost: "3", revenue: "4500.00" },
    { label: "Google Ads", leads: 45, open: 6, won: 6, lost: 0, revenue: 3200 },
  ]);
  assert.equal(rows[0].leads, 120);
  assert.equal(rows[0].revenue, 4500);
  assert.deepEqual([total.leads, total.won, total.revenue], [165, 15, 7700]);
  assert.equal(normalize(null).rows.length, 0);
});

test("melhor origem só com dados suficientes (≥ 5 contatos e 1 venda)", () => {
  const { rows } = normalize([
    { label: "A", leads: 120, won: 9 }, { label: "B", leads: 45, won: 6 }, { label: "C", leads: 2, won: 2 },
  ]);
  assert.equal(bestRow(rows)?.label, "B");
  assert.equal(bestRow(normalize([{ label: "X", leads: 3, won: 1 }]).rows), null);
});
