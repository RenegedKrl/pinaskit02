"use client";
import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileSpreadsheet, Upload } from "lucide-react";
import { buildRows, FIELD_LABEL, guessFields, parseCsv, type ImportField } from "@/lib/csv";
import { importLeads } from "@/app/painel/contatos/importar/actions";
import { Button, Card, Select } from "@/components/ui";

/** Importar contatos: escolhe o arquivo, confere as colunas e importa. */
export function Importer() {
  const router = useRouter();
  const [data, setData] = useState<string[][]>([]); const [fields, setFields] = useState<ImportField[]>([]);
  const [file, setFile] = useState(""); const [res, setRes] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const header = data[0] ?? [], body = data.slice(1);
  const built = useMemo(() => buildRows(body, fields), [body, fields]);

  async function pick(f: File | undefined) {
    if (!f) return;
    setRes(null); setFile(f.name);
    if (!/\.(csv|txt)$/i.test(f.name)) return setRes({ ok: false, text: "Salve a planilha como CSV (Excel: Arquivo › Salvar como › CSV) e envie de novo." });
    if (f.size > 5_000_000) return setRes({ ok: false, text: "Arquivo grande demais (máximo 5 MB)." });
    const rows = parseCsv(await f.text());
    setData(rows); setFields(guessFields(rows[0] ?? []));
  }

  const send = () => start(async () => {
    const r = await importLeads(built.rows).catch(() => ({ ok: false, error: "Não foi possível importar." } as const));
    setRes(r.ok ? { ok: true, text: `${r.added} contatos importados.${r.existing ? ` ${r.existing} já existiam e foram mantidos.` : ""}` } : { ok: false, text: r.error ?? "Erro." });
    if (r.ok) { setData([]); router.refresh(); }
  });

  return (
    <div className="space-y-4">
      <Card>
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-line p-8 text-center hover:border-primary/50">
          <Upload size={28} className="text-primary" />
          <span className="font-semibold">{file || "Escolher planilha (.csv)"}</span>
          <span className="text-sm text-mute">Precisa ter uma coluna de WhatsApp ou telefone. Nome, e-mail e origem são opcionais.</span>
          <input type="file" accept=".csv,text/csv,.txt" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
        </label>
        {res && <p role="status" className={`mt-3 text-sm ${res.ok ? "text-emerald-700" : "text-red-700"}`}>{res.text} {res.ok && <Link href="/painel/contatos" className="font-semibold text-primary">Ver contatos</Link>}</p>}
      </Card>

      {header.length > 0 && (
        <Card className="overflow-x-auto">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 font-display font-semibold"><FileSpreadsheet size={18} />Confira as colunas</h2>
            <span className="text-sm text-mute">{built.rows.length} prontos para importar{built.skipped ? ` · ${built.skipped} sem telefone válido ou repetidos` : ""}</span>
          </div>
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead><tr>{header.map((h, i) => (
              <th key={i} className="p-2 align-top font-normal"><span className="mb-1 block truncate font-semibold">{h || `Coluna ${i + 1}`}</span>
                <Select aria-label={`Campo da coluna ${h}`} value={fields[i]} onChange={(e) => setFields((f) => f.map((x, j) => (j === i ? (e.target.value as ImportField) : x)))} className="h-9 py-1 text-sm">
                  {(Object.keys(FIELD_LABEL) as ImportField[]).map((k) => <option key={k} value={k}>{FIELD_LABEL[k]}</option>)}
                </Select></th>))}</tr></thead>
            <tbody>{body.slice(0, 5).map((r, i) => <tr key={i} className="border-t border-line">{header.map((_, j) => <td key={j} className="max-w-48 truncate p-2 text-mute">{r[j]}</td>)}</tr>)}</tbody>
          </table>
          {body.length > 5 && <p className="mt-2 text-xs text-mute">Mostrando 5 de {body.length} linhas.</p>}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button onClick={send} disabled={pending || !built.rows.length || !fields.includes("phone")}>{pending ? "Importando…" : `Importar ${built.rows.length} contatos`}</Button>
            {!fields.includes("phone") && <span className="text-sm text-red-700">Escolha qual coluna é o WhatsApp.</span>}
            <span className="text-sm text-mute">Entram na primeira etapa do funil. Quem já existe não é alterado.</span>
          </div>
        </Card>
      )}
    </div>
  );
}
