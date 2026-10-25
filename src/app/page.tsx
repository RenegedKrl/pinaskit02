import Link from "next/link";
import { ArrowRight, BarChart3, BellRing, Check, FormInput, KanbanSquare, MessageSquareText, MousePointerClick, Route, Users, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { DashboardMock, FunnelMock, PhoneMock, ReportMock } from "@/components/landing/mockups";
import { Pricing } from "@/components/landing/pricing";

const features = [
  { i: Route, c: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300", t: "Origem de cada contato", d: "Guardamos UTMs e cliques do Google e do Meta, do primeiro ao último acesso." },
  { i: BarChart3, c: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300", t: "Vendas por origem", d: "Veja qual origem, campanha e anúncio trazem contatos que compram." },
  { i: MousePointerClick, c: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300", t: "Botão flutuante de WhatsApp", d: "Com saudação, foto do atendente e regras de quando aparecer." },
  { i: FormInput, c: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300", t: "Formulário antes do rodapé", d: "Entra sozinho no fim da página, com a fonte do seu site." },
  { i: KanbanSquare, c: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300", t: "Funil do seu jeito", d: "Arraste os contatos entre etapas e crie as suas próprias colunas." },
  { i: BellRing, c: "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300", t: "Lembretes e avisos", d: "Sininho a cada contato novo e lembrete do dia certo de retornar." },
  { i: MessageSquareText, c: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300", t: "Mensagens prontas", d: "Responda em um clique, já com o nome da pessoa." },
  { i: Users, c: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300", t: "Equipe sem limite", d: "Cada atendente com seu acesso e seus contatos." },
];
const faq = [
  ["Preciso de cartão para testar?", "Não. São 7 dias grátis com tudo liberado e sem cartão."],
  ["Funciona no meu site?", "Funciona em qualquer site em que você consiga colar um código: WordPress, Wix, Webflow, Shopify, Elementor ou site próprio. A Central de ajuda tem o passo a passo de cada um."],
  ["O Pinas Kit lê minhas conversas?", "Não. O botão só abre o WhatsApp de quem clicou. Registramos os dados do formulário e de onde a pessoa veio."],
  ["O que acontece se eu não assinar?", "O painel fica somente leitura. Seus contatos continuam salvos e você pode exportá-los quando quiser."],
  ["Como pago?", "Cartão, PIX ou boleto, no mensal ou no anual. Cancele quando quiser, sem multa."],
  ["E a LGPD?", "O formulário tem caixa de autorização com link para a sua política de privacidade, e você pode apagar os dados quando quiser."],
];

export default function Home() {
  return (
    <div className="overflow-x-hidden bg-card">
      <header className="sticky top-0 z-40 border-b border-line/70 bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-8">
          <Link href="/"><Logo /></Link>
          <nav className="flex items-center gap-1 text-[15px]">
            <a href="#recursos" className="hidden px-3 py-2 text-mute hover:text-ink md:block">Recursos</a>
            <a href="#preco" className="hidden px-3 py-2 text-mute hover:text-ink sm:block">Preço</a>
            <Link href="/ajuda" className="hidden px-3 py-2 text-mute hover:text-ink md:block">Ajuda</Link>
            <ThemeToggle compact />
            <Link href="/entrar" className="px-3 py-2">Entrar</Link>
            <Link href="/criar-conta" className="rounded-lg bg-primary px-4 py-2 font-semibold text-white hover:bg-primary-hover">Testar grátis</Link>
          </nav>
        </div>
      </header>

      <section className="relative">
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(50%_60%_at_15%_0%,color-mix(in_oklab,var(--color-primary)_14%,transparent),transparent),radial-gradient(40%_50%_at_90%_10%,color-mix(in_oklab,#8b5cf6_12%,transparent),transparent)]" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 md:px-8 lg:grid-cols-2 lg:pt-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1 text-sm font-medium text-mute"><span className="h-2 w-2 rounded-full bg-emerald-500" />Para quem anuncia no Google e no Meta</p>
            <h1 className="mt-5 text-4xl font-bold leading-[1.08] tracking-tight md:text-6xl">Saiba qual anúncio traz os contatos que <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">viram venda</span></h1>
            <p className="mt-5 max-w-xl text-lg text-mute">Botão de WhatsApp e formulário para o seu site que registram a origem de cada pessoa, organizam o atendimento num funil e mostram quanto cada campanha vendeu.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/criar-conta" className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-lg font-semibold text-white shadow-lg shadow-primary/25 hover:bg-primary-hover">Começar teste de 7 dias<ArrowRight size={18} /></Link>
              <a href="#como" className="rounded-xl border border-line bg-card px-6 py-3.5 text-lg hover:bg-bg">Como funciona</a>
            </div>
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-mute">
              {["Sem cartão de crédito", "Instala em 2 minutos", "Cancele quando quiser"].map((t) => <li key={t} className="flex items-center gap-1.5"><Check size={16} className="text-emerald-500" />{t}</li>)}
            </ul>
          </div>
          <div className="relative"><div aria-hidden="true" className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-primary/15 to-violet-500/15 blur-2xl" /><DashboardMock /></div>
        </div>
      </section>

      <section className="border-y border-line bg-bg py-16">
        <div className="mx-auto max-w-5xl px-4 md:px-8">
          <h2 className="text-center text-3xl font-bold tracking-tight">Chega de anunciar no escuro</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-line bg-card p-6">
              <p className="font-semibold text-mute">Sem o Pinas Kit</p>
              <ul className="mt-4 space-y-3">{["O contato chega no WhatsApp e ninguém sabe de onde veio", "Você paga anúncio sem saber qual dá retorno", "Contatos esquecidos no meio das conversas"].map((t) => <li key={t} className="flex gap-2"><X size={18} className="mt-0.5 shrink-0 text-red-500" />{t}</li>)}</ul>
            </div>
            <div className="rounded-2xl border-2 border-primary/40 bg-card p-6 shadow-lg shadow-primary/5">
              <p className="font-semibold text-primary">Com o Pinas Kit</p>
              <ul className="mt-4 space-y-3">{["Cada contato chega com origem, campanha e anúncio", "Relatório mostra o que vende e o que só gasta", "Funil, lembretes e avisos: ninguém fica sem resposta"].map((t) => <li key={t} className="flex gap-2"><Check size={18} className="mt-0.5 shrink-0 text-emerald-500" />{t}</li>)}</ul>
            </div>
          </div>
        </div>
      </section>

      <section id="como" className="mx-auto max-w-6xl px-4 py-20 md:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Funciona em 3 passos</h2>
            <ol className="mt-8 space-y-6">
              {[["Crie seu botão ou formulário", "Escolha cores, mensagem e onde ele aparece, vendo a prévia."], ["Cole uma linha no seu site", "WordPress, Wix, Webflow, Shopify, Elementor ou site próprio."], ["Acompanhe e venda mais", "Cada contato chega com a origem. Organize no funil e veja o relatório."]].map(([t, d], i) => (
                <li key={t} className="flex gap-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-violet-500 font-bold text-white">{i + 1}</span>
                  <div><h3 className="text-lg font-semibold">{t}</h3><p className="mt-0.5 text-mute">{d}</p></div>
                </li>
              ))}
            </ol>
          </div>
          <PhoneMock />
        </div>
      </section>

      <section id="recursos" className="border-y border-line bg-bg py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <h2 className="text-center text-3xl font-bold tracking-tight">Tudo o que você precisa, sem complicação</h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ i: I, c, t, d }) => (
              <div key={t} className="rounded-2xl border border-line bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-md">
                <span className={`grid h-10 w-10 place-items-center rounded-xl ${c}`}><I size={20} aria-hidden="true" /></span>
                <h3 className="mt-4 font-semibold">{t}</h3>
                <p className="mt-1 text-sm text-mute">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 md:px-8">
        <h2 className="text-center text-3xl font-bold tracking-tight">Veja por dentro</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-mute">O funil organiza o atendimento e o relatório mostra de onde vêm as vendas.</p>
        <div className="mt-10 grid gap-6 lg:grid-cols-2"><FunnelMock /><ReportMock /></div>
      </section>

      <section id="preco" className="border-y border-line bg-bg py-20">
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="text-center text-3xl font-bold tracking-tight">Um plano, tudo liberado</h2>
          <p className="mt-2 text-center text-mute">Escolha o período. Quanto mais longo, maior o desconto.</p>
          <Pricing />
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-20">
        <h2 className="text-center text-3xl font-bold tracking-tight">Perguntas frequentes</h2>
        <div className="mt-8 divide-y divide-line overflow-hidden rounded-2xl border border-line">
          {faq.map(([q, a]) => (
            <details key={q} className="group bg-card px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold">{q}<span className="text-xl leading-none text-mute transition group-open:rotate-45">+</span></summary>
              <p className="mt-2 text-mute">{a}</p>
            </details>
          ))}
        </div>
        <p className="mt-4 text-center text-sm text-mute">Mais dúvidas? <Link href="/ajuda" className="font-semibold text-primary">Central de ajuda</Link></p>
      </section>

      <section className="px-4 pb-20">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-[#0b1220] px-6 py-14 text-center text-white">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Descubra hoje de onde vêm suas vendas</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-300">Crie sua conta, instale em 2 minutos e veja o primeiro contato chegar com a origem.</p>
          <Link href="/criar-conta" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-500 px-6 py-3.5 text-lg font-semibold text-white hover:bg-blue-400">Começar grátis<ArrowRight size={18} /></Link>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-mute md:px-8">
          <span>© {new Date().getFullYear()} Pinas Kit</span>
          <nav className="flex gap-4"><Link href="/ajuda">Ajuda</Link><Link href="/termos">Termos de uso</Link><Link href="/privacidade">Privacidade</Link></nav>
        </div>
      </footer>
    </div>
  );
}
