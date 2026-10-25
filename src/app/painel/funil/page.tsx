import Link from "next/link";
import { canEdit, getSession } from "@/lib/session";
import { STATUS, TEMP } from "@/lib/copy";
import { brl } from "@/lib/plan";
import { dateTime } from "@/lib/utils";
import { Badge, PageHeader, Select } from "@/components/ui";
import { setStatus } from "../contatos/actions";

export default async function Funil({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const { ok } = await searchParams;
  const { supabase, workspace, role } = await getSession();
  const { data } = await supabase.from("leads").select("id, name, source_label, status, temperature, deal_value, updated_at")
    .eq("workspace_id", workspace.id).order("updated_at", { ascending: false }).limit(600);
  const leads = data ?? [];
  const edit = canEdit(role);

  return (
    <>
      <PageHeader title="Funil" desc="Organize seus contatos por etapa de atendimento." />
      {ok && <p role="status" className="mb-4 rounded-lg bg-success-soft p-3 text-sm text-emerald-800">{ok}</p>}
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {STATUS.map((s) => {
          const items = leads.filter((l) => l.status === s.id);
          const sum = items.reduce((a, l) => a + Number(l.deal_value || 0), 0);
          return (
            <section key={s.id} className="rounded-2xl bg-card/60 p-3" aria-label={s.label}>
              <header className="mb-3">
                <h2 className="font-display font-semibold">{s.label} <span className="text-mute">({items.length})</span></h2>
                <p className="text-xs text-mute">{sum ? brl(sum) : s.hint}</p>
              </header>
              <div className="space-y-2">
                {items.slice(0, 50).map((l) => (
                  <div key={l.id} className="rounded-xl border border-line bg-card p-3">
                    <Link href={`/painel/contatos/${l.id}`} className="font-semibold hover:text-primary">{l.name || "Sem nome"}</Link>
                    <p className="text-xs text-mute">{l.source_label || "Acesso direto"} · {dateTime(l.updated_at)}</p>
                    <div className="mt-1"><Badge className={TEMP[l.temperature as keyof typeof TEMP]?.cls}>{TEMP[l.temperature as keyof typeof TEMP]?.label}</Badge></div>
                    {edit && (
                      <form action={setStatus} className="mt-2 flex gap-1">
                        <input type="hidden" name="id" value={l.id} />
                        <input type="hidden" name="back" value="/painel/funil" />
                        <Select name="status" defaultValue={l.status} aria-label="Mover para" className="py-1.5 text-sm">
                          {STATUS.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
                        </Select>
                        <button className="rounded-lg bg-primary px-2.5 text-sm font-semibold text-white">Mover</button>
                      </form>
                    )}
                  </div>
                ))}
                {!items.length && <p className="rounded-xl border border-dashed border-line p-3 text-center text-sm text-mute">Nenhum contato</p>}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
