"use client";
import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { setStatus } from "@/app/painel/contatos/actions";
import { TEMP } from "@/lib/copy";
import { brl } from "@/lib/plan";
import { stageName, type Stage } from "@/lib/stages";
import { StatusSelect } from "@/components/contatos/status-select";

export interface BoardLead {
  id: string; name: string | null; source_label: string | null; status: string; temperature: string;
  score: number; deal_value: number | null; updated_at: string; widget_id: string | null;
}
const PER_COLUMN = 50;
const field = "h-10 rounded-lg border border-line bg-card px-3 text-sm";

/** Quadro do funil: busca, filtros e arrastar contatos entre etapas (no celular, pela caixa de etapa do cartão). */
export function Board({ stages, leads, points, edit }: { stages: Stage[]; leads: BoardLead[]; points: { id: string; name: string }[]; edit: boolean }) {
  const router = useRouter();
  const [moved, setMoved] = useState<Record<string, string>>({}); // etapa nova enquanto o servidor confirma
  const [q, setQ] = useState(""); const [temp, setTemp] = useState(""); const [src, setSrc] = useState(""); const [point, setPoint] = useState("");
  const [dragId, setDragId] = useState<string | null>(null); const [over, setOver] = useState<string | null>(null);
  const [msg, setMsg] = useState(""); const [, start] = useTransition();

  const sources = useMemo(() => [...new Set(leads.map((l) => l.source_label || "Acesso direto"))].sort(), [leads]);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return leads.map((l) => ({ ...l, status: moved[l.id] ?? l.status })).filter((l) =>
      (!s || (l.name ?? "").toLowerCase().includes(s)) && (!temp || l.temperature === temp)
      && (!src || (l.source_label || "Acesso direto") === src) && (!point || l.widget_id === point));
  }, [leads, moved, q, temp, src, point]);
  const active = q || temp || src || point;

  function move(id: string, to: string) {
    const lead = leads.find((l) => l.id === id);
    if (!lead || (moved[id] ?? lead.status) === to) return;
    setMoved((m) => ({ ...m, [id]: to }));
    const fd = new FormData(); fd.set("id", id); fd.set("status", to);
    start(async () => {
      const r = await setStatus(fd).catch(() => ({ ok: false }));
      if (r.ok) setMsg(`${lead.name || "Contato"} movido para ${stageName(stages, to)}`);
      else { setMoved((m) => { const n = { ...m }; delete n[id]; return n; }); setMsg("Não foi possível mover. Tente de novo."); }
      router.refresh();
    });
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        <label className="relative min-w-52 flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar contato pelo nome" aria-label="Buscar contato" className={`${field} w-full pl-9`} />
        </label>
        <select value={temp} onChange={(e) => setTemp(e.target.value)} aria-label="Temperatura" className={field}>
          <option value="">Toda temperatura</option>{Object.entries(TEMP).map(([k, t]) => <option key={k} value={k}>{t.label}</option>)}
        </select>
        <select value={src} onChange={(e) => setSrc(e.target.value)} aria-label="Origem" className={field}>
          <option value="">Todas as origens</option>{sources.map((s) => <option key={s}>{s}</option>)}
        </select>
        {points.length > 0 && (
          <select value={point} onChange={(e) => setPoint(e.target.value)} aria-label="Ponto de contato" className={field}>
            <option value="">Todos os pontos de contato</option>{points.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
        {active && <button onClick={() => { setQ(""); setTemp(""); setSrc(""); setPoint(""); }} className={`${field} inline-flex items-center gap-1 text-mute`}><X size={14} />Limpar</button>}
      </div>
      <p role="status" aria-live="polite" className="mb-2 min-h-5 text-sm text-mute">{msg}</p>

      <div data-tour="quadro" className="-mx-4 overflow-x-auto px-4 pb-3 md:mx-0 md:overflow-visible md:px-0 md:pb-0">
        <div className="flex gap-3">
          {stages.map((s) => {
            const items = filtered.filter((l) => l.status === s.key);
            const sum = items.reduce((a, l) => a + Number(l.deal_value || 0), 0);
            return (
              <section key={s.key} aria-label={s.name}
                onDragOver={(e) => { if (dragId) { e.preventDefault(); setOver(s.key); } }}
                onDragLeave={() => setOver((o) => (o === s.key ? null : o))}
                onDrop={(e) => { e.preventDefault(); if (dragId) move(dragId, s.key); setDragId(null); setOver(null); }}
                className={`flex w-72 shrink-0 flex-col rounded-xl border bg-bg p-2 transition-colors md:w-auto md:min-w-0 md:flex-1 md:shrink ${over === s.key ? "border-primary bg-primary-soft/40" : "border-line"}`}>
                <header className="flex items-start justify-between gap-2 px-1.5 pb-2 pt-1">
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold leading-tight [overflow-wrap:anywhere]">{s.name}</h2>
                    <p className="line-clamp-2 text-xs text-mute">{sum ? brl(sum) : s.hint}</p>
                  </div>
                  <span className="rounded-full bg-card px-2 py-0.5 text-xs font-semibold text-mute">{items.length}</span>
                </header>
                <div className="max-h-[calc(100dvh-300px)] min-h-24 space-y-2 overflow-y-auto pr-0.5">
                  {items.slice(0, PER_COLUMN).map((l) => {
                    const t = TEMP[l.temperature as keyof typeof TEMP];
                    return (
                      <article key={l.id} draggable={edit} onDragStart={(e) => { setDragId(l.id); e.dataTransfer.effectAllowed = "move"; }} onDragEnd={() => { setDragId(null); setOver(null); }}
                        className={`rounded-lg border border-line bg-card p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${edit ? "cursor-grab active:cursor-grabbing" : ""} ${dragId === l.id ? "opacity-50" : ""}`}>
                        <Link href={`/painel/contatos/${l.id}`} className="line-clamp-2 block font-semibold leading-snug hover:text-primary [overflow-wrap:anywhere]">{l.name || "Sem nome"}</Link>
                        <p className="mt-0.5 truncate text-xs text-mute">{l.source_label || "Acesso direto"}</p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          {t && <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${t.cls}`}>{t.label} · {l.score}</span>}
                          {l.deal_value ? <span className="text-xs font-semibold">{brl(Number(l.deal_value))}</span> : null}
                        </div>
                        {edit && <div className="mt-2 md:hidden"><StatusSelect id={l.id} status={l.status} stages={stages} className="w-full" /></div>}
                      </article>
                    );
                  })}
                  {items.length > PER_COLUMN && <p className="px-1 text-xs text-mute">Mostrando {PER_COLUMN} de {items.length}. Use a busca ou os filtros para achar os outros.</p>}
                  {!items.length && <p className="rounded-lg border border-dashed border-line p-4 text-center text-xs text-mute">{active ? "Nenhum contato com esses filtros" : edit ? "Arraste um contato para cá" : "Nenhum contato"}</p>}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}
