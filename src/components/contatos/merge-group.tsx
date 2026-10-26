"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Merge } from "lucide-react";
import { mergeLeads } from "@/app/painel/contatos/extra-actions";
import { formatPhone } from "@/lib/utils";
import type { DupLead } from "@/lib/crm";
import { Button, Card } from "@/components/ui";

/** Um grupo de prováveis repetidos: escolhe qual fica e junta os outros nele. */
export function MergeGroup({ reason, leads, admin }: { reason: string; leads: DupLead[]; admin: boolean }) {
  const router = useRouter(); const [pending, start] = useTransition();
  const [keep, setKeep] = useState(leads[0].id); const [err, setErr] = useState(""); const [done, setDone] = useState(false);
  if (done) return null;
  const merge = () => start(async () => {
    setErr("");
    for (const l of leads.filter((x) => x.id !== keep)) {
      const r = await mergeLeads(keep, l.id);
      if (!r.ok) { setErr(r.error ?? "Erro."); router.refresh(); return; }
    }
    setDone(true); router.refresh();
  });
  return (
    <Card>
      <p className="mb-3 text-sm font-semibold text-mute">{reason}</p>
      <ul className="space-y-2">{leads.map((l) => (
        <li key={l.id}>
          <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${keep === l.id ? "border-primary bg-primary-soft/40" : "border-line"}`}>
            <input type="radio" name={`keep-${leads[0].id}`} checked={keep === l.id} onChange={() => setKeep(l.id)} disabled={!admin} className="size-4 accent-primary" />
            <div className="min-w-0 flex-1">
              <Link href={`/painel/contatos/${l.id}`} className="font-semibold hover:text-primary">{l.name || "Sem nome"}</Link>
              <p className="text-sm text-mute">{formatPhone(l.phone_e164)}{l.email ? ` · ${l.email}` : ""} · chegou em {new Date(l.created_at).toLocaleDateString("pt-BR")}</p>
            </div>
            {keep === l.id && <span className="text-xs font-semibold text-primary">Fica este</span>}
          </label>
        </li>
      ))}</ul>
      {admin ? (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button size="sm" disabled={pending} onClick={merge}><Merge size={15} />{pending ? "Juntando…" : `Juntar ${leads.length} em 1`}</Button>
          <span className="text-xs text-mute">O histórico, as tarefas, negociações e propostas passam para o que fica. Os outros são apagados.</span>
        </div>
      ) : <p className="mt-3 text-sm text-mute">Só o dono ou um administrador pode juntar contatos.</p>}
      {err && <p className="mt-2 text-sm text-red-700">{err}</p>}
    </Card>
  );
}
