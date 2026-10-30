"use client";
import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button, Card, Field, Input, Select, Textarea } from "@/components/ui";
import { MODES } from "@/lib/copy";
import { cn } from "@/lib/utils";
import { ADS_SEND_TO, type Mode, type Rules, type WidgetConfig } from "@shared/widget-config";
import { saveWidget } from "@/app/painel/captacao/actions";
import { Preview } from "./preview";
import { SiteForm, validSelector } from "./site-form";

export interface EditorProps { id: string | null; name: string; mode: Mode; whatsapp: string; isActive: boolean; config: WidgetConfig }

function Section({ n, title, desc, children }: { n: number; title: string; desc?: string; children: ReactNode }) {
  return (
    <Card>
      <h2 className="font-display font-semibold"><span className="mr-2 text-primary">{n}.</span>{title}</h2>
      {desc && <p className="mb-1 text-sm text-mute">{desc}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </Card>
  );
}

function Check({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 size-4 accent-primary" />
      <span><span className="text-[15px] font-medium">{label}</span>{hint && <span className="block text-sm text-mute">{hint}</span>}</span>
    </label>
  );
}

function RulesEditor({ value, onChange }: { value: Rules; onChange: (r: Rules) => void }) {
  return (
    <div className="space-y-2">
      <Select value={value.mode} onChange={(e) => onChange({ ...value, mode: e.target.value as Rules["mode"] })}>
        <option value="all">Em todas as páginas</option>
        <option value="include">Somente nas páginas abaixo</option>
        <option value="exclude">Esconder nas páginas abaixo</option>
      </Select>
      {value.mode !== "all" && (
        <>
          {value.items.map((r, i) => (
            <div key={i} className="flex gap-2">
              <Select className="w-40" value={r.match} onChange={(e) => onChange({ ...value, items: value.items.map((x, j) => (j === i ? { ...x, match: e.target.value as typeof r.match } : x)) })}>
                <option value="contains">Contém</option><option value="exact">Igual a</option><option value="starts_with">Começa com</option><option value="regex">Regex (avançado)</option>
              </Select>
              <Input placeholder="/servicos" value={r.value} onChange={(e) => onChange({ ...value, items: value.items.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)) })} />
              <button type="button" aria-label="Remover regra" className="px-2 text-mute" onClick={() => onChange({ ...value, items: value.items.filter((_, j) => j !== i) })}><Trash2 size={16} /></button>
            </div>
          ))}
          <Button type="button" size="sm" variant="ghost" onClick={() => onChange({ ...value, items: [...value.items, { match: "contains", value: "" }] })}><Plus size={15} />Adicionar regra</Button>
          <p className="text-sm text-mute">A regra é comparada com o endereço completo da página.</p>
        </>
      )}
    </div>
  );
}

