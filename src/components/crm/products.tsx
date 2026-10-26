"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Package, Plus } from "lucide-react";
import { saveProduct } from "@/app/painel/negocios/actions";
import { brl } from "@/lib/plan";
import { Button, Card, Input } from "@/components/ui";
import type { Product } from "./deals";

function Row({ p }: { p?: Product }) {
  const router = useRouter(); const [pending, start] = useTransition();
  const [name, setName] = useState(p?.name ?? ""); const [price, setPrice] = useState(p ? String(p.price) : ""); const [active, setActive] = useState(p?.active ?? true);
  const [err, setErr] = useState("");
  const save = () => start(async () => {
    const r = await saveProduct({ id: p?.id, name, price: Number(price.replace(/\./g, "").replace(",", ".")) || 0, active });
    setErr(r.ok ? "" : r.error ?? "Erro."); if (r.ok && !p) { setName(""); setPrice(""); } router.refresh();
  });
  return (
    <li className="flex flex-wrap items-center gap-2 border-t border-line py-2.5 first:border-0">
      <Input aria-label="Nome" placeholder="Ex.: Limpeza de pele" value={name} onChange={(e) => setName(e.target.value)} className="min-w-40 flex-1" />
      <Input aria-label="Preço" inputMode="decimal" placeholder="Preço" value={price} onChange={(e) => setPrice(e.target.value)} className="w-32" />
      {p && <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="size-4 accent-primary" />Ativo</label>}
      <Button type="button" size="sm" variant={p ? "outline" : "primary"} disabled={pending || !name.trim()} onClick={save}>{p ? "Salvar" : <><Plus size={14} />Adicionar</>}</Button>
      {err && <p className="w-full text-sm text-red-700">{err}</p>}
    </li>
  );
}

/** Catálogo de produtos e serviços: aparece ao criar negociação e proposta. */
export function ProductsCard({ products, admin }: { products: Product[]; admin: boolean }) {
  return (
    <Card>
      <h2 className="mb-1 flex items-center gap-2 font-display font-semibold"><Package size={17} className="text-primary" />Produtos e serviços</h2>
      <p className="mb-3 text-sm text-mute">Com o catálogo, a negociação e a proposta já vêm com nome e preço.</p>
      {admin ? <ul><Row />{products.map((p) => <Row key={p.id} p={p} />)}</ul>
        : <ul className="divide-y divide-line">{products.map((p) => <li key={p.id} className="flex justify-between py-2 text-sm"><span>{p.name}</span><b>{brl(Number(p.price))}</b></li>)}</ul>}
      {!admin && !products.length && <p className="text-sm text-mute">Nenhum produto cadastrado.</p>}
    </Card>
  );
}
