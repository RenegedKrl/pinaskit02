// Testes do CRM completo: sequências, negócios, proposta, tempo de resposta, agenda, repetidos, ranking,
// NPS, campos, automações, link da bio e origem. Rodar: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { brDay, brMonth, cleanItems, cleanSteps, fillName, findDuplicates, forecast, formatMinutes, freeSlots, nps, proposalExpired, proposalTotal, ranking, responseMinutes, sequenceTasks, slugify, waLink } from "../src/lib/crm.ts";
import { cleanCustom, fieldKey, showValue, type CustomField } from "../src/lib/fields.ts";
import { cleanRule, describeRule, PRESETS, type RuleInput } from "../src/lib/automations.ts";
import { cleanLinks, trackedWhatsApp } from "../src/lib/bio.ts";
import { sourceLabel } from "../supabase/functions/_shared/widget-config.ts";

const NOW = new Date("2026-10-26T15:00:00Z"); // segunda, 12:00 em Brasília

test("dia e mês em Brasília", () => {
  assert.deepEqual(brDay(NOW), { start: "2026-10-26T03:00:00.000Z", end: "2026-10-27T03:00:00.000Z" });
  assert.deepEqual(brDay(new Date("2026-10-27T02:30:00Z")).start, "2026-10-26T03:00:00.000Z", "23:30 de Brasília ainda é dia 26");
  assert.equal(brMonth(NOW).key, "2026-10-01");
  assert.equal(brMonth(NOW, 3).key, "2027-01-01");
});

test("mensagens: troca o nome e o link do WhatsApp sai limpo", () => {
  assert.equal(fillName("Oi {primeiro_nome}! Tudo bem, {nome}?", "Ana Souza"), "Oi Ana! Tudo bem, Ana Souza?");
  assert.equal(fillName("Oi {primeiro_nome}! Tudo bem?", null), "Oi! Tudo bem?");
  assert.equal(waLink("+55 (11) 99999-8888", "Olá & oi"), "https://wa.me/5511999998888?text=Ol%C3%A1%20%26%20oi");
});

test("sequência: dia 1 agora, demais dias às 9h de Brasília, em ordem; passos vazios saem", () => {
  const steps = cleanSteps([{ day: 7, title: "", message: "Última" }, { day: 1, title: "Oi", message: "Oi {primeiro_nome}" }, { day: 3, title: "x", message: "" }, { day: 0, message: "Zero" }]);
  assert.equal(steps.length, 3);
  const t = sequenceTasks(steps, "Bruno Lima", NOW);
  assert.deepEqual(t.map((x) => x.due_at), [NOW.toISOString(), NOW.toISOString(), "2026-11-01T12:00:00.000Z"]);
  assert.equal(t[0].message, "Oi Bruno");
  assert.equal(t[2].title, "Mensagem do dia 7");
});

test("negócios: previsão do mês = só abertas do mês, ponderada pela chance", () => {
  const f = forecast([
    { value: 1000, probability: 50, status: "open", expected_close: "2026-10-20" },
    { value: 500, probability: 100, status: "open", expected_close: "2026-10-31" },
    { value: 9999, probability: 90, status: "won", expected_close: "2026-10-10" },
    { value: 700, probability: 80, status: "open", expected_close: "2026-11-02" },
    { value: 300, probability: 80, status: "open", expected_close: null },
  ], "2026-10-01");
  assert.deepEqual(f, { open: 1500, weighted: 1000, count: 2 });
});

test("proposta: itens limpos, total com desconto que nunca fica negativo, validade", () => {
  const items = cleanItems([{ name: " Implante ", qty: 2, price: 1500.555 }, { name: "", qty: 1, price: 10 }, { name: "Taxa", qty: -3, price: -5 }]);
  assert.deepEqual(items, [{ name: "Implante", qty: 2, price: 1500.56 }, { name: "Taxa", qty: 1, price: 0 }]);
  assert.deepEqual(proposalTotal(items, 100), { subtotal: 3001.12, total: 2901.12 });
  assert.equal(proposalTotal(items, 99999).total, 0);
  assert.equal(proposalExpired("2026-10-26", NOW), false, "vale até o fim do dia");
  assert.equal(proposalExpired("2026-10-25", NOW), true);
  assert.equal(proposalExpired(null, NOW), false);
});

test("tempo de resposta", () => {
  assert.equal(responseMinutes("2026-10-26T12:00:00Z", "2026-10-26T12:04:40Z"), 5);
  assert.equal(responseMinutes("2026-10-26T12:00:00Z", null), null);
  assert.equal(formatMinutes(3), "3 min"); assert.equal(formatMinutes(125), "2 h 5 min"); assert.equal(formatMinutes(60), "1 h"); assert.equal(formatMinutes(2880), "2 dias"); assert.equal(formatMinutes(null), "—");
});

test("agenda: horários livres respeitam dias, antecedência e quem já marcou", () => {
  const cfg = { duration_min: 60, days: [1, 2], start_time: "09:00", end_time: "13:00", window_days: 2, min_notice_hours: 2, };
  const days = freeSlots(cfg, ["2026-10-27T13:00:00.000Z"], NOW); // ter 10:00 BRT ocupado
  assert.deepEqual(days.map((d) => d.date), ["2026-10-27"], "segunda: 12h + 2h de antecedência passa das 13h, então o dia some");
  assert.deepEqual(days[0].slots, ["2026-10-27T12:00:00.000Z", "2026-10-27T14:00:00.000Z", "2026-10-27T15:00:00.000Z"]);
});

