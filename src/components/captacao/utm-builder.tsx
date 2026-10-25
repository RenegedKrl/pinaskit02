"use client";
import { useMemo, useState } from "react";
import { Card, Field, Input, Select } from "@/components/ui";

const PRESETS = {
  meta: { label: "Meta Ads (Facebook e Instagram)", source: "meta", medium: "paid", campaign: "{{campaign.name}}", content: "{{ad.name}}", term: "{{adset.name}}",
    tip: "No Gerenciador de Anúncios, cole só a parte depois do ? no campo \"Parâmetros de URL\". A Meta troca {{campaign.name}} pelo nome real da campanha." },
  google: { label: "Google Ads", source: "google", medium: "cpc", campaign: "nome_da_campanha", content: "{campaignid}", term: "{keyword}",
    tip: "Troque nome_da_campanha pelo nome que você reconhece (o Google não preenche o nome sozinho). No Google Ads, cole o link completo no campo \"Modelo de acompanhamento\" ou no \"Sufixo do URL final\" (só a parte depois do ?). Deixe a codificação automática (gclid) ligada." },
  instagram: { label: "Bio ou post do Instagram", source: "instagram", medium: "social", campaign: "bio", content: "", term: "", tip: "Use este link na bio ou nos stories." },
  outro: { label: "Outro (e-mail, panfleto, parceiro)", source: "", medium: "", campaign: "", content: "", term: "", tip: "Preencha a origem com um nome que você vai reconhecer depois." },
};

export function UtmBuilder() {
  const [url, setUrl] = useState("https://");
  const [kind, setKind] = useState<keyof typeof PRESETS>("meta");
  const [v, setV] = useState({ ...PRESETS.meta });
  const pick = (k: keyof typeof PRESETS) => { setKind(k); setV({ ...PRESETS[k] }); };
  const params = useMemo(() => {
    const p: string[] = [];
    (["source", "medium", "campaign", "content", "term"] as const).forEach((k) => { if (v[k]) p.push(`utm_${k}=${v[k].replace(/\s+/g, "_")}`); });
    return p.join("&");
  }, [v]);
  const full = url && url !== "https://" ? `${url}${url.includes("?") ? "&" : "?"}${params}` : "";
  return (
    <Card className="max-w-3xl space-y-4">
      <Field label="Onde o link vai ser usado?">
        <Select value={kind} onChange={(e) => pick(e.target.value as keyof typeof PRESETS)}>
          {Object.entries(PRESETS).map(([k, p]) => <option key={k} value={k}>{p.label}</option>)}
        </Select>
      </Field>
      <Field label="Endereço da sua página"><Input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://seusite.com.br/servico" /></Field>
      <details>
        <summary className="cursor-pointer text-sm font-semibold text-primary">Ajustar detalhes (opcional)</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {(["source", "medium", "campaign", "content", "term"] as const).map((k) => (
            <Field key={k} label={{ source: "Origem", medium: "Tipo", campaign: "Campanha", content: "Anúncio", term: "Público ou palavra-chave" }[k]}>
              <Input value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })} />
            </Field>
          ))}
        </div>
      </details>
      <p className="rounded-lg bg-primary-soft p-3 text-sm">{PRESETS[kind].tip}</p>
      <Field label="Parâmetros (para colar no gerenciador de anúncios)"><Input readOnly value={params} onFocus={(e) => e.target.select()} /></Field>
      <Field label="Link completo"><Input readOnly value={full} placeholder="Preencha o endereço da página" onFocus={(e) => e.target.select()} /></Field>
    </Card>
  );
}
