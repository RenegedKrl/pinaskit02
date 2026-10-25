"use client";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, X } from "lucide-react";

/**
 * Tour guiado do painel: escurece a tela, deixa só o ponto certo clicável e mostra um balão com seta.
 * Cada passo vive numa página; ao clicar no destaque que leva a outra página, o tour segue sozinho.
 * Abre na primeira visita; depois, só pelo botão "Tutorial" (evento "pk-tour").
 */
interface Step { page: string /* "*" = qualquer tela do painel */; target?: string; title: string; text: string; next?: string /* página que avança o passo ao ser aberta */ }

const STEPS: Step[] = [
  { page: "/painel", title: "Bem-vindo ao Pinas Kit!", text: "Vou te mostrar, na prática, onde fica cada coisa. Leva 1 minuto. Você pode sair quando quiser." },
  { page: "*", target: 'a[href="/painel/captacao"]', next: "/painel/captacao", title: "Comece pelo seu botão",
    text: "Aqui você cria o botão de WhatsApp e o formulário que vão no seu site. Clique em \"Botões e formulários\"." },
  { page: "/painel/captacao", target: 'a[href="/painel/captacao/novo"]', next: "/painel/captacao/novo", title: "Crie um ponto de contato",
    text: "Clique em \"Novo\" para criar um botão, um formulário ou os dois." },
  { page: "/painel/captacao/novo", target: '[data-tour="editor"]', title: "Monte do seu jeito",
    text: "Escolha o modo, informe o WhatsApp que recebe os contatos e ajuste cores e textos vendo a prévia. Depois é só salvar e copiar a linha de código para o seu site." },
  { page: "*", target: 'a[href="/painel/contatos"]', next: "/painel/contatos", title: "Os contatos chegam aqui",
    text: "Cada pessoa que preencher seu formulário aparece em Contatos, com a origem. Clique em \"Contatos\"." },
  { page: "/painel/contatos", target: '[data-tour="filtros"]', title: "Encontre qualquer contato",
    text: "Busque pelo nome ou telefone e filtre por período, origem, ponto de contato, temperatura e etapa. Também dá para exportar para Excel." },
  { page: "*", target: 'a[href="/painel/funil"]', next: "/painel/funil", title: "Organize o atendimento",
    text: "No Funil você acompanha cada contato até a venda. Clique em \"Funil\"." },
  { page: "/painel/funil", target: '[data-tour="quadro"]', title: "Arraste entre as etapas",
    text: "Segure um contato e solte em outra coluna conforme o atendimento avança. No celular, use a caixa de etapa do cartão." },
  { page: "/painel/funil", target: '[data-tour="editar-etapas"]', title: "As etapas são suas",
    text: "Crie, renomeie, reordene ou apague colunas do funil (até 10). \"Novo\", \"Venda concluída\" e \"Não convertido\" podem ser renomeadas." },
  { page: "*", target: 'a[href="/painel/configuracoes"]', next: "/painel/configuracoes", title: "Sua equipe e seus sites",
    text: "Em Configurações você cadastra os sites e convida a equipe. Clique para conhecer." },
  { page: "*", target: 'a[href="/painel"]', next: "/painel", title: "Volte ao Início",
    text: "No Início ficam os números: quem viu, quem clicou e quem virou contato. Clique em \"Início\"." },
  { page: "/painel", target: '[data-tour="tutorial"]', title: "Pronto!",
    text: "Quando quiser rever este passo a passo, é só clicar em \"Tutorial\". Bom trabalho!" },
];
const KEY = "pk-tour"; const SEEN = "pk-tutorial-visto"; const PAD = 6;

function visible(sel: string): HTMLElement | null {
  for (const el of document.querySelectorAll<HTMLElement>(sel)) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return el;
  }
  return null;
}
const store = { get: () => { try { const v = sessionStorage.getItem(KEY); return v === null ? null : Number(v); } catch { return null; } },
  set: (i: number | null) => { try { if (i === null) sessionStorage.removeItem(KEY); else sessionStorage.setItem(KEY, String(i)); } catch { /* */ } } };