export function Editor(p: EditorProps) {
  const router = useRouter();
  const [name, setName] = useState(p.name);
  const [mode, setMode] = useState<Mode>(p.mode);
  const [whatsapp, setWhatsapp] = useState(p.whatsapp);
  const [active, setActive] = useState(p.isActive);
  const [c, setC] = useState<WidgetConfig>(p.config);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const set = <K extends keyof WidgetConfig>(k: K, v: WidgetConfig[K]) => setC((x) => ({ ...x, [k]: v }));
  const setF = <K extends keyof WidgetConfig["form"]>(k: K, v: WidgetConfig["form"][K]) => setC((x) => ({ ...x, form: { ...x.form, [k]: v } }));
  const q = c.form.question;
  const hasButton = mode !== "form", hasForm = mode !== "button";

  const save = () => start(async () => {
    setMsg(null);
    if (!validSelector(c.form.existing.selector)) return setMsg({ ok: false, text: "O seletor do formulário do site não é válido." });
    const r = await saveWidget(p.id, { name, mode, whatsapp, is_active: active, config: c });
    if (r.error) return setMsg({ ok: false, text: r.error });
    setMsg({ ok: true, text: p.id ? "Alterações salvas. Seu site atualiza em até 1 minuto." : "Pronto! Agora instale no seu site." });
    if (!p.id && r.id) router.push(`/painel/captacao/${r.id}?instalar=1`);
    else router.refresh();
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4" data-tour="editor">
        <Section n={1} title="Como você quer receber contatos?">
          <div className="grid gap-3 sm:grid-cols-3">
            {(Object.keys(MODES) as Mode[]).map((m) => (
              <button key={m} type="button" onClick={() => setMode(m)} aria-pressed={mode === m}
                className={cn("rounded-xl border-2 p-4 text-left", mode === m ? "border-primary bg-primary-soft" : "border-line hover:border-primary/40")}>
                <span className="font-display font-semibold">{MODES[m].label}</span>
                <span className="mt-1 block text-sm text-mute">{MODES[m].desc}</span>
              </button>
            ))}
          </div>
        </Section>

        <Section n={2} title="Informações básicas">
          <Field label="Nome interno" hint="Só você vê. Ex.: Site principal."><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="WhatsApp que vai receber os contatos" hint="Com código do país e DDD. Este número não aparece no código do seu site.">
            <Input type="tel" placeholder="55 11 99999-8888" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
          </Field>
          <Field label="Cor principal"><div className="flex gap-2"><input type="color" aria-label="Escolher cor" value={c.color} onChange={(e) => set("color", e.target.value)} className="h-11 w-14 rounded-lg border border-line" /><Input value={c.color} onChange={(e) => set("color", e.target.value)} /></div></Field>
          <Check label="Ativo" checked={active} onChange={setActive} hint="Desligue para tirar do site sem apagar." />
          <Check label="Distribuir entre a equipe (rodízio)" checked={c.rotation} onChange={(v) => set("rotation", v)}
            hint="Cada contato novo vai para o próximo atendente da fila, e o WhatsApp abre no número dele. Configure quem participa em Configurações › Rodízio. Sem ninguém na fila, usa o número acima." />
        </Section>

        {hasButton && (
          <Section n={3} title="Botão de WhatsApp">
            <Field label="Texto do botão"><Input value={c.label} onChange={(e) => set("label", e.target.value)} /></Field>
            <Field label="Saudação do balão"><Input value={c.greeting} onChange={(e) => set("greeting", e.target.value)} /></Field>
            <Field label="Nome do atendente (opcional)"><Input placeholder="Ex.: Marina" value={c.attendantName} onChange={(e) => set("attendantName", e.target.value)} /></Field>
            <Field label="Posição"><Select value={c.position} onChange={(e) => set("position", e.target.value as "left" | "right")}><option value="right">Canto inferior direito</option><option value="left">Canto inferior esquerdo</option></Select></Field>
            {mode === "both" ? (
              <Field label="Ao clicar no botão" hint="Rolar até o formulário evita dois formulários iguais na tela.">
                <Select value={c.buttonClick} onChange={(e) => set("buttonClick", e.target.value as WidgetConfig["buttonClick"])}>
                  <option value="scroll">Rolar até o formulário da página</option><option value="miniform">Mostrar mini-formulário no balão</option><option value="whatsapp">Abrir o WhatsApp direto</option>
                </Select>
              </Field>
            ) : (
              <Check label="Pedir nome e WhatsApp antes de abrir a conversa" checked={c.buttonForm} onChange={(v) => set("buttonForm", v)} hint="Assim a pessoa vira contato no seu painel, mesmo que não mande mensagem." />
            )}
            <Check label="Mostrar como online" checked={c.online} onChange={(v) => set("online", v)} />
          </Section>
        )}

        {(hasForm || c.buttonForm) && (
          <Section n={4} title="Formulário" desc="Menos campos = mais pessoas preenchem.">
            {hasForm && <Field label="Título"><Input value={c.form.title} onChange={(e) => setF("title", e.target.value)} /></Field>}
            {hasForm && <Field label="Descrição"><Textarea rows={2} value={c.form.description} onChange={(e) => setF("description", e.target.value)} /></Field>}
            <Field label="Texto do botão de envio"><Input value={c.form.submitLabel} onChange={(e) => setF("submitLabel", e.target.value)} /></Field>
            <div className="space-y-2">
              <p className="text-sm font-semibold">Campos</p>
              <p className="text-sm text-mute">WhatsApp é sempre pedido.</p>
              <Check label="Nome" checked={c.form.askName} onChange={(v) => setF("askName", v)} />
              <Check label="E-mail" checked={c.form.askEmail} onChange={(v) => setF("askEmail", v)} />
              {hasForm && <Check label="Mensagem livre" checked={c.form.askMessage} onChange={(v) => setF("askMessage", v)} />}
              <Check label="Caixa de autorização (LGPD)" checked={c.form.consent} onChange={(v) => setF("consent", v)} />
              {hasForm && <Check label="Pergunta de qualificação" checked={q.enabled} onChange={(v) => setF("question", { ...q, enabled: v })} hint="Ajuda a saber quem está pronto para comprar. Cada resposta soma pontos ao contato." />}
            </div>
            {hasForm && q.enabled && (
              <div className="space-y-2 rounded-xl bg-bg p-3">
                <Field label="Pergunta"><Input value={q.label} onChange={(e) => setF("question", { ...q, label: e.target.value })} /></Field>
                {q.options.map((o, i) => (
                  <div key={i} className="flex gap-2">
                    <Input aria-label="Opção" value={o.label} onChange={(e) => setF("question", { ...q, options: q.options.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
                    <Input aria-label="Pontos" type="number" className="w-24" value={o.points} onChange={(e) => setF("question", { ...q, options: q.options.map((x, j) => (j === i ? { ...x, points: Number(e.target.value) } : x)) })} />
                    <button type="button" aria-label="Remover opção" className="px-2 text-mute" onClick={() => setF("question", { ...q, options: q.options.filter((_, j) => j !== i) })}><Trash2 size={16} /></button>
                  </div>
                ))}
                <Button type="button" size="sm" variant="ghost" onClick={() => setF("question", { ...q, options: [...q.options, { label: "", points: 0 }] })}><Plus size={15} />Adicionar opção</Button>
              </div>
            )}
            {hasForm && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Cores do formulário"><Select value={c.form.theme} onChange={(e) => setF("theme", e.target.value as "auto")}><option value="auto">Automático (combina com o site)</option><option value="light">Claro</option><option value="dark">Escuro</option></Select></Field>
                <Field label="Largura"><Select value={c.form.width} onChange={(e) => setF("width", e.target.value as "narrow")}><option value="narrow">Centralizado (até 640 px)</option><option value="content">Igual ao conteúdo do site</option></Select></Field>
              </div>
            )}
            <SiteForm value={c.form.existing} onChange={(v) => setF("existing", v)} />
          </Section>
        )}

        <Section n={5} title="Depois do envio">
          <Select value={c.after.type} onChange={(e) => set("after", { ...c.after, type: e.target.value as "whatsapp" })}>
            <option value="whatsapp">Abrir o WhatsApp com a mensagem pronta</option><option value="message">Mostrar uma mensagem de sucesso</option><option value="redirect">Ir para uma página de obrigado</option>
          </Select>
          {c.after.type === "whatsapp" && <Field label="Mensagem que a pessoa envia" hint="Use {nome}, {opcao} e {mensagem}."><Textarea rows={2} value={c.template} onChange={(e) => set("template", e.target.value)} /></Field>}
          {c.after.type === "message" && <Field label="Mensagem de sucesso"><Input value={c.after.message} onChange={(e) => set("after", { ...c.after, message: e.target.value })} /></Field>}
          {c.after.type === "redirect" && <Field label="Endereço da página de obrigado"><Input type="url" placeholder="https://seusite.com.br/obrigado" value={c.after.url} onChange={(e) => set("after", { ...c.after, url: e.target.value })} /></Field>}
        </Section>

        <Section n={6} title="Onde aparece">
          {hasButton && <Field label="Botão"><RulesEditor value={c.buttonRules} onChange={(r) => set("buttonRules", r)} /></Field>}
          {hasForm && <Field label="Formulário"><RulesEditor value={c.formRules} onChange={(r) => set("formRules", r)} /></Field>}
        </Section>

        <Section n={7} title="Horário de atendimento" desc="Fora do horário, o balão avisa quando você volta. O contato é salvo do mesmo jeito.">
          <Check label="Usar horário de atendimento" checked={c.hours.enabled} onChange={(v) => set("hours", { ...c.hours, enabled: v })} />
          {c.hours.enabled && (
            <>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Dias de atendimento">
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d, i) => {
                  const on = c.hours.days.includes(i);
                  return <button key={d} type="button" aria-pressed={on} onClick={() => set("hours", { ...c.hours, days: on ? c.hours.days.filter((x) => x !== i) : [...c.hours.days, i].sort() })}
                    className={cn("h-10 w-12 rounded-lg border text-sm font-semibold", on ? "border-primary bg-primary text-white" : "border-line text-mute")}>{d}</button>;
                })}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Abre às"><Input type="time" value={c.hours.from} onChange={(e) => set("hours", { ...c.hours, from: e.target.value })} /></Field>
                <Field label="Fecha às"><Input type="time" value={c.hours.to} onChange={(e) => set("hours", { ...c.hours, to: e.target.value })} /></Field>
              </div>
              <Field label="Mensagem fora do horário"><Input maxLength={160} value={c.hours.offMessage} onChange={(e) => set("hours", { ...c.hours, offMessage: e.target.value })} /></Field>
              <p className="text-sm text-mute">Horário de Brasília.</p>
            </>
          )}
        </Section>

        <Section n={8} title="Conversões nos anúncios" desc="Quando alguém envia o formulário, o Pinas Kit avisa os pixels que já estão no seu site. Isso ajuda o anúncio a achar mais pessoas parecidas.">
          <Check label="Meta (Facebook e Instagram)" checked={c.pixels.meta} onChange={(v) => set("pixels", { ...c.pixels, meta: v })} hint='Dispara o evento "Lead" no Pixel da Meta.' />
          <Check label="Google Analytics 4" checked={c.pixels.google} onChange={(v) => set("pixels", { ...c.pixels, google: v })} hint='Dispara o evento "generate_lead".' />
          <Field label="Rótulo de conversão do Google Ads (opcional)" hint="Formato AW-123456789/AbCdEf. Está em Google Ads › Metas › Conversões › Configuração da tag.">
            <Input placeholder="AW-123456789/AbCdEfGh" value={c.pixels.adsSendTo} onChange={(e) => set("pixels", { ...c.pixels, adsSendTo: e.target.value.trim() })} />
          </Field>
          {c.pixels.adsSendTo && !ADS_SEND_TO.test(c.pixels.adsSendTo) && <p className="text-sm text-red-700">Esse rótulo não parece no formato AW-número/código.</p>}
          <p className="text-sm text-mute">O Pinas Kit não instala os pixels: eles precisam já estar no site (ou no Google Tag Manager, que recebe o evento &quot;pinas_lead&quot;). Se o site pedir consentimento, nada é disparado sem ele.</p>
        </Section>

        <details className="rounded-2xl border border-line bg-card p-5">
          <summary className="cursor-pointer font-display font-semibold">Opções avançadas</summary>
          <div className="mt-4 space-y-4">
            {hasButton && <Field label="Mensagem do link direto" hint="Usada quando a pessoa abre o WhatsApp sem preencher formulário."><Input value={c.prefill} onChange={(e) => set("prefill", e.target.value)} /></Field>}
            {hasForm && (
              <>
                <Field label="Inserir antes de (seletor CSS)" hint="Deixe vazio para entrar antes do rodapé automaticamente. Ou coloque <div data-pinas-form></div> no seu site.">
                  <Input placeholder="#rodape" value={c.form.insertBefore} onChange={(e) => setF("insertBefore", e.target.value)} />
                </Field>
              </>
            )}
          </div>
        </details>

        <div className="sticky bottom-20 z-10 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-card/95 p-3 backdrop-blur md:bottom-4">
          <Button onClick={save} disabled={pending}>{pending ? "Salvando…" : p.id ? "Salvar alterações" : "Criar e instalar"}</Button>
          {msg && <p role="status" className={cn("text-sm", msg.ok ? "text-emerald-700" : "text-red-700")}>{msg.text}</p>}
        </div>
      </div>
      <div className="lg:sticky lg:top-6 lg:self-start"><Preview mode={mode} c={c} /></div>
    </div>
  );
}
