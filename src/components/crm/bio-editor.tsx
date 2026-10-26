"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Download, ExternalLink, Plus, Trash2 } from "lucide-react";
import { saveBio, type BioInput } from "@/app/painel/captacao/bio/actions";
import { slugify } from "@/lib/crm";
import { Button, Card, Field, Input, Select, WhatsAppIcon } from "@/components/ui";

/** Editor da página da bio com prévia de celular, link para copiar e QR Codes para baixar. */
export function BioEditor({ initial, widgets, pages, appUrl, qrBio, qrStore }: {
  initial: BioInput; widgets: { id: string; name: string }[]; pages: { id: string; title: string }[]; appUrl: string; qrBio: string | null; qrStore: string | null;
}) {
  const router = useRouter(); const [pending, start] = useTransition(); const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [b, setB] = useState(initial); const set = (p: Partial<BioInput>) => setB((x) => ({ ...x, ...p })); const [copied, setCopied] = useState(false);
  const url = `${appUrl}/l/${b.slug}`;
  const save = () => start(async () => { const r = await saveBio(b); setMsg({ ok: r.ok, t: r.ok ? "Página salva." : r.error ?? "Erro." }); router.refresh(); });
  const dl = (svg: string, name: string) => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" })); a.download = name; a.click(); };
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <Card>
          <h2 className="mb-3 font-display font-semibold">Página da bio</h2>
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nome no topo"><Input maxLength={60} value={b.title} onChange={(e) => set({ title: e.target.value, slug: initial.id ? b.slug : slugify(e.target.value) })} /></Field>
              <Field label="Endereço" hint={`${appUrl.replace(/^https?:\/\//, "")}/l/…`}><Input value={b.slug} onChange={(e) => set({ slug: slugify(e.target.value) })} /></Field>
            </div>
            <Field label="Frase de apresentação"><Input maxLength={160} value={b.subtitle} onChange={(e) => set({ subtitle: e.target.value })} placeholder="Ex.: Clínica de estética em Moema · seg a sáb" /></Field>
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_120px]">
              <Field label="Botão de WhatsApp usa o número de"><Select value={b.widget_id ?? ""} onChange={(e) => set({ widget_id: e.target.value || null })}><option value="">Sem botão de WhatsApp</option>{widgets.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</Select></Field>
              <Field label="Texto do botão"><Input maxLength={40} value={b.whatsapp_label} onChange={(e) => set({ whatsapp_label: e.target.value })} /></Field>
              <Field label="Cor"><input type="color" value={b.color} onChange={(e) => set({ color: e.target.value })} className="h-11 w-full rounded-lg border border-line" aria-label="Cor" /></Field>
            </div>
            {pages.length > 0 && <Field label="Botão de agendamento"><Select value={b.booking_page_id ?? ""} onChange={(e) => set({ booking_page_id: e.target.value || null })}><option value="">Sem agendamento</option>{pages.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</Select></Field>}
            <div className="space-y-2">
              <p className="text-sm font-semibold">Outros links</p>
              {b.links.map((l, i) => (
                <div key={i} className="grid grid-cols-[1fr_1.4fr_28px] gap-2">
                  <Input aria-label="Texto do link" placeholder="Ex.: Nosso site" value={l.label} onChange={(e) => set({ links: b.links.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
                  <Input aria-label="Endereço do link" placeholder="https://…" value={l.url} onChange={(e) => set({ links: b.links.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)) })} />
                  <button type="button" aria-label="Remover link" onClick={() => set({ links: b.links.filter((_, j) => j !== i) })} className="text-mute hover:text-red-700"><Trash2 size={15} /></button>
                </div>
              ))}
              {b.links.length < 8 && <Button type="button" size="sm" variant="ghost" onClick={() => set({ links: [...b.links, { label: "", url: "" }] })}><Plus size={14} />Adicionar link</Button>}
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={b.active} onChange={(e) => set({ active: e.target.checked })} className="size-4 accent-primary" />Página no ar</label>
            <div className="flex flex-wrap items-center gap-3"><Button onClick={save} disabled={pending}>{pending ? "Salvando…" : "Salvar página"}</Button>{msg && <span className={`text-sm ${msg.ok ? "text-emerald-700" : "text-red-700"}`}>{msg.t}</span>}</div>
          </div>
        </Card>
        {initial.id && (
          <Card>
            <h2 className="mb-1 font-display font-semibold">Link e QR Codes</h2>
            <p className="mb-3 text-sm text-mute">Cada caminho registra a origem: quem entra pela bio aparece como “Instagram (link da bio)”, quem lê o QR do balcão como “Loja física (QR Code)”.</p>
            <div className="mb-4 flex flex-wrap items-center gap-2"><code className="flex-1 truncate rounded-lg bg-bg px-3 py-2 text-sm">{url}</code>
              <Button type="button" size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>{copied ? <Check size={14} /> : <Copy size={14} />}Copiar</Button>
              <a href={`/l/${b.slug}`} target="_blank" rel="noopener" className="inline-flex h-9 items-center gap-1 px-2 text-sm text-mute hover:text-ink"><ExternalLink size={14} />Abrir</a></div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[["Para a bio e cartão de visita", qrBio, "qr-pagina-bio.svg"], ["Para balcão e cartaz (abre o WhatsApp)", qrStore, "qr-loja-whatsapp.svg"]].map(([label, svg, file]) => svg ? (
                <div key={file} className="rounded-xl border border-line p-3 text-center">
                  <div className="mx-auto w-40 [&_svg]:h-auto [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
                  <p className="mt-2 text-sm font-semibold">{label}</p>
                  <Button type="button" size="sm" variant="ghost" onClick={() => dl(svg, file!)}><Download size={14} />Baixar</Button>
                </div>
              ) : <p key={file} className="rounded-xl border border-dashed border-line p-4 text-sm text-mute">Escolha um botão de WhatsApp para gerar o QR do balcão.</p>)}
            </div>
          </Card>
        )}
      </div>
      <div className="xl:sticky xl:top-24 xl:self-start">
        <p className="mb-2 text-sm font-semibold">Prévia</p>
        <div className="mx-auto w-[300px] rounded-[44px] bg-[#0b0f17] p-3 shadow-2xl">
          <div className="min-h-[560px] rounded-[34px] px-5 py-10 text-center" style={{ background: `linear-gradient(180deg, ${b.color}22, #fff 45%)` }}>
            <div className="mx-auto grid size-20 place-items-center rounded-full text-3xl font-bold text-white" style={{ background: b.color }}>{(b.title || "?").charAt(0).toUpperCase()}</div>
            <p className="mt-3 text-lg font-bold text-slate-900">{b.title || "Seu negócio"}</p>
            {b.subtitle && <p className="mt-1 text-sm text-slate-600">{b.subtitle}</p>}
            <div className="mt-6 space-y-2.5">
              {b.widget_id && <div className="flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-3.5 text-sm font-bold text-white"><WhatsAppIcon size={17} />{b.whatsapp_label}</div>}
              {b.booking_page_id && <div className="rounded-2xl py-3.5 text-sm font-bold text-white" style={{ background: b.color }}>Agendar horário</div>}
              {b.links.filter((l) => l.label).map((l, i) => <div key={i} className="rounded-2xl border border-slate-200 bg-white py-3.5 text-sm font-semibold text-slate-800">{l.label}</div>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
