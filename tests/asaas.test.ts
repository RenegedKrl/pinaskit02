import { test } from "node:test";
import assert from "node:assert/strict";
import { validDoc, couponPercent } from "../src/lib/asaas-utils.ts";

test("CPF e CNPJ", () => {
  assert.equal(validDoc("529.982.247-25"), "52998224725");
  assert.equal(validDoc("111.111.111-11"), null);
  assert.equal(validDoc("529.982.247-24"), null);
  assert.equal(validDoc("11.222.333/0001-81"), "11222333000181");
  assert.equal(validDoc("11.222.333/0001-80"), null);
  assert.equal(validDoc("123"), null);
});

test("cupom", () => {
  process.env.PINAS_COUPONS = "PROMO10:10, amigo20:20";
  assert.equal(couponPercent(""), 0);
  assert.equal(couponPercent("promo10"), 10);
  assert.equal(couponPercent("AMIGO20"), 20);
  assert.equal(couponPercent("nada"), -1);
});

import { CYCLES, cycleById, discount, perMonth } from "../src/lib/plan.ts";

test("períodos: preço por mês e desconto em relação ao mensal", () => {
  const [m, q, s, y] = CYCLES;
  assert.deepEqual(CYCLES.map((c) => c.id), ["MONTHLY", "QUARTERLY", "SEMIANNUALLY", "YEARLY"]);
  assert.equal(perMonth(m), 49.9);
  assert.equal(perMonth(q), 46.63);
  assert.equal(perMonth(s), 44.98);
  assert.equal(perMonth(y), 41.58);
  assert.deepEqual([discount(m), discount(q), discount(s), discount(y)], [0, 7, 10, 17]);
  assert.equal(cycleById("SEMIANNUALLY").price, 269.9);
  assert.equal(cycleById("hack").id, "MONTHLY", "ciclo desconhecido cai no mensal");
});
