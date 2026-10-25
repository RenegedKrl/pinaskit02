"use client";
import { useState } from "react";
import Link from "next/link";
import { Check, ShieldCheck } from "lucide-react";
import { brl, CYCLES, discount, everyText, perMonth, PLAN } from "@/lib/plan";

/** Card de preço da página inicial com seletor de período (mensal, trimestral, semestral, anual). */
export function Pricing() {
  const [id, setId] = useState<string>("YEARLY");
  const c = CYCLES.find((x) => x.id === id) ?? CYCLES[0];
  const off = discount(c);
  return (
    <div className="mt-8">
      <div role="radiogroup" aria-label="Período de cobrança" className="mx-auto grid max-w-md grid-cols-4 gap-1 rounded-xl border border-line bg-card p-1">
        {CYCLES.map((x) => (
          <button key={x.id} role="radio" aria-checked={x.id === id} onClick={() => setId(x.id)}
            className={`relative rounded-lg px-2 py-2 text-sm font-semibold transition-colors ${x.id === id ? "bg-primary text-white shadow" : "text-mute hover:text-ink"}`}>
            {x.label}
            {discount(x) > 0 && <span className={`absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-1.5 text-[10px] font-bold ${x.id === id ? "bg-emerald-400 text-emerald-950" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"}`}>-{discount(x)}%</span>}
          </button>
        ))}
      </div>

      <div className="mx-auto mt-6 max-w-md rounded-2xl border-2 border-primary bg-card p-8 shadow-xl shadow-primary/10">
        <div className="flex items-center justify-between gap-2">
          <p className="text-lg font-semibold">Plano {PLAN.name}</p>
          {off > 0 && <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Economize {off}%</span>}
        </div>
        <p className="mt-3 text-4xl font-bold tabular-nums">{brl(perMonth(c))}<span className="text-base font-normal text-mute">/mês</span></p>
        <p className="mt-1 text-mute">{c.months === 1 ? "Cobrado todo mês" : `${brl(c.price)} ${everyText(c.months)}`}{off > 0 && <span className="ml-1 text-sm line-through opacity-70">{brl(CYCLES[0].price * c.months)}</span>}</p>
        <ul className="mt-6 space-y-2">{PLAN.features.map((f) => <li key={f} className="flex gap-2"><Check size={18} className="mt-1 shrink-0 text-emerald-500" />{f}</li>)}</ul>
        <Link href={`/criar-conta?plano=${c.id.toLowerCase()}`} className="mt-8 block rounded-xl bg-primary py-3.5 text-center text-lg font-semibold text-white hover:bg-primary-hover">Testar 7 dias grátis</Link>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-mute"><ShieldCheck size={15} />Cartão, PIX ou boleto · sem cartão para testar</p>
      </div>
    </div>
  );
}