export function Tour() {
  const path = usePathname(); const router = useRouter();
  const [i, setI] = useState<number | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const step = i === null ? null : STEPS[i];

  const go = useCallback((n: number | null) => { store.set(n); setI(n); setRect(null); }, []);
  const finish = useCallback(() => { go(null); try { localStorage.setItem(SEEN, "1"); } catch { /* */ } }, [go]);

  // começa: pelo botão "Tutorial", na primeira visita, ou continua de onde parou (após mudar de página)
  useEffect(() => {
    const start = () => { go(0); if (location.pathname !== "/painel") router.push("/painel"); };
    window.addEventListener("pk-tour", start);
    const saved = store.get();
    if (saved !== null) setI(saved);
    else { try { if (!localStorage.getItem(SEEN) && location.pathname === "/painel") go(0); } catch { /* */ } }
    return () => window.removeEventListener("pk-tour", start);
  }, [go, router]);

  // ao abrir a página que o destaque levava, avança
  useEffect(() => {
    if (step?.next && path === step.next && i !== null) go(i + 1);
  }, [path, step, i, go]);

  // acha o destaque (pode demorar a aparecer) e acompanha rolagem/redimensionamento
  useLayoutEffect(() => {
    if (!step || (step.page !== "*" && step.page !== path)) { setRect(null); return; }
    if (!step.target) { setRect(null); return; }
    let el: HTMLElement | null = null; let tries = 0;
    const measure = () => { if (el) setRect(el.getBoundingClientRect()); };
    const find = window.setInterval(() => {
      el = visible(step.target!); tries++;
      if (el) { window.clearInterval(find); el.scrollIntoView({ block: "center", behavior: "smooth" }); window.setTimeout(measure, 350); }
      else if (tries > 20) window.clearInterval(find); // não achou (ex.: menu escondido no celular): balão no centro
    }, 100);
    window.addEventListener("resize", measure); window.addEventListener("scroll", measure, true);
    return () => { window.clearInterval(find); window.removeEventListener("resize", measure); window.removeEventListener("scroll", measure, true); };
  }, [step, path]);

  useEffect(() => {
    if (!step) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") finish(); };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [step, finish]);

  if (!step || i === null) return null;
  const wrongPage = step.page !== "*" && step.page !== path;
  const last = i === STEPS.length - 1;
  function next() {
    if (last) return finish();
    const n = STEPS[i! + 1]; go(i! + 1);
    if (n.page !== "*" && n.page !== path) router.push(n.page);
  }

  // recorte: 4 faixas escuras em volta do destaque (o destaque continua clicável)
  const h = rect && !wrongPage ? { x: rect.left - PAD, y: rect.top - PAD, w: rect.width + PAD * 2, h: rect.height + PAD * 2 } : null;
  const shade = "fixed bg-slate-950/75 z-[70]";
  const tall = !!h && h.h > window.innerHeight * 0.55; // área grande: balão fixo no canto, sem seta
  const below = h ? h.y + h.h + 220 < window.innerHeight : true;
  const bubbleTop = h ? (below ? h.y + h.h + 12 : Math.max(12, h.y - 12)) : undefined;
  const bubbleLeft = h ? Math.min(Math.max(12, h.x + h.w / 2 - 170), window.innerWidth - 352) : undefined;
  const arrowLeft = h && bubbleLeft !== undefined ? Math.min(Math.max(16, h.x + h.w / 2 - bubbleLeft - 8), 316) : 0;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="tour-titulo">
      {h ? (<>
        <div className={shade} style={{ left: 0, top: 0, right: 0, height: Math.max(0, h.y) }} onClick={(e) => e.stopPropagation()} />
        <div className={shade} style={{ left: 0, top: h.y + h.h, right: 0, bottom: 0 }} />
        <div className={shade} style={{ left: 0, top: h.y, width: Math.max(0, h.x), height: h.h }} />
        <div className={shade} style={{ left: h.x + h.w, top: h.y, right: 0, height: h.h }} />
        <div className="pointer-events-none fixed z-[71] rounded-lg ring-2 ring-primary ring-offset-2 ring-offset-transparent" style={{ left: h.x, top: h.y, width: h.w, height: h.h }} />
      </>) : <div className={`${shade} inset-0`} />}

      <div className="fixed z-[72] w-[340px] max-w-[calc(100vw-24px)] rounded-xl border border-line bg-card p-4 text-ink shadow-xl"
        style={tall ? { right: 16, bottom: 16 } : h ? { top: bubbleTop, left: bubbleLeft, transform: below ? undefined : "translateY(-100%)" } : { top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
        {h && !tall && <span aria-hidden="true" className={`absolute h-4 w-4 rotate-45 border-line bg-card ${below ? "-top-2 border-l border-t" : "-bottom-2 border-b border-r"}`} style={{ left: arrowLeft }} />}
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-semibold text-primary">Passo {i + 1} de {STEPS.length}</p>
          <button onClick={finish} aria-label="Sair do tutorial" className="-m-1 rounded p-1 text-mute hover:bg-bg"><X size={16} /></button>
        </div>
        <h2 id="tour-titulo" className="mt-1 font-semibold">{wrongPage ? "Vamos continuar" : step.title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-mute">{wrongPage ? "O próximo passo fica em outra tela." : step.text}</p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <button onClick={finish} className="text-sm text-mute hover:text-ink">Pular tutorial</button>
          {wrongPage ? <button onClick={() => router.push(step.page)} className="inline-flex h-9 items-center gap-1 rounded-lg bg-primary px-3 text-sm font-semibold text-white">Ir para lá<ArrowRight size={14} /></button>
            : (!step.next || !h) && <button onClick={next} className="inline-flex h-9 items-center gap-1 rounded-lg bg-primary px-3 text-sm font-semibold text-white">{last ? "Concluir" : "Próximo"}{!last && <ArrowRight size={14} />}</button>}
        </div>
      </div>
    </div>
  );
}
