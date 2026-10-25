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
