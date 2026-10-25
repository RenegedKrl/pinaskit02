import Link from "next/link";
import { BarChart3, Check, FormInput, MessageCircle, MousePointerClick, Route, Users } from "lucide-react";
import { brl, PLAN } from "@/lib/plan";

const steps = [
  { t: "Crie seu botão ou formulário", d: "Escolha cores, mensagem e onde ele aparece. Leva 2 minutos." },
  { t: "Cole uma linha no seu site", d: "Funciona em WordPress, Wix, Webflow, Shopify, Elementor ou site próprio." },
  { t: "Veja de onde vem cada contato", d: "Anúncio do Google, Meta, Instagram, campanha e página: tudo no painel." },
];
const features = [
  { i: Route, t: "Origem de cada contato", d: "Guardamos UTMs e identificadores de clique do Google e do Meta, do primeiro ao último acesso." },
  { i: MousePointerClick, t: "Botão flutuante de WhatsApp", d: "Com balão de saudação, foto do atendente e regras de quando aparecer." },
  { i: FormInput, t: "Formulário antes do rodapé", d: "Entra sozinho no fim da página, com a fonte do seu site. Se você já tem um formulário, a gente se conecta a ele." },
  { i: BarChart3, t: "Números que importam", d: "Quantos viram, clicaram e viraram contato, por dia e por origem." },
  { i: MessageCircle, t: "Funil de atendimento", d: "Novo, em atendimento, proposta, negociação, ganho ou perdido. Com pontuação de quente, morno e frio." },
  { i: Users, t: "Equipe sem limite", d: "Convide quem atende. Cada um com o acesso certo." },
];
const faq = [
  ["Preciso de cartão para testar?", "Não. São 7 dias grátis com tudo liberado e sem cartão."],
  ["Funciona no meu site?", "Funciona em qualquer site em que você consiga colar um código. Se travar, o painel gera um pedido pronto para você mandar ao seu desenvolvedor ou a uma IA."],
  ["O que acontece se eu não assinar?", "O painel fica somente leitura. Seus contatos continuam salvos e você pode exportá-los quando quiser."],
  ["Como pago?", "Cartão, PIX ou boleto, no mensal ou no anual. Cancele quando quiser, sem multa."],
  ["E a LGPD?", "O formulário tem caixa de autorização com link para a sua política de privacidade, e você pode apagar os dados quando quiser."],
];

export default function Home() {
  return (
    <div className="bg-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
        <Link href="/" className="font-display text-xl font-bold text-primary">Pinas Kit</Link>
        <nav className="flex items-center gap-2 text-[15px]">
          <a href="#preco" className="hidden px-3 py-2 text-mute sm:block">Preço</a>
          <Link href="/entrar" className="px-3 py-2">Entrar</Link>
          <Link href="/criar-conta" className="rounded-lg bg-primary px-4 py-2 font-semibold text-white">Testar grátis</Link>
        </nav>
      </header>

      <section className="mx-auto max-w-4xl px-4 pb-16 pt-10 text-center md:pt-20">
        <h1 className="font-display text-4xl font-bold leading-tight md:text-6xl">Saiba de qual anúncio veio cada contato do seu WhatsApp</h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-mute">Botão de WhatsApp e formulário para o seu site que registram a origem de cada pessoa e organizam o atendimento num funil simples.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/criar-conta" className="rounded-xl bg-primary px-6 py-3.5 text-lg font-semibold text-white">Começar teste de 7 dias</Link>
          <a href="#como" className="rounded-xl border border-line px-6 py-3.5 text-lg">Como funciona</a>
        </div>
        <p className="mt-3 text-sm text-mute">Sem cartão de crédito. Cancele quando quiser.</p>
      </section>

      <section id="como" className="bg-bg py-16">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <h2 className="text-center font-display text-3xl font-bold">Como funciona</h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.t} className="rounded-2xl bg-white p-6">
                <span className="grid size-10 place-items-center rounded-full bg-primary font-display font-bold text-white">{i + 1}</span>
                <h3 className="mt-4 font-display text-lg font-semibold">{s.t}</h3>
                <p className="mt-1 text-mute">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8">
        <h2 className="text-center font-display text-3xl font-bold">Tudo o que você precisa, sem complicação</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ i: I, t, d }) => (
            <div key={t} className="rounded-2xl border border-line p-6">
              <I className="text-primary" size={26} aria-hidden="true" />
              <h3 className="mt-3 font-display text-lg font-semibold">{t}</h3>
              <p className="mt-1 text-mute">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="preco" className="bg-bg py-16">
        <div className="mx-auto max-w-md px-4">
          <h2 className="text-center font-display text-3xl font-bold">Um preço, tudo liberado</h2>
          <div className="mt-8 rounded-2xl border-2 border-primary bg-white p-8">
            <p className="font-display text-lg font-semibold">Plano {PLAN.name}</p>
            <p className="mt-2 font-display text-4xl font-bold">{brl(PLAN.monthly)}<span className="text-base font-normal text-mute">/mês</span></p>
            <p className="text-mute">ou {brl(PLAN.yearly)}/ano ({brl(PLAN.yearlyPerMonth)}/mês)</p>
            <ul className="mt-6 space-y-2">
              {PLAN.features.map((f) => <li key={f} className="flex gap-2"><Check size={18} className="mt-1 shrink-0 text-success" />{f}</li>)}
            </ul>
            <Link href="/criar-conta" className="mt-8 block rounded-xl bg-primary py-3.5 text-center text-lg font-semibold text-white">Testar 7 dias grátis</Link>
            <p className="mt-2 text-center text-sm text-mute">Cartão, PIX ou boleto</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16">
        <h2 className="text-center font-display text-3xl font-bold">Perguntas frequentes</h2>
        <div className="mt-8 divide-y divide-line">
          {faq.map(([q, a]) => (
            <details key={q} className="py-4">
              <summary className="cursor-pointer font-semibold">{q}</summary>
              <p className="mt-2 text-mute">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-mute md:px-8">
          <span>© {new Date().getFullYear()} Pinas Kit</span>
          <nav className="flex gap-4"><Link href="/termos">Termos de uso</Link><Link href="/privacidade">Privacidade</Link></nav>
        </div>
      </footer>
    </div>
  );
}
