"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BarChart3, GraduationCap, KanbanSquare, Link2, MousePointerClick, Settings, Users, X, Code2 } from "lucide-react";
import { Button } from "@/components/ui";

const SEEN = "pk-tutorial-visto";

const STEPS = [
  { icon: GraduationCap, title: "Bem-vindo ao Pinas Kit", href: null, cta: null,
    text: "Em poucos minutos você coloca um botão de WhatsApp e um formulário no seu site, e passa a saber de qual anúncio, página ou campanha veio cada contato. Este guia mostra o caminho, passo a passo." },
  { icon: MousePointerClick, title: "1. Crie seu botão ou formulário", href: "/painel/captacao/novo", cta: "Criar agora",
    text: "Em \"Botões e formulários\", clique em Novo. Escolha o modo (botão flutuante, formulário antes do rodapé ou os dois), informe o WhatsApp que recebe os contatos e ajuste cores e textos vendo a prévia ao lado." },
  { icon: Code2, title: "2. Instale no seu site", href: "/painel/captacao", cta: "Ver meus botões",
    text: "Depois de salvar, copie a linha de código e cole antes de </body> em todas as páginas (WordPress, Wix, Webflow, Shopify ou site próprio). Também dá para copiar um texto pronto e pedir para uma IA instalar. Quando a primeira visita chegar, aparece \"Instalado\"." },
  { icon: Link2, title: "3. Use links com origem nos anúncios", href: "/painel/captacao/links", cta: "Criar link com origem",
    text: "Em \"Criar link com origem\", monte o endereço do seu site com as marcações de campanha (UTM) para Google e Meta. Assim cada contato chega dizendo de qual anúncio veio." },
  { icon: Users, title: "4. Acompanhe os contatos", href: "/painel/contatos", cta: "Abrir contatos",
    text: "Cada pessoa que preenche o formulário vira um contato com nome, WhatsApp, origem e temperatura (frio, morno ou quente). Abra a ficha para ver a jornada no site, anotar e falar no WhatsApp com um clique. Dá para filtrar e exportar para Excel." },
  { icon: KanbanSquare, title: "5. Organize no funil", href: "/painel/funil", cta: "Abrir funil",
    text: "No Funil, arraste os contatos entre as etapas conforme o atendimento avança. Em \"Editar etapas\" você cria, renomeia, reordena e apaga colunas (até 10). Ao concluir uma venda, preencha o valor na ficha." },
  { icon: BarChart3, title: "6. Veja os resultados no Início", href: null, cta: null,
    text: "Aqui no Início ficam quantas pessoas viram seu botão, clicaram no WhatsApp, viraram contato e de onde vieram, nos últimos 7, 30 ou 90 dias. Os números só contam o que realmente aconteceu." },
  { icon: Settings, title: "7. Convide sua equipe", href: "/painel/configuracoes", cta: "Abrir configurações",
    text: "Em Configurações você cadastra os sites, convida pessoas da equipe (com permissão de administrador, atendente ou só leitura) e apaga dados quando precisar. Pronto: é só isso!" },
];

/** Guia passo a passo do painel. Abre sozinho na primeira visita; depois, pelo botão "Tutorial". */
export function Tutorial() {
  const ref = useRef<HTMLDialogElement>(null);
  const [i, setI] = useState(0);
  function open() { setI(0); ref.current?.showModal(); }
  function close() { ref.current?.close(); try { localStorage.setItem(SEEN, "1"); } catch { /* sem armazenamento */ } }
  useEffect(() => {
    try { if (!localStorage.getItem(SEEN)) ref.current?.showModal(); } catch { /* sem armazenamento */ }
  }, []);
  const s = STEPS[i]; const Icon = s.icon; const last = i === STEPS.length - 1;

  return (
    <>
      <Button variant="outline" onClick={open}><GraduationCap size={16} />Tutorial</Button>
      <dialog ref={ref} onClose={close} aria-labelledby="tutorial-titulo"
        className="m-auto w-[min(520px,calc(100vw-32px))] rounded-xl border border-line bg-card p-0 text-ink backdrop:bg-black/40">
        <div className="flex items-center justify-between px-5 pt-4">
          <p className="text-xs font-semibold text-mute">Passo {i + 1} de {STEPS.length}</p>
          <button onClick={close} aria-label="Fechar tutorial" className="rounded-lg p-2 text-mute hover:bg-bg"><X size={18} /></button>
        </div>
        <div className="px-6 pb-2 pt-2">
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-primary-soft text-primary"><Icon size={22} /></span>
          <h2 id="tutorial-titulo" className="mt-4 text-xl font-semibold">{s.title}</h2>
          <p className="mt-2 leading-relaxed text-mute">{s.text}</p>
          {s.href && <Link href={s.href} onClick={close} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">{s.cta}<ArrowRight size={14} /></Link>}
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-line px-5 py-4">
          <div className="flex gap-1.5" aria-hidden="true">
            {STEPS.map((_, n) => <span key={n} className={`h-1.5 rounded-full transition-all ${n === i ? "w-5 bg-primary" : "w-1.5 bg-line"}`} />)}
          </div>
          <div className="flex gap-2">
            {i > 0 && <Button variant="outline" size="sm" onClick={() => setI(i - 1)}><ArrowLeft size={14} />Voltar</Button>}
            {last ? <Button size="sm" onClick={close}>Concluir</Button> : <Button size="sm" onClick={() => setI(i + 1)}>Próximo<ArrowRight size={14} /></Button>}
          </div>
        </div>
      </dialog>
    </>
  );
}
