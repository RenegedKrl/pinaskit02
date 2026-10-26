"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Zap } from "lucide-react";
import { deleteRule, saveRule, toggleRule } from "@/app/painel/automacoes/actions";
import { describeRule, PRESETS, TRIGGERS, type RuleInput, type Trigger } from "@/lib/automations";
import { TASK_KIND } from "@/lib/crm";
import { cn } from "@/lib/utils";
import { Button, Card, Field, Input, Select, Textarea } from "@/components/ui";

export interface Rule extends RuleInput { id: string }
type St = { key: string; name: string; kind: string };

const blank: RuleInput = { name: "", trigger: "lead_hot", stage_key: null, days: 3, task_title: "", task_kind: "followup", task_days: 0, task_message: null, assign: "lead_owner", active: true };

function RuleForm({ stages, initial, onDone }: { stages: St[]; initial: RuleInput; onDone: () => void }) {
  const router = useRouter(); const [pending, start] = useTransition(); const [err, setErr] = useState("");
  const [r, setR] = useState<RuleInput>(initial); const set = (p: Partial<RuleInput>) => setR((x) => ({ ...x, ...p }));
  return (
    <form className="space-y-3 rounded-xl bg-bg p-4" onSubmit={(e) => { e.preventDefault(); setErr(""); start(async () => { const x = await saveRule(r); if (!x.ok) return setErr(x.error ?? "Erro."); onDone(); router.refresh(); }); }}>
      <Field label="Nome"><Input required maxLength={60} value={r.name} onChange={(e) => set({ name: e.target.value })} placeholder="Ex.: Contato quente → atender já" /></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Quando"><Select value={r.trigger} onChange={(e) => set({ trigger: e.target.value as Trigger })}>{Object.entries(TRIGGERS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
        {r.trigger === "stage_enter" && <Field label="Etapa"><Select value={r.stage_key ?? ""} onChange={(e) => set({ stage_key: e.target.value })}><option value="">Escolha</option>{stages.map((s) => <option key={s.key} value={s.key}>{s.name}</option>)}</Select></Field>}
        {r.trigger === "stale" && <Field label="Dias sem movimento"><Input type="number" min={1} max={365} value={r.days} onChange={(e) => set({ days: Number(e.target.value) })} /></Field>}
      </div>
      <p className="text-sm font-semibold">Então criar a tarefa</p>
      <div className="grid gap-3 sm:grid-cols-[1fr_150px]">
        <Input required maxLength={140} placeholder="Título da tarefa" value={r.task_title} onChange={(e) => set({ task_title: e.target.value })} aria-label="Título da tarefa" />
        <Select aria-label="Tipo" value={r.task_kind} onChange={(e) => set({ task_kind: e.target.value })}>{Object.entries(TASK_KIND).filter(([k]) => k !== "birthday").map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</Select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Para quando (dias depois)" hint="0 = no mesmo dia. Pós-venda: 180 = 6 meses."><Input type="number" min={0} max={730} value={r.task_days} onChange={(e) => set({ task_days: Number(e.target.value) })} /></Field>
        <Field label="Para quem"><Select value={r.assign} onChange={(e) => set({ assign: e.target.value as RuleInput["assign"] })}><option value="lead_owner">Responsável pelo contato</option><option value="workspace_owner">Dono da conta</option></Select></Field>
      </div>
      <Field label="Mensagem pronta (opcional)" hint="Use {primeiro_nome}. Na tarefa, vira o botão “Enviar” no WhatsApp."><Textarea rows={2} maxLength={1000} value={r.task_message ?? ""} onChange={(e) => set({ task_message: e.target.value })} /></Field>
      {err && <p className="text-sm text-red-700">{err}</p>}
      <div className="flex gap-2"><Button size="sm" disabled={pending}>{pending ? "Salvando…" : "Salvar automação"}</Button><Button type="button" size="sm" variant="ghost" onClick={onDone}>Cancelar</Button></div>
    </form>
  );
}

/** Lista de automações + modelos prontos (vendas e pós-venda). */
export function RulesManager({ rules, stages, admin }: { rules: Rule[]; stages: St[]; admin: boolean }) {
  const router = useRouter(); const [form, setForm] = useState<RuleInput | null>(null); const [, start] = useTransition();
  const stageKey = (k?: "won" | "proposta") => k === "won" ? stages.find((s) => s.kind === "won")?.key ?? null : k ? stages.find((s) => s.key === k)?.key ?? stages.find((s) => s.kind === "open")?.key ?? null : null;
  const name = (k: string | null) => stages.find((s) => s.key === k)?.name ?? "—";
  const run = (fn: () => Promise<unknown>) => start(async () => { await fn(); router.refresh(); });
  return (
    <Card>
      <h2 className="mb-1 flex items-center gap-2 font-display font-semibold"><Zap size={17} className="text-amber-500" />Regras automáticas</h2>
      <p className="mb-4 text-sm text-mute">Quando algo acontece com um contato, o Pinas Kit cria a tarefa certa para a pessoa certa. As tarefas aparecem no Meu dia.</p>
      <ul className="space-y-2">{rules.map((r) => (
        <li key={r.id} className={cn("flex items-start gap-3 rounded-xl border border-line p-3", !r.active && "opacity-60")}>
          <div className="min-w-0 flex-1"><p className="font-semibold">{r.name}</p><p className="text-sm text-mute">{describeRule(r, name(r.stage_key))}</p></div>
          {admin && <>
            <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" role="switch" checked={r.active} onChange={(e) => run(() => toggleRule(r.id, e.target.checked))} className="size-4 accent-primary" />Ligada</label>
            <button type="button" aria-label="Apagar automação" onClick={() => run(() => deleteRule(r.id))} className="text-mute hover:text-red-700"><Trash2 size={15} /></button>
          </>}
        </li>
      ))}</ul>
      {!rules.length && <p className="mb-2 text-sm text-mute">Nenhuma automação ainda. Comece por um modelo abaixo.</p>}
      {admin && (form ? <div className="mt-3"><RuleForm stages={stages} initial={form} onDone={() => setForm(null)} /></div> : (
        <div className="mt-4 space-y-3">
          {["Vendas", "Pós-venda"].map((g) => (
            <div key={g}><p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-mute">Modelos de {g.toLowerCase()}</p>
              <div className="flex flex-wrap gap-2">{PRESETS.filter((p) => p.group === g).map((p) => (
                <button key={p.name} type="button" onClick={() => setForm({ ...p, stage_key: stageKey(p.stage), active: true })}
                  className="rounded-full border border-line bg-card px-3 py-1.5 text-sm font-medium hover:border-primary hover:text-primary">+ {p.name}</button>
              ))}</div></div>
          ))}
          <Button type="button" size="sm" variant="outline" onClick={() => setForm(blank)}><Plus size={15} />Criar do zero</Button>
        </div>
      ))}
    </Card>
  );
}