test("repetidos: e-mail, final do telefone e nome completo; um grupo por conjunto", () => {
  const g = findDuplicates([
    { id: "1", name: "Ana Souza", email: "ana@x.com", phone_e164: "5511999990001", created_at: "2026-01-01" },
    { id: "2", name: "ANA  SOUZA", email: "ANA@x.com", phone_e164: "5511988880002", created_at: "2026-01-02" },
    { id: "3", name: "Bruno", email: null, phone_e164: "5521977770003", created_at: "2026-01-03" },
    { id: "4", name: "Bruno", email: null, phone_e164: "21977770003", created_at: "2026-01-04" },
    { id: "5", name: "Carla", email: null, phone_e164: "5531900000005", created_at: "2026-01-05" },
  ]);
  assert.equal(g.length, 2, "Ana (e-mail e nome = mesmo grupo) e Bruno (telefone)");
  assert.deepEqual(g.map((x) => x.leads.map((l) => l.id)), [["1", "2"], ["3", "4"]]);
  assert.equal(findDuplicates([{ id: "9", name: "Ana", email: null, phone_e164: "123", created_at: "x" }]).length, 0, "só primeiro nome não junta");
});

test("ranking: ordena por vendido, conversão com teto e mediana do tempo de resposta", () => {
  const r = ranking([
    { user_id: "a", leads: 10, wins: 2, revenue: 3000, responses: [5, 50, 1] },
    { user_id: "b", leads: 0, wins: 1, revenue: 5000, responses: [] },
  ]);
  assert.deepEqual(r.map((x) => x.user_id), ["b", "a"]);
  assert.equal(r[1].conversion, 20); assert.equal(r[1].medianResponse, 5);
  assert.equal(r[0].conversion, null); assert.equal(r[0].medianResponse, null);
});

test("NPS e endereço amigável", () => {
  assert.equal(nps([10, 9, 8, 6, 0]), 0); assert.equal(nps([10, 10]), 100); assert.equal(nps([]), null);
  assert.equal(slugify("Clínica Sorriso — Moema!"), "clinica-sorriso-moema");
});

test("campos personalizados: só campos conhecidos e valores válidos", () => {
  const f: CustomField[] = [{ key: "cpf", label: "CPF", type: "text", options: [] }, { key: "filhos", label: "Filhos", type: "number", options: [] },
    { key: "evento", label: "Evento", type: "date", options: [] }, { key: "interesse", label: "Interesse", type: "select", options: ["Botox", "Limpeza"] }];
  assert.deepEqual(cleanCustom(f, { cpf: " 123 ", filhos: "2", evento: "26/10/2026", interesse: "Outro", intruso: "x" }), { cpf: "123", filhos: 2 });
  assert.deepEqual(cleanCustom(f, { evento: "2026-12-01", interesse: "Botox", filhos: "1.500,5" }), { evento: "2026-12-01", interesse: "Botox", filhos: 1500.5 });
  assert.equal(fieldKey("Tratamento de interesse!"), "tratamento_de_interesse");
  assert.equal(showValue(f[2], "2026-12-01"), "01/12/2026");
});

test("automações: valida, limita e descreve; modelos de pós-venda estão certos", () => {
  const base: RuleInput = { name: "  X ", trigger: "stale", stage_key: "lixo", days: 9999, task_title: "Retomar", task_kind: "hack", task_days: -4, task_message: "  ", assign: "lead_owner", active: true };
  const r = cleanRule(base) as RuleInput;
  assert.deepEqual([r.name, r.days, r.task_kind, r.task_days, r.task_message, r.stage_key], ["X", 365, "followup", 0, null, null]);
  assert.ok("error" in cleanRule({ ...base, trigger: "stage_enter", stage_key: null }));
  assert.ok("error" in cleanRule({ ...base, task_title: " " }));
  assert.equal(describeRule({ trigger: "stage_enter", days: 3, task_title: "Cobrar", task_days: 2 }, "Proposta"), "Quando o contato entrar na etapa “Proposta” → criar a tarefa “Cobrar” para daqui a 2 dias");
  assert.ok(PRESETS.some((p) => p.group === "Pós-venda" && p.task_days === 180 && p.stage === "won"));
  for (const p of PRESETS) assert.ok(!("error" in cleanRule({ ...p, stage_key: p.stage ? "ganho" : null, active: true })), p.name);
});

test("link da bio: links seguros e WhatsApp com origem registrada", () => {
  assert.deepEqual(cleanLinks([{ label: "Site", url: "meusite.com.br" }, { label: "Mal", url: "javascript:alert(1)" }, { label: "", url: "https://x.com" }]), [{ label: "Site", url: "https://meusite.com.br/" }]);
  const u = new URL(trackedWhatsApp("https://p.supabase.co/", "abc123", "qrcode"));
  assert.equal(u.pathname, "/functions/v1/b-redirect");
  assert.equal(u.searchParams.get("utm_medium"), "qrcode"); assert.equal(u.searchParams.get("k"), "abc123");
  assert.equal(sourceLabel({ utm_source: "instagram", utm_medium: "bio" }), "Instagram (link da bio)");
  assert.equal(sourceLabel({ utm_source: "loja-fisica", utm_medium: "qrcode" }), "Loja física (QR Code)");
});
