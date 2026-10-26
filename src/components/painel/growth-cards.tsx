"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, RefreshCw, Send } from "lucide-react";
import { Button, Card, Input } from "@/components/ui";
import { rotateSecret, saveWebhook, setMyAlerts, setRotation, testWebhook } from "@/app/painel/configuracoes/growth-actions";

function useAction() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, okText = "Salvo.") => start(async () => {
    const r = await fn().catch(() => ({ ok: false, error: "Não foi possível salvar." }));
    setMsg({ ok: r.ok, text: r.ok ? okText : r.error ?? "Erro." }); router.refresh();
  });
  return { pending, msg, run };
}
const Msg = ({ m }: { m: { ok: boolean; text: string } | null }) => m && <p role="status" className={`text-sm ${m.ok ? "text-emerald-700" : "text-red-700"}`}>{m.text}</p>;

function Toggle({ label, hint, checked, onChange, disabled }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-2">
      <span><span className="font-medium">{label}</span><span className="block text-sm text-mute">{hint}</span></span>
      <input type="checkbox" role="switch" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="mt-1 size-5 accent-primary" />
    </label>
  );
}

export function AlertsCard({ newLead, daily }: { newLead: boolean; daily: boolean }) {
  const [a, setA] = useState(newLead); const [b, setB] = useState(daily);
  const { pending, msg, run } = useAction();
  const save = (x: boolean, y: boolean) => { setA(x); setB(y); run(() => setMyAlerts(x, y)); };
  return (
    <Card>
      <h2 className="font-display font-semibold">Seus avisos por e-mail</h2>
      <p className="mb-2 text-sm text-mute">Vale só para você. Cada pessoa da equipe escolhe os seus.</p>
      <Toggle label="Novo contato" hint="Na hora em que alguém preenche o formulário (dono, administradores e o atendente da vez)." checked={a} disabled={pending} onChange={(v) => save(v, b)} />
      <Toggle label="Resumo diário às 8h" hint="Quantos contatos chegaram ontem, quantos quentes e os retornos de hoje. Não chega em dia sem novidade." checked={b} disabled={pending} onChange={(v) => save(a, v)} />
      <Msg m={msg} />
    </Card>
  );
}

export interface RotMember { user_id: string; email: string | null; role: string; whatsapp_e164: string | null; in_rotation: boolean }

function RotRow({ m }: { m: RotMember }) {
  const [phone, setPhone] = useState(m.whatsapp_e164 ?? ""); const [on, setOn] = useState(m.in_rotation);
  const { pending, msg, run } = useAction();
  return (
    <li className="space-y-2 border-t border-line py-3 first:border-0">
      <div className="flex flex-wrap items-center gap-2">
        <span className="min-w-40 flex-1 truncate text-sm font-semibold">{m.email ?? "Sem e-mail"}</span>
        <Input aria-label="WhatsApp do atendente" type="tel" placeholder="55 11 99999-8888" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-48" />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} className="size-4 accent-primary" />Na fila</label>
        <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => run(() => setRotation(m.user_id, phone, on))}>Salvar</Button>
      </div>
      <Msg m={msg} />
    </li>
  );
}

export function RotationCard({ members }: { members: RotMember[] }) {
  const queue = members.filter((m) => m.in_rotation).length;
  return (
    <Card>
      <h2 className="font-display font-semibold">Rodízio de atendentes</h2>
      <p className="mb-2 text-sm text-mute">Com o rodízio ligado no botão, cada contato novo vai para quem recebeu contato há mais tempo, e o WhatsApp abre no número dessa pessoa. {queue ? `${queue} na fila agora.` : "Ninguém na fila ainda."}</p>
      <ul>{members.filter((m) => m.role !== "viewer").map((m) => <RotRow key={m.user_id} m={m} />)}</ul>
    </Card>
  );
}

const SHEETS_SCRIPT = `function doPost(e) {
  var d = JSON.parse(e.postData.contents);
  SpreadsheetApp.getActiveSheet().appendRow([d.created_at, d.name, d.phone, d.email, d.source, d.utm.campaign, d.temperature, d.answer, d.message]);
  return ContentService.createTextOutput("ok");
}`;

export function WebhookCard({ url, secret, lastStatus, lastAt }: { url: string; secret: string; lastStatus: number | null; lastAt: string | null }) {
  const [v, setV] = useState(url); const [copied, setCopied] = useState("");
  const { pending, msg, run } = useAction();
  const copy = (t: string, k: string) => { navigator.clipboard.writeText(t); setCopied(k); setTimeout(() => setCopied(""), 1500); };
  return (
    <Card>
      <h2 className="font-display font-semibold">Integrações (webhook)</h2>
      <p className="mb-3 text-sm text-mute">Cada contato novo é enviado na hora para o endereço abaixo: Zapier, Make, RD Station, n8n ou uma planilha do Google.</p>
      <div className="flex flex-wrap gap-2">
        <Input aria-label="Endereço do webhook" type="url" placeholder="https://hooks.zapier.com/hooks/catch/..." value={v} onChange={(e) => setV(e.target.value)} className="min-w-60 flex-1" />
        <Button type="button" disabled={pending} onClick={() => run(() => saveWebhook(v), v ? "Webhook salvo." : "Webhook desligado.")}>Salvar</Button>
        {url && <Button type="button" variant="outline" disabled={pending} onClick={() => run(testWebhook, "Teste enviado: o endereço respondeu OK.")}><Send size={15} />Testar</Button>}
      </div>
      <div className="mt-2 space-y-1"><Msg m={msg} />
        {url && lastAt && <p className="text-sm text-mute">Último envio: {new Date(lastAt).toLocaleString("pt-BR")} · {lastStatus && lastStatus < 400 ? `ok (${lastStatus})` : `falhou (${lastStatus || "sem resposta"})`}</p>}
      </div>
      <details className="mt-4 text-sm">
        <summary className="cursor-pointer font-semibold">Segurança: conferir a assinatura</summary>
        <p className="mt-2 text-mute">Cada envio leva o header <code>X-Pinas-Signature: sha256=…</code> (HMAC-SHA256 do corpo com o segredo abaixo).</p>
        <div className="mt-2 flex items-center gap-2"><code className="flex-1 truncate rounded-lg bg-bg px-3 py-2">{secret}</code>
          <button type="button" onClick={() => copy(secret, "s")} className="text-primary" aria-label="Copiar segredo">{copied === "s" ? <Check size={16} /> : <Copy size={16} />}</button>
          <button type="button" onClick={() => run(rotateSecret, "Segredo novo gerado.")} className="text-mute" aria-label="Gerar segredo novo"><RefreshCw size={16} /></button></div>
      </details>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer font-semibold">Mandar para uma planilha do Google</summary>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-mute">
          <li>Na planilha: Extensões › Apps Script. Apague o que estiver lá e cole o código abaixo.</li>
          <li>Implantar › Nova implantação › tipo "App da Web" › Quem pode acessar: "Qualquer pessoa".</li>
          <li>Copie a URL gerada, cole no campo acima e clique em Salvar e depois em Testar.</li>
        </ol>
        <div className="relative mt-2"><pre className="overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">{SHEETS_SCRIPT}</pre>
          <button type="button" onClick={() => copy(SHEETS_SCRIPT, "g")} className="absolute right-2 top-2 rounded bg-white/10 p-1.5 text-white" aria-label="Copiar código">{copied === "g" ? <Check size={14} /> : <Copy size={14} />}</button></div>
      </details>
    </Card>
  );
}
