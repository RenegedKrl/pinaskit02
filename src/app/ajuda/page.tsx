import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, LifeBuoy } from "lucide-react";
import { Logo } from "@/components/logo";
import { SupportButton } from "@/components/support-button";

export const metadata: Metadata = { title: "Ajuda — Pinas Kit", description: "Como instalar o Pinas Kit, entender a origem dos contatos e usar o painel." };

const SCRIPT = '<script async src="https://pinaskit.vercel.app/w.js" data-pk="SUA-CHAVE" data-api="..."></script>';

const SECTIONS: { title: string; items: { q: string; a: React.ReactNode }[] }[] = [
  { title: "Instalação", items: [
    { q: "Onde eu pego o código para colocar no site?", a: <>Em <b>Botões e formulários</b>, abra o seu botão e clique em <b>Instalar</b>. Copie a linha que começa com <code>&lt;script</code>. Ela é igual para todas as páginas e não muda quando você edita cores ou textos.</> },
    { q: "Como instalar no WordPress?", a: <><ol className="list-decimal space-y-1 pl-5"><li>No painel do WordPress, vá em <b>Plugins → Adicionar novo</b> e instale o <b>WPCode</b> (ou &quot;Insert Headers and Footers&quot;).</li><li>Abra <b>Code Snippets → Header &amp; Footer</b>.</li><li>Cole o código do Pinas Kit no campo <b>Footer</b> (rodapé) e salve.</li></ol><p className="mt-2">Usa Elementor? O passo é o mesmo: o código vai no rodapé do site inteiro, não dentro de uma página.</p></> },
    { q: "Como instalar no Wix?", a: <><ol className="list-decimal space-y-1 pl-5"><li>No painel do Wix, abra <b>Configurações → Avançado → Código personalizado</b>.</li><li>Clique em <b>+ Adicionar código</b> e cole o código do Pinas Kit.</li><li>Em &quot;Adicionar código às páginas&quot;, escolha <b>Todas as páginas</b>; em &quot;Posicionar código em&quot;, escolha <b>Body – fim</b>. Salve e publique o site.</li></ol><p className="mt-2">O Wix só libera código personalizado em sites com plano pago e domínio conectado.</p></> },
    { q: "E no Webflow, Shopify ou site próprio?", a: <><b>Webflow:</b> Site settings → Custom code → Footer code. <b>Shopify:</b> Loja virtual → Temas → Editar código → <code>theme.liquid</code>, cole antes de <code>&lt;/body&gt;</code>. <b>Site próprio:</b> cole antes de <code>&lt;/body&gt;</code> em todas as páginas (ou no arquivo de rodapé comum).</> },
    { q: "Posso escolher onde o formulário aparece?", a: <>Sim. Sem nada, ele entra sozinho antes do rodapé. Para escolher o lugar, coloque <code>&lt;div data-pinas-form&gt;&lt;/div&gt;</code> onde quiser que ele apareça.</> },
    { q: "Como sei se ficou instalado?", a: <>Abra o seu site uma vez depois de colar o código. Em <b>Botões e formulários</b>, o botão passa a mostrar <b>Instalado</b>. Se não aparecer, confira se o código está em todas as páginas e se o site foi publicado.</> },
  ] },
  { title: "Origem dos contatos", items: [
    { q: "O que é UTM e por que usar?", a: <>São marcações no fim do link (ex.: <code>?utm_source=instagram&amp;utm_campaign=promo</code>) que dizem de onde a pessoa veio. Use <b>Criar link com origem</b> para montar os links dos seus anúncios e posts: assim cada contato chega com a campanha e o anúncio certos, e o relatório mostra o que vende.</> },
    { q: "Por que um contato aparece como \"Acesso direto\"?", a: <>Quando a pessoa digitou o endereço do site, veio de um link sem marcações ou de um aplicativo que esconde a origem (como alguns navegadores dentro do Instagram e do WhatsApp). Usar links com UTM nos anúncios resolve a maioria dos casos.</> },
    { q: "Por que \"Pessoas que viram\" parece baixo?", a: <>Alguns navegadores (como o Brave) e bloqueadores de anúncio impedem a contagem de visitas. Os contatos chegam normalmente; só a contagem de visualizações fica abaixo do real.</> },
    { q: "Como funciona o relatório de vendas por origem?", a: <>Em <b>Relatórios</b> você vê, por origem, campanha e anúncio, quantos contatos chegaram, quantos viraram venda e quanto foi vendido. Conta como venda o contato na etapa <b>Venda concluída</b>; o valor vem do campo &quot;Valor da venda&quot; na ficha. O custo dos anúncios não aparece porque o Pinas Kit não acessa suas contas de anúncio.</> },
  ] },
  { title: "Contatos e funil", items: [
    { q: "O que é a temperatura (frio, morno, quente)?", a: <>Uma pontuação automática: virar contato, voltar ao site, ver várias páginas, deixar e-mail, vir de anúncio pago e a resposta da pergunta de qualificação somam pontos. Frio abaixo de 20, morno de 20 a 39, quente a partir de 40.</> },
    { q: "Posso mudar as etapas do funil?", a: <>Sim. No <b>Funil</b>, clique em <b>Editar etapas</b> para criar, renomear, reordenar e apagar colunas (até 10). &quot;Novo&quot;, &quot;Venda concluída&quot; e &quot;Não convertido&quot; podem ser renomeadas, mas não apagadas.</> },
    { q: "Para que servem lembrete, etiquetas e responsável?", a: <>Na ficha do contato: o <b>lembrete de retorno</b> aparece no Início e no sininho no dia marcado; as <b>etiquetas</b> (ex.: vip) servem para filtrar; o <b>responsável</b> diz quem da equipe cuida do contato e permite filtrar &quot;Meus contatos&quot;.</> },
    { q: "Como uso as mensagens prontas?", a: <>Crie em <b>Configurações → Mensagens prontas</b> usando {"{primeiro_nome}"}, {"{nome}"} e {"{origem}"}. Na ficha do contato, clique em <b>Mensagem pronta</b>: o WhatsApp abre com o texto já preenchido.</> },
  ] },
  { title: "Conta e privacidade", items: [
    { q: "O Pinas Kit lê minhas conversas do WhatsApp?", a: <>Não. O botão só abre o WhatsApp no celular ou computador de quem clicou. Registramos os dados que a pessoa preencheu no formulário e de onde ela veio.</> },
    { q: "O número do meu WhatsApp fica visível no código do site?", a: <>Não. O número fica guardado no Pinas Kit e só é usado na hora em que a pessoa clica para conversar.</> },
    { q: "Como cancelo?", a: <>Em <b>Assinatura</b>, clique em <b>Cancelar assinatura</b>. Você continua com acesso até o fim do período já pago (ou do teste grátis) e pode exportar seus contatos a qualquer momento.</> },
  ] },
];

