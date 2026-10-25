import Link from "next/link";
import { ArrowRight, BarChart3, BellRing, Check, FormInput, KanbanSquare, MessageSquareText, Route, ShieldCheck, Users } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { WhatsAppIcon } from "@/components/ui";
import { DashboardMock } from "@/components/landing/mockups";
import { Showcase } from "@/components/landing/showcase";
import { Pricing } from "@/components/landing/pricing";

const CHANNELS: { n: string; c: string; svg: React.ReactNode }[] = [
  { n: "Google Ads", c: "bg-white", svg: <svg viewBox="0 0 24 24" width="20" height="20"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z" /><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.5l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z" /><path fill="#FBBC05" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H3.1a10 10 0 0 0 0 9z" /><path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.5l3.3 2.6C7.2 7.8 9.4 6 12 6z" /></svg> },
  { n: "Meta Ads", c: "bg-[#0866FF]", svg: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"><path d="M3 15c0-4 2.2-8 4.5-8 3.5 0 5.5 10 9 10 2 0 4.5-1.5 4.5-5s-2.5-5-4.5-5c-3.5 0-5.5 10-9 10C5 17 3 16 3 15z" /></svg> },
  { n: "Instagram", c: "bg-gradient-to-br from-[#feda75] via-[#d62976] to-[#4f5bd5]", svg: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="white" strokeWidth="2"><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.3" cy="6.7" r="1" fill="white" stroke="none" /></svg> },
  { n: "TikTok", c: "bg-black", svg: <svg viewBox="0 0 24 24" width="20" height="20"><path fill="#25F4EE" d="M10 9.6v3.2a3 3 0 1 0 2.2 2.9V3h3a4.5 4.5 0 0 0 3.8 4v3a7.4 7.4 0 0 1-3.8-1.2v6.9A6 6 0 1 1 10 9.6z" transform="translate(-0.8 0.6)" /><path fill="#FE2C55" d="M10 9.6v3.2a3 3 0 1 0 2.2 2.9V3h3a4.5 4.5 0 0 0 3.8 4v3a7.4 7.4 0 0 1-3.8-1.2v6.9A6 6 0 1 1 10 9.6z" transform="translate(0.8 -0.6)" /><path fill="white" d="M10 9.6v3.2a3 3 0 1 0 2.2 2.9V3h3a4.5 4.5 0 0 0 3.8 4v3a7.4 7.4 0 0 1-3.8-1.2v6.9A6 6 0 1 1 10 9.6z" /></svg> },
];
const BENTO = [
  { i: Route, t: "Origem de cada contato", d: "UTMs e cliques do Google e do Meta, do primeiro ao último acesso. Nunca mais \"não sei de onde veio\".", c: "bg-blue-50 dark:bg-blue-950/40", ic: "bg-blue-600", span: "md:col-span-2" },
  { i: BarChart3, t: "Vendas por origem", d: "Qual anúncio traz quem compra.", c: "bg-violet-50 dark:bg-violet-950/40", ic: "bg-violet-600", span: "" },
  { i: FormInput, t: "Formulário que se encaixa", d: "Entra antes do rodapé com a fonte do seu site. WordPress, Wix, Elementor e mais.", c: "bg-sky-50 dark:bg-sky-950/40", ic: "bg-sky-600", span: "" },
  { i: KanbanSquare, t: "Funil do seu jeito", d: "Arraste contatos, crie e renomeie etapas, veja o valor em cada coluna.", c: "bg-amber-50 dark:bg-amber-950/30", ic: "bg-amber-500", span: "" },
  { i: BellRing, t: "Ninguém fica sem resposta", d: "Sininho a cada contato novo e lembrete no dia certo de retornar.", c: "bg-pink-50 dark:bg-pink-950/30", ic: "bg-pink-600", span: "" },
  { i: MessageSquareText, t: "Mensagens prontas", d: "Responda em um clique, já com o nome da pessoa e a origem.", c: "bg-teal-50 dark:bg-teal-950/30", ic: "bg-teal-600", span: "md:col-span-2" },
  { i: Users, t: "Equipe sem limite", d: "Cada atendente com seus contatos e o acesso certo.", c: "bg-indigo-50 dark:bg-indigo-950/40", ic: "bg-indigo-600", span: "" },
];
const FAQ = [
  ["Preciso de cartão para testar?", "Não. São 7 dias grátis com tudo liberado e sem cartão."],
  ["Funciona no meu site?", "Em qualquer site em que você consiga colar um código: WordPress, Wix, Webflow, Shopify, Elementor ou site próprio. A Central de ajuda tem o passo a passo."],
  ["O Pinas Kit lê minhas conversas?", "Não. O botão só abre o WhatsApp de quem clicou. Registramos os dados do formulário e de onde a pessoa veio."],
  ["O que acontece se eu não assinar?", "O painel fica somente leitura. Seus contatos continuam salvos e você pode exportá-los quando quiser."],
  ["Como pago?", "Cartão, PIX ou boleto, no mensal, trimestral, semestral ou anual. Cancele quando quiser, sem multa."],
  ["E a LGPD?", "O formulário tem caixa de autorização com link para a sua política de privacidade, e você pode apagar os dados quando quiser."],
];
const FOOTER = [
  { t: "Produto", l: [["Recursos", "#recursos"], ["Preços", "#preco"], ["Criar conta", "/criar-conta"], ["Entrar", "/entrar"]] },
  { t: "Ajuda", l: [["Central de ajuda", "/ajuda"], ["Instalar no WordPress", "/ajuda#instalacao"], ["Instalar no Wix", "/ajuda#instalacao"], ["O que é UTM", "/ajuda#origem-dos-contatos"]] },
  { t: "Legal", l: [["Termos de uso", "/termos"], ["Privacidade", "/privacidade"]] },
];

export default function Home() {
  const support = (process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? "").replace(/\D/g, "");
  return (
    <div className="overflow-x-clip bg-card">
      <header className="sticky top-0 z-40 border-b border-line/70 bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-8">
          <Link href="/"><Logo /></Link>
          <nav className="flex items-center gap-1 text-[15px]">
            <a href="#recursos" className="hidden px-3 py-2 text-mute hover:text-ink md:block">Recursos</a>
            <a href="#preco" className="hidden px-3 py-2 text-mute hover:text-ink sm:block">Preços</a>
            <Link href="/ajuda" className="hidden px-3 py-2 text-mute hover:text-ink md:block">Ajuda</Link>
            <ThemeToggle compact />
            <Link href="/entrar" className="rounded-lg border border-line px-3.5 py-2 font-medium hover:bg-bg">Entrar</Link>
            <Link href="/criar-conta" className="rounded-lg bg-[#0b1220] px-4 py-2 font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900">Criar conta</Link>
          </nav>
        </div>
      </header>

      {/* Hero centralizado */}
      <section className="relative">
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-b from-primary-soft/70 via-violet-50/40 to-transparent dark:from-blue-950/40 dark:via-violet-950/20" />
        <div className="mx-auto max-w-4xl px-4 pb-10 pt-14 text-center md:pt-20">
          <div className="flex items-center justify-center gap-2" aria-label="Origens que o Pinas Kit identifica">
            {CHANNELS.map((c, i) => (
              <span key={c.n} title={c.n} className={`grid h-10 w-10 place-items-center rounded-xl shadow-md ring-1 ring-black/5 ${c.c} ${i % 2 ? "-translate-y-1" : ""}`}>{c.svg}</span>
            ))}
            <ArrowRight size={18} className="mx-1 text-mute" aria-hidden="true" />
            <span title="WhatsApp" className="grid h-12 w-12 place-items-center rounded-2xl bg-[#25D366] text-white shadow-lg"><WhatsAppIcon size={24} /></span>
          </div>
          <h1 className="mt-7 text-4xl font-bold leading-[1.05] tracking-tight md:text-7xl">Cada contato do WhatsApp, <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">com origem</span></h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-mute md:text-xl">Botão e formulário de WhatsApp para o seu site que mostram de qual anúncio veio cada pessoa, organizam o atendimento num funil e revelam o que realmente vende.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/criar-conta" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-violet-500 px-7 py-3.5 text-lg font-semibold text-white shadow-lg shadow-primary/30 transition hover:brightness-110">Grátis por 7 dias<ArrowRight size={18} /></Link>
            <a href="#recursos" className="rounded-full border border-line bg-card px-7 py-3.5 text-lg font-medium hover:bg-bg">Ver como funciona</a>
          </div>
          <ul className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-mute">
            {["Sem cartão de crédito", "Instala em 2 minutos", "Dados protegidos (LGPD)"].map((t) => <li key={t} className="flex items-center gap-1.5"><Check size={16} className="text-emerald-500" />{t}</li>)}
          </ul>
        </div>
        <div className="mx-auto max-w-4xl px-4 pb-16">
          <div className="relative"><div aria-hidden="true" className="absolute -inset-x-8 -inset-y-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-primary/20 via-violet-400/15 to-sky-300/20 blur-2xl" /><DashboardMock /></div>
        </div>
      </section>

      {/* Vitrine com abas */}
      <section id="recursos" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-20 md:px-8">
        <p className="text-center text-sm font-semibold uppercase tracking-wider text-primary">Do anúncio à venda</p>
        <h2 className="mt-2 text-center text-3xl font-bold tracking-tight md:text-5xl">Capte, organize, atenda e analise</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-mute">Tudo o que acontece entre o clique no anúncio e a venda, num lugar só.</p>
        <div className="mt-10"><Showcase /></div>
      </section>

      {/* Bento */}
      <section className="border-y border-line bg-bg py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <h2 className="text-center text-3xl font-bold tracking-tight md:text-5xl">Seu atendimento <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">em um único lugar</span></h2>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {BENTO.map(({ i: I, t, d, c, ic, span }) => (
              <div key={t} className={`rounded-3xl border border-line p-7 transition hover:-translate-y-0.5 hover:shadow-lg ${c} ${span}`}>
                <span className={`grid h-11 w-11 place-items-center rounded-2xl text-white shadow-md ${ic}`}><I size={22} aria-hidden="true" /></span>
                <h3 className="mt-5 text-xl font-semibold">{t}</h3>
                <p className="mt-2 text-mute">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Preço */}
      <section id="preco" className="scroll-mt-16 py-20">
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="text-center text-3xl font-bold tracking-tight md:text-5xl">Um plano, tudo liberado</h2>
          <p className="mt-3 text-center text-mute">Escolha o período. Quanto mais longo, maior o desconto.</p>
          <Pricing />
        </div>
      </section>

      {/* Perguntas */}
      <section className="border-t border-line bg-bg py-20">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-center text-3xl font-bold tracking-tight">Perguntas frequentes</h2>
          <div className="mt-8 divide-y divide-line overflow-hidden rounded-2xl border border-line">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group bg-card px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold">{q}<span className="text-xl leading-none text-mute transition group-open:rotate-45">+</span></summary>
                <p className="mt-2 text-mute">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Chamada final */}
      <section className="px-4 py-20">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-[#0b1220] px-6 py-16 text-center text-white">
          <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(60%_80%_at_20%_0%,rgba(59,130,246,0.35),transparent),radial-gradient(50%_70%_at_90%_100%,rgba(139,92,246,0.35),transparent)]" />
          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight md:text-5xl">Comece a vender com dados, não com palpite</h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-300">Crie sua conta, instale em 2 minutos e veja o primeiro contato chegar com a origem.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/criar-conta" className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-lg font-semibold text-slate-900 hover:bg-slate-100">Grátis por 7 dias<ArrowRight size={18} /></Link>
              {support && <a href={`https://wa.me/${support}?text=${encodeURIComponent("Olá! Quero saber mais sobre o Pinas Kit.")}`} target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-7 py-3.5 text-lg font-medium hover:bg-white/10"><WhatsAppIcon size={18} />Falar no WhatsApp</a>}
            </div>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-sm text-slate-400"><ShieldCheck size={15} />Sem cartão para testar · cancele quando quiser</p>
          </div>
        </div>
      </section>

      <footer className="border-t border-line bg-bg">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:px-8">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-mute">Botão e formulário de WhatsApp com a origem de cada contato, funil de atendimento e relatório de vendas.</p>
          </div>
          {FOOTER.map((col) => (
            <nav key={col.t} aria-label={col.t}>
              <p className="text-sm font-semibold">{col.t}</p>
              <ul className="mt-3 space-y-2 text-sm text-mute">{col.l.map(([l, h]) => <li key={l}><Link href={h} className="hover:text-ink">{l}</Link></li>)}</ul>
            </nav>
          ))}
        </div>
        <div className="border-t border-line">
          <p className="mx-auto max-w-6xl px-4 py-5 text-sm text-mute md:px-8">© {new Date().getFullYear()} Pinas Kit. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
