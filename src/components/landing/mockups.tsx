// Ilustrações do produto para a página inicial. São EXEMPLOS (marcados como tal), não números reais de clientes.
import { WhatsAppIcon } from "@/components/ui";

function Frame({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <figure className="overflow-hidden rounded-2xl border border-line bg-card shadow-[0_20px_60px_-20px_rgba(15,23,42,0.35)]">
      <div className="flex items-center gap-1.5 border-b border-line bg-bg px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" /><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <span className="ml-2 truncate rounded-md bg-card px-2 py-0.5 text-[10px] text-mute">pinaskit.vercel.app/painel</span>
      </div>
      <div className="p-4">{children}</div>
      <figcaption className="border-t border-line px-4 py-2 text-[11px] text-mute">{label} · exemplo ilustrativo</figcaption>
    </figure>
  );
}

/** Hero: visão geral com números, gráfico e origens. */
export function DashboardMock() {
  const bars = [8, 12, 9, 15, 11, 18, 14, 22, 19, 26, 21, 30];
  return (
    <Frame label="Painel">
      <div className="grid grid-cols-3 gap-2">
        {[["Contatos", "248", "text-blue-600"], ["Vendas", "31", "text-emerald-600"], ["Conversão", "12,5%", "text-violet-600"]].map(([l, v, c]) => (
          <div key={l} className="rounded-lg border border-line p-2.5"><p className="text-[10px] text-mute">{l}</p><p className={`text-lg font-bold ${c}`}>{v}</p></div>
        ))}
      </div>
      <div className="mt-3 rounded-lg border border-line p-3">
        <p className="text-[11px] font-semibold">Contatos por dia</p>
        <svg viewBox="0 0 240 70" className="mt-2 h-20 w-full" aria-hidden="true">
          <defs><linearGradient id="lm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6366f1" stopOpacity=".4" /><stop offset="1" stopColor="#6366f1" stopOpacity="0" /></linearGradient></defs>
          <path d={`M0,${70 - bars[0] * 2} ${bars.map((b, i) => `L${(i * 240) / 11},${70 - b * 2}`).join(" ")} L240,70 L0,70Z`} fill="url(#lm)" />
          <path d={`M0,${70 - bars[0] * 2} ${bars.map((b, i) => `L${(i * 240) / 11},${70 - b * 2}`).join(" ")}`} fill="none" stroke="#6366f1" strokeWidth="2" />
        </svg>
      </div>
      <div className="mt-3 space-y-1.5 rounded-lg border border-line p-3">
        {[["Google Ads", 46, "bg-blue-500"], ["Meta Ads", 32, "bg-violet-500"], ["Instagram", 14, "bg-pink-500"], ["Acesso direto", 8, "bg-slate-400"]].map(([l, p, c]) => (
          <div key={l as string} className="flex items-center gap-2 text-[11px]">
            <span className="w-20 shrink-0">{l}</span>
            <div className="h-1.5 flex-1 rounded-full bg-line"><div className={`h-1.5 rounded-full ${c}`} style={{ width: `${p}%` }} /></div>
            <span className="w-7 text-right font-semibold">{p}%</span>
          </div>
        ))}
      </div>
    </Frame>
  );
}

/** Funil com cartões em colunas. */
export function FunnelMock() {
  const cols = [["Novo", "bg-sky-500", ["Ana Souza", "Bruno Lima"]], ["Em atendimento", "bg-blue-500", ["Carla Dias"]], ["Proposta", "bg-violet-500", ["Diego Alves"]], ["Venda", "bg-emerald-500", ["Elisa Rocha"]]] as const;
  return (
    <Frame label="Funil">
      <div className="grid grid-cols-4 gap-2">
        {cols.map(([t, c, names]) => (
          <div key={t} className="overflow-hidden rounded-lg border border-line bg-bg">
            <span className={`block h-0.5 ${c}`} />
            <p className="truncate px-2 py-1.5 text-[10px] font-semibold">{t}</p>
            <div className="space-y-1.5 p-1.5 pt-0">
              {names.map((n) => <div key={n} className="rounded-md border border-line bg-card p-1.5"><p className="truncate text-[10px] font-semibold">{n}</p><p className="text-[9px] text-mute">Google Ads</p></div>)}
            </div>
          </div>
        ))}
      </div>
    </Frame>
  );
}

/** Relatório de vendas por origem. */
export function ReportMock() {
  const rows = [["Google Ads", 45, 6, "R$ 3.200"], ["Meta Ads", 120, 9, "R$ 4.500"], ["Instagram", 30, 1, "R$ 400"]];
  return (
    <Frame label="Relatório por origem">
      <table className="w-full text-left text-[11px]">
        <thead className="text-mute"><tr><th className="pb-1.5 font-medium">Origem</th><th className="pb-1.5 text-right font-medium">Contatos</th><th className="pb-1.5 text-right font-medium">Vendas</th><th className="pb-1.5 text-right font-medium">Vendido</th></tr></thead>
        <tbody>{rows.map(([o, c, v, r]) => <tr key={o as string} className="border-t border-line"><td className="py-1.5 font-semibold">{o}</td><td className="py-1.5 text-right">{c}</td><td className="py-1.5 text-right font-semibold text-emerald-600">{v}</td><td className="py-1.5 text-right">{r}</td></tr>)}</tbody>
      </table>
    </Frame>
  );
}

/** Celular com um site e o widget (formulário + botão flutuante). */
export function PhoneMock() {
  return (
    <div className="relative mx-auto w-64 rounded-[2.2rem] border-[6px] border-slate-900 bg-white p-3 shadow-2xl dark:border-slate-700">
      <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-slate-200" />
      <div className="space-y-2">
        <div className="h-3 w-24 rounded bg-slate-200" /><div className="h-2 w-full rounded bg-slate-100" /><div className="h-2 w-5/6 rounded bg-slate-100" />
        <div className="h-20 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200" />
      </div>
      <div className="mt-3 rounded-xl border border-slate-200 p-3 text-slate-900">
        <p className="text-xs font-bold">Fale com a gente</p>
        <div className="mt-2 h-6 rounded border border-slate-200 px-2 text-[10px] leading-6 text-slate-400">Seu nome</div>
        <div className="mt-1.5 h-6 rounded border border-slate-200 px-2 text-[10px] leading-6 text-slate-400">Seu WhatsApp</div>
        <div className="mt-2 h-7 rounded-md bg-[#25D366] text-center text-[10px] font-bold leading-7 text-white">Continuar no WhatsApp</div>
      </div>
      <div className="h-6 rounded-b-lg bg-slate-800" />
      <span className="absolute -right-5 bottom-3 grid h-12 w-12 ring-4 ring-white dark:ring-slate-900 place-items-center rounded-full bg-[#25D366] text-white shadow-lg"><WhatsAppIcon size={22} /></span>
    </div>
  );
}
