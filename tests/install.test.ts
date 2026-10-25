// Testes de quando o widget conta como instalado. Rodar: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { countsAsInstall } from "../supabase/functions/_shared/install.ts";

test("site publicado conta como instalado", () => {
  assert.equal(countsAsInstall("https://brunamentoriadecarreira.vercel.app", "pinaskit.vercel.app"), true);
  assert.equal(countsAsInstall("https://loja.com.br/pagina?x=1", null), true);
});

test("localhost, painel e origens inválidas não contam", () => {
  assert.equal(countsAsInstall("http://localhost:3000", "pinaskit.vercel.app"), false);
  assert.equal(countsAsInstall("http://127.0.0.1:5500", null), false);
  assert.equal(countsAsInstall("https://pinaskit.vercel.app", "pinaskit.vercel.app"), false);
  assert.equal(countsAsInstall(null, null), false);
  assert.equal(countsAsInstall("file:///C:/site/index.html", null), false);
  assert.equal(countsAsInstall("lixo", null), false);
});
