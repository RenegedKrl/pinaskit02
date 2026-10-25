"use client";
import { useMemo, useState } from "react";

/** Preenche todos os dias do período (dias sem contato = 0), em ordem. */
function fillDays(daily: { day: string; total: number }[], days: number) {
  const map = new Map(daily.map((d) => [d.day, d.total]));
  const out: { day: string; total: number }[] = [];
  const today = new Date(Date.now() - 3 * 3600e3); // Brasília
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today); d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    out.push({ day: key, total: map.get(key) ?? 0 });
  }
  return out;
}
const fmt = (day: string) => day.slice(8, 10) + "/" + day.slice(5, 7);
const W = 640, H = 220, PL = 32, PR = 12, PT = 16, PB = 28;

/** Contatos por dia: linha suave com área em degradê, eixos e valor ao passar o mouse. */
export function AreaChart({ daily, days }: { daily: { day: string; total: number }[]; days: number }) {
  const data = useMemo(() => fillDays(daily, days), [daily, days]);
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(4, ...data.map((d) => d.total));
  const step = Math.ceil(max / 4); const top = step * 4;
  const x = (i: number) => PL + (i * (W - PL - PR)) / Math.max(1, data.length - 1);
  const y = (v: number) => PT + (1 - v / top) * (H - PT - PB);
  // curva suave (Catmull-Rom → Bézier)
  const pts = data.map((d, i) => [x(i), y(d.total)] as const);
  const line = pts.map((p, i) => {
    if (!i) return `M${p[0]},${p[1]}`;
    const p0 = pts[i - 2] ?? pts[i - 1], p1 = pts[i - 1], p3 = pts[i + 1] ?? p;
    const c1 = [p1[0] + (p[0] - p0[0]) / 6, p1[1] + (p[1] - p0[1]) / 6], c2 = [p[0] - (p3[0] - p1[0]) / 6, p[1] - (p3[1] - p1[1]) / 6];
    return `C${c1[0]},${Math.min(c1[1], H - PB)} ${c2[0]},${Math.min(c2[1], H - PB)} ${p[0]},${p[1]}`;
  }).join(" ");
  const area = `${line} L${x(data.length - 1)},${H - PB} L${x(0)},${H - PB} Z`;
  const labelEvery = Math.ceil(data.length / 7);
  const h = hover !== null ? data[hover] : null;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-56 w-full" role="img" aria-label="Contatos recebidos por dia"
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const px = ((e.clientX - r.left) / r.width) * W;
          setHover(Math.max(0, Math.min(data.length - 1, Math.round(((px - PL) / (W - PL - PR)) * (data.length - 1)))));
        }}>
        <defs>
          <linearGradient id="pk-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="pk-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#3b82f6" /><stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            <line x1={PL} x2={W - PR} y1={y(step * i)} y2={y(step * i)} className="stroke-line" strokeDasharray={i ? "3 4" : undefined} />
            <text x={PL - 8} y={y(step * i) + 4} textAnchor="end" className="fill-mute text-[11px]">{step * i}</text>
          </g>
        ))}
        {data.map((d, i) => (i % labelEvery === 0 || i === data.length - 1) && (
          <text key={d.day} x={x(i)} y={H - 8} textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"} className="fill-mute text-[11px]">{fmt(d.day)}</text>
        ))}
        <path d={area} fill="url(#pk-area)" />
        <path d={line} fill="none" stroke="url(#pk-line)" strokeWidth="2.5" strokeLinecap="round" />
        {h && hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={PT} y2={H - PB} className="stroke-mute/40" strokeDasharray="3 3" />
            <circle cx={x(hover)} cy={y(h.total)} r="5" fill="#8b5cf6" stroke="white" strokeWidth="2" />
          </g>
        )}
      </svg>
      {h && hover !== null && (
        <div className="pointer-events-none absolute -translate-x-1/2 rounded-lg border border-line bg-card px-2.5 py-1.5 text-center shadow-lg"
          style={{ left: `${(x(hover) / W) * 100}%`, top: `calc(${(y(h.total) / H) * 100}% - 52px)` }}>
          <p className="text-sm font-bold tabular-nums">{h.total} {h.total === 1 ? "contato" : "contatos"}</p>
          <p className="text-[11px] text-mute">{fmt(h.day)}</p>
        </div>
      )}
    </div>
  );
}

const COLORS = ["#6366f1", "#14b8a6", "#f59e0b", "#ec4899", "#64748b"];

/** De onde vieram: anel com total no centro e legenda com porcentagens (máx. 4 + "Outros"). */
export function Donut({ sources }: { sources: { label: string; total: number }[] }) {
  const sorted = [...sources].sort((a, b) => b.total - a.total);
  const list = sorted.length > 5 ? [...sorted.slice(0, 4), { label: "Outros", total: sorted.slice(4).reduce((a, s) => a + s.total, 0) }] : sorted;
  const total = list.reduce((a, s) => a + s.total, 0);
  const R = 42, C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="relative h-40 w-40 shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" role="img" aria-label="Contatos por origem">
          <circle cx="50" cy="50" r={R} fill="none" className="stroke-line" strokeWidth="12" />
          {list.map((s, i) => {
            const len = total ? (s.total / total) * C : 0;
            const el = <circle key={s.label} cx="50" cy="50" r={R} fill="none" stroke={COLORS[i % COLORS.length]} strokeWidth="12"
              strokeDasharray={`${Math.max(0, len - (list.length > 1 ? 1.5 : 0))} ${C}`} strokeDashoffset={-acc} />;
            acc += len; return el;
          })}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div><p className="text-2xl font-bold tabular-nums">{total}</p><p className="text-xs text-mute">contatos</p></div>
        </div>
      </div>
      <ul className="min-w-40 flex-1 space-y-2.5">
        {list.map((s, i) => (
          <li key={s.label} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
            <span className="min-w-0 flex-1 truncate">{s.label}</span>
            <span className="font-semibold tabular-nums">{total ? Math.round((s.total / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
