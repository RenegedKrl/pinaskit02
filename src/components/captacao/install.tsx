"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui";

function CopyBox({ text, label }: { text: string; label: string }) {
  const [ok, setOk] = useState(false);
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-semibold">{label}</span>
        <button type="button" className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
          onClick={() => { navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1800); }}>
          {ok ? <><Check size={15} />Copiado</> : <><Copy size={15} />Copiar</>}
        </button>
      </div>
      <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-ink p-3 text-xs text-white">{text}</pre>
    </div>
  );
}

export function Install({ publicKey, installed, appUrl, apiUrl }: { publicKey: string; installed: boolean; appUrl: string; apiUrl: string }) {
  const [tab, setTab] = useState<"code" | "ai">("code");
  const router = useRouter();
  const script = `<script async src="${appUrl}/w.js" data-pk="${publicKey}" data-api="${apiUrl}"></script>`;
  const prompt = `Preciso instalar o widget do Pinas Kit no meu site.

Coloque o script abaixo em TODAS as páginas, uma única vez, logo antes do fechamento da tag </body>. Se o site usa um framework (Next.js, React, Vue, Astro, WordPress etc.), adicione no layout ou tema base, para carregar em todas as páginas:

${script}

Regras:
- Não altere os atributos data-pk e data-api.
- Não crie HTML, CSS ou JavaScript extra: o script desenha o botão e o formulário sozinho.
- Opcional: se quiser escolher onde o formulário aparece, coloque <div data-pinas-form></div> nesse lugar. Sem isso, ele entra automaticamente antes do rodapé.`;
  return (
    <div className="space-y-4">
      <div className={`rounded-lg p-3 text-sm ${installed ? "bg-success-soft text-emerald-800" : "bg-amber-50 text-amber-900"}`}>
        {installed ? "Instalação detectada: seu site já está enviando dados." : "Ainda não detectamos a instalação. Depois de colar o código, abra seu site e clique em Verificar."}
      </div>
      <div className="flex gap-1 rounded-lg bg-bg p-1 text-sm" role="tablist">
        <button type="button" role="tab" aria-selected={tab === "code"} onClick={() => setTab("code")} className={`flex-1 rounded-md py-2 font-semibold ${tab === "code" ? "bg-card shadow-sm" : "text-mute"}`}>Código</button>
        <button type="button" role="tab" aria-selected={tab === "ai"} onClick={() => setTab("ai")} className={`flex-1 rounded-md py-2 font-semibold ${tab === "ai" ? "bg-card shadow-sm" : "text-mute"}`}>Pedir para uma IA</button>
      </div>
      {tab === "code" ? (
        <>
          <p className="text-sm text-mute">Cole este código no seu site, uma vez, antes de <code>&lt;/body&gt;</code>. Mudanças feitas aqui no painel atualizam sozinhas, sem trocar o código.</p>
          <CopyBox label="Código de instalação" text={script} />
        </>
      ) : (
        <>
          <p className="text-sm text-mute">Não mexe com código? Cole este texto no ChatGPT, Claude, Lovable, Cursor ou mande para quem cuida do seu site.</p>
          <CopyBox label="Pedido pronto" text={prompt} />
        </>
      )}
      <CopyBox label="Sem site? Use o link direto (bio do Instagram, anúncios, mensagens)" text={`${appUrl}/b/${publicKey}`} />
      <Button type="button" variant="outline" onClick={() => router.refresh()}><RefreshCw size={16} />Verificar instalação</Button>
    </div>
  );
}
