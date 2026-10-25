"use client";
import { useState } from "react";
import { BarChart3, KanbanSquare, MousePointerClick, UserRound } from "lucide-react";
import { ContactMock, FunnelMock, PhoneMock, ReportMock } from "./mockups";

const TABS = [
  { id: "capte", label: "Capte", icon: MousePointerClick, title: "Botão e formulário que entram sozinhos no seu site", text: "Escolha botão flutuante, formulário antes do rodapé ou os dois. Cada pessoa que chama já chega com a origem: anúncio, campanha e página.", bg: "from-blue-100 to-sky-50 dark:from-blue-950/60 dark:to-sky-950/30" },
  { id: "organize", label: "Organize", icon: KanbanSquare, title: "Um funil de vendas que você monta do seu jeito", text: "Arraste os contatos entre as etapas, crie suas colunas e saiba exatamente quem está esperando resposta.", bg: "from-violet-100 to-fuchsia-50 dark:from-violet-950/60 dark:to-fuchsia-950/30" },
  { id: "atenda", label: "Atenda", icon: UserRound, title: "Tudo sobre cada contato numa ficha só", text: "De onde veio, quais páginas viu, quando voltou. Lembrete de retorno, responsável da equipe e mensagem pronta no WhatsApp em um clique.", bg: "from-amber-100 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/30" },
  { id: "analise", label: "Analise", icon: BarChart3, title: "Descubra o que vende e o que só gasta", text: "Contatos e vendas por origem, campanha e anúncio. Pare de adivinhar onde colocar seu dinheiro.", bg: "from-emerald-100 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/30" },
] as const;

/** Vitrine com abas (Capte, Organize, Atenda, Analise): cada aba troca a tela mostrada. */
export function Showcase() {
  const [id, setId] = useState<string>("capte");
  const t = TABS.find((x) => x.id === id)!;
  return (
    <div>
      <div role="tablist" aria-label="Recursos" className="mx-auto flex max-w-xl justify-center gap-1 overflow-x-auto border-b border-line">
        {TABS.map((x) => (
          <button key={x.id} role="tab" aria-selected={x.id === id} onClick={() => setId(x.id)}
            className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-[15px] font-semibold transition-colors ${x.id === id ? "border-primary text-ink" : "border-transparent text-mute hover:text-ink"}`}>
            <x.icon size={17} />{x.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className={`mt-8 grid items-center gap-8 rounded-3xl bg-gradient-to-br p-6 md:p-10 lg:grid-cols-[1fr_1.3fr] ${t.bg}`}>
        <div>
          <h3 className="text-2xl font-bold tracking-tight md:text-3xl">{t.title}</h3>
          <p className="mt-3 text-[17px] text-mute">{t.text}</p>
        </div>
        <div className="min-w-0">
          {id === "capte" && <div className="py-2"><PhoneMock /></div>}
          {id === "organize" && <FunnelMock />}
          {id === "atenda" && <ContactMock />}
          {id === "analise" && <div className="grid gap-4"><ReportMock /></div>}
        </div>
      </div>
    </div>
  );
}
