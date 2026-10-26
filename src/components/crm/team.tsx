"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Crown, Eye, EyeOff, Target } from "lucide-react";
import { saveGoal, setSeeOnlyOwn } from "@/app/painel/equipe/actions";
import { formatMinutes } from "@/lib/crm";
import { brl } from "@/lib/plan";
import { cn } from "@/lib/utils";
import { Button, Card, Input } from "@/components/ui";

export interface TeamRow {
  user_id: string; email: string; role: string; see_only_own: boolean; leads: number; wins: number; revenue: number;
  conversion: number | null; medianResponse: number | null; goalRevenue: number; goalSales: number;
}

function Bar({ value, goal, label }: { value: number; goal: number; label: string }) {
  if (!goal) return null;
  const pct = Math.min(100, Math.round((value / goal) * 100));
  return (
    <div className="mt-2"><div className="flex justify-between text-xs text-mute"><span>{label}</span><span className="font-semibold tabular-nums">{pct}%</span></div>
      <div className="mt-1 h-2 rounded-full bg-line"><div className={cn("h-2 rounded-full", pct >= 100 ? "bg-emerald-500" : "bg-primary")} style={{ width: `${pct}%` }} /></div></div>
  );
}

function GoalForm({ r, month }: { r: TeamRow; month: string }) {
  const router = useRouter(); const [pending, start] = useTransition();
  const [rev, setRev] = useState(r.goalRevenue ? String(r.goalRevenue) : ""); const [sales, setSales] = useState(r.goalSales ? String(r.goalSales) : "");
  const [msg, setMsg] = useState("");
  return (
    <form className="mt-3 flex flex-wrap items-end gap-2 border-t border-line pt-3" onSubmit={(e) => { e.preventDefault(); start(async () => {
      const x = await saveGoal(r.user_id, month, Number(rev.replace(/\./g, "").replace(",", ".")) || 0, Number(sales) || 0); setMsg(x.ok ? "Meta salva." : x.error ?? "Erro."); router.refresh();
    }); }}>
      <label className="text-xs text-mute">Meta em R$<Input inputMode="decimal" value={rev} onChange={(e) => setRev(e.target.value)} className="mt-1 h-9 w-32 py-1 text-sm" /></label>
      <label className="text-xs text-mute">Meta de vendas<Input type="number" min={0} value={sales} onChange={(e) => setSales(e.target.value)} className="mt-1 h-9 w-24 py-1 text-sm" /></label>
      <Button size="sm" variant="outline" disabled={pending}><Target size={14} />Salvar</Button>
      {msg && <span className="text-xs text-mute">{msg}</span>}
    </form>
  );
}

function Visibility({ r }: { r: TeamRow }) {
  const router = useRouter(); const [pending, start] = useTransition(); const [on, setOn] = useState(r.see_only_own); const [err, setErr] = useState("");
  if (r.role === "owner") return null;
  return (
    <div className="mt-2">
      <button type="button" disabled={pending} onClick={() => start(async () => { const x = await setSeeOnlyOwn(r.user_id, !on); if (x.ok) setOn(!on); else setErr(x.error ?? ""); router.refresh(); })}
        className={cn("inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold", on ? "bg-amber-50 text-amber-900" : "text-mute hover:bg-bg")}>
        {on ? <EyeOff size={13} /> : <Eye size={13} />}{on ? "Vê só os contatos dele" : "Vê todos os contatos"}
      </button>
      {err && <span className="ml-2 text-xs text-red-700">{err}</span>}
    </div>
  );
}

/** Ranking do mês com metas. Dono/admin define metas e quem vê só os próprios contatos. */
export function TeamRanking({ rows, month, admin }: { rows: TeamRow[]; month: string; admin: boolean }) {
  const best = { revenue: Math.max(0, ...rows.map((r) => r.revenue)), conv: Math.max(0, ...rows.map((r) => r.conversion ?? 0)), resp: Math.min(...rows.map((r) => r.medianResponse ?? Infinity)) };
  return (
    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
      {rows.map((r, i) => (
        <Card key={r.user_id} className={cn(i === 0 && r.revenue > 0 && "border-amber-300")}>
          <div className="flex items-start gap-3">
            <span className={cn("grid size-10 shrink-0 place-items-center rounded-full font-display text-lg font-bold", i === 0 && r.revenue > 0 ? "bg-amber-100 text-amber-700" : "bg-bg text-mute")}>{i === 0 && r.revenue > 0 ? <Crown size={18} /> : i + 1}</span>
            <div className="min-w-0 flex-1"><p className="truncate font-semibold">{r.email}</p><p className="text-xs text-mute">{r.role === "owner" ? "Dono" : r.role === "admin" ? "Administrador" : "Membro"}</p>{admin && <Visibility r={r} />}</div>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-mute">Vendido</dt><dd className={cn("font-display text-xl font-bold tabular-nums", r.revenue && r.revenue === best.revenue && "text-emerald-700")}>{brl(r.revenue)}</dd></div>
            <div><dt className="text-mute">Vendas</dt><dd className="font-display text-xl font-bold tabular-nums">{r.wins}</dd></div>
            <div><dt className="text-mute">Conversão</dt><dd className={cn("font-semibold", r.conversion && r.conversion === best.conv && "text-emerald-700")}>{r.conversion === null ? "—" : `${String(r.conversion).replace(".", ",")}%`} <span className="font-normal text-mute">de {r.leads}</span></dd></div>
            <div><dt className="text-mute">Responde em</dt><dd className={cn("font-semibold", r.medianResponse !== null && r.medianResponse === best.resp && "text-emerald-700")}>{formatMinutes(r.medianResponse)}</dd></div>
          </dl>
          <Bar value={r.revenue} goal={r.goalRevenue} label={`Meta ${brl(r.goalRevenue)}`} />
          <Bar value={r.wins} goal={r.goalSales} label={`Meta ${r.goalSales} vendas`} />
          {admin && <GoalForm r={r} month={month} />}
        </Card>
      ))}
    </div>
  );
}