export default function Ajuda() {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link href="/"><Logo /></Link>
          <Link href="/painel" className="text-sm font-semibold text-primary">Ir para o painel</Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-8 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft text-primary"><LifeBuoy size={24} /></span>
          <div><h1 className="text-3xl font-bold">Central de ajuda</h1><p className="text-mute">Respostas rápidas para instalar e usar o Pinas Kit.</p></div>
        </div>
        <nav aria-label="Seções" className="mb-8 flex flex-wrap gap-2">
          {SECTIONS.map((s) => <a key={s.title} href={`#${slug(s.title)}`} className="rounded-full border border-line bg-card px-3 py-1.5 text-sm font-semibold hover:border-primary">{s.title}</a>)}
        </nav>
        {SECTIONS.map((s) => (
          <section key={s.title} id={slug(s.title)} className="mb-10 scroll-mt-6">
            <h2 className="mb-3 text-xl font-semibold">{s.title}</h2>
            <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
              {s.items.map((it) => (
                <details key={it.q} className="group px-5 py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-medium">{it.q}<ChevronDown size={18} className="shrink-0 text-mute transition-transform group-open:rotate-180" /></summary>
                  <div className="mt-3 text-[15px] leading-relaxed text-mute [&_b]:text-ink [&_code]:rounded [&_code]:bg-bg [&_code]:px-1 [&_code]:text-[13px] [&_code]:text-ink">{it.a}</div>
                </details>
              ))}
            </div>
          </section>
        ))}
        <div className="rounded-2xl border border-line bg-card p-6 text-center">
          <h2 className="text-lg font-semibold">Não achou o que procurava?</h2>
          <p className="mt-1 text-mute">Fale com a gente. Respondemos em horário comercial.</p>
          <div className="mt-4 flex justify-center"><SupportButton /></div>
          <p className="mt-4 break-all text-xs text-mute">Exemplo de código de instalação: <code>{SCRIPT}</code></p>
        </div>
      </main>
    </div>
  );
}

const slug = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
