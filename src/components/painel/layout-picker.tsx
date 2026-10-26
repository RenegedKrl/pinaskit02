"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { id: "lateral", label: "Menu lateral (padrão)", desc: "Menu escuro à esquerda, que pode ser recolhido." },
  { id: "topo", label: "Menu no topo", desc: "Abas em cima, mais espaço para o conteúdo." },
] as const;

function Mini({ side }: { side: boolean }) {
  return (
    <div className={cn("flex h-20 overflow-hidden rounded-lg border border-line bg-bg", !side && "flex-col")}>
      {side ? <div className="w-1/4 space-y-1 bg-[#0b1220] p-1.5">{[0, 1, 2].map((i) => <div key={i} className={cn("h-1.5 rounded", i === 0 ? "bg-blue-400" : "bg-white/20")} />)}</div>
        : <div className="flex h-5 items-center justify-center gap-1 border-b border-line bg-card">{[0, 1, 2, 3].map((i) => <div key={i} className={cn("h-1.5 w-5 rounded-full", i === 0 ? "bg-primary" : "bg-line")} />)}</div>}
      <div className="grid flex-1 grid-cols-2 gap-1 p-1.5">{[0, 1, 2, 3].map((i) => <div key={i} className="rounded bg-card" />)}</div>
    </div>
  );
}

/** Escolha do formato do painel. Fica salva neste navegador. */
export function LayoutPicker({ current }: { current: string }) {
  const [value, setValue] = useState(current);
  const router = useRouter();
  function pick(id: string) {
    setValue(id);
    document.cookie = `pk-layout=${id}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }
  return (
    <Card>
      <h2 className="font-display font-semibold">Aparência do painel</h2>
      <p className="mb-4 text-sm text-mute">Escolha onde fica o menu. Vale para este navegador.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {OPTIONS.map((o) => (
          <button key={o.id} type="button" onClick={() => pick(o.id)} aria-pressed={value === o.id}
            className={cn("relative rounded-xl border-2 p-3 text-left transition-colors", value === o.id ? "border-primary bg-primary-soft/40" : "border-line hover:border-primary/40")}>
            <Mini side={o.id === "lateral"} />
            <p className="mt-3 font-semibold">{o.label}</p>
            <p className="text-sm text-mute">{o.desc}</p>
            {value === o.id && <span className="absolute right-3 top-3 grid size-6 place-items-center rounded-full bg-primary text-white"><Check size={14} /></span>}
          </button>
        ))}
      </div>
    </Card>
  );
}
