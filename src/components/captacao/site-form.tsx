"use client";
import { Field, Input, Select } from "@/components/ui";
import type { WidgetConfig } from "@shared/widget-config";

type Existing = WidgetConfig["form"]["existing"];

/** true se o texto é um seletor CSS que o navegador aceita. */
export function validSelector(s: string) {
  if (!s.trim()) return true;
  try { document.createDocumentFragment().querySelector(s); return true; } catch { return false; }
}

const FIELDS = [["name", "Nome", '[name="nome"]'], ["phone", "WhatsApp / telefone", '[name="whatsapp"]'],
  ["email", "E-mail", '[name="email"]'], ["message", "Mensagem", '[name="mensagem"]']] as const;

/** Seção "Formulário do seu site": conecta um formulário que já existe na página. */
export function SiteForm({ value, onChange }: { value: Existing; onChange: (v: Existing) => void }) {
  const set = (p: Partial<Existing>) => onChange({ ...value, ...p });
  const badSel = !validSelector(value.selector);
  return (
    <div className="space-y-4 rounded-xl border border-line p-4">
      <div>
        <p className="font-semibold">Formulário do seu site</p>
        <p className="text-sm text-mute">Se o seu site já tem um formulário, o Pinas Kit pode receber os contatos dele também. Deixe vazio se não tiver.</p>
      </div>
      <Field label="Seletor do formulário" hint="Se precisar, peça ao seu desenvolvedor.">
        <Input placeholder='form[name="contato"]' value={value.selector} onChange={(e) => set({ selector: e.target.value })} />
      </Field>
      {badSel && <p className="text-sm text-red-700">Esse seletor não é válido. Confira aspas e colchetes.</p>}
      <Field label="O que fazer com o formulário do site">
        {/* "connect" é o valor antigo; equivale a "add" */}
        <Select value={value.action === "replace" ? "replace" : "add"} onChange={(e) => set({ action: e.target.value as "add" })}>
          <option value="add">Manter o formulário do site e também capturar o contato</option>
          <option value="replace">Esconder o formulário do site e mostrar o do Pinas Kit</option>
        </Select>
      </Field>
      <details className="rounded-xl bg-bg p-3">
        <summary className="cursor-pointer text-sm font-semibold">Mapear campos (opcional)</summary>
        <p className="mt-2 text-sm text-mute">Se ficar vazio, o Pinas Kit acha sozinho: telefone (tel/whats/phone), nome (nome/name), e-mail e o campo de texto grande para a mensagem.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {FIELDS.map(([k, l, ph]) => {
            const bad = !validSelector(value.map[k]);
            return (
              <Field key={k} label={l}>
                <Input placeholder={ph} value={value.map[k]} onChange={(e) => set({ map: { ...value.map, [k]: e.target.value } })} />
                {bad && <p className="mt-1 text-sm text-red-700">Seletor inválido.</p>}
              </Field>
            );
          })}
        </div>
        <p className="mt-2 text-sm text-mute">Use um seletor CSS (ex.: <code>[name=&quot;whatsapp&quot;]</code>) ou só o name do campo (ex.: <code>whatsapp</code>).</p>
      </details>
    </div>
  );
}
