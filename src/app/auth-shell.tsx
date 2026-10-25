import { Logo } from "@/components/logo";
import Link from "next/link";
import type { ReactNode } from "react";

const OK: Record<string, string> = {
  "confirme-email": "Conta criada! Confirme seu e-mail para entrar.",
  "email-enviado": "Se o e-mail existir, enviamos um link para criar uma nova senha.",
};

export function AuthShell({ title, desc, children, sp }: { title: string; desc: string; children: ReactNode; sp: { erro?: string; ok?: string } }) {
  return (
    <main className="grid min-h-dvh md:grid-cols-2">
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <Link href="/"><Logo /></Link>
          <h1 className="mt-8 font-display text-2xl font-bold">{title}</h1>
          <p className="mb-6 mt-1 text-mute">{desc}</p>
          {sp.erro && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{sp.erro}</p>}
          {sp.ok && OK[sp.ok] && <p className="mb-4 rounded-lg bg-success-soft p-3 text-sm text-emerald-800">{OK[sp.ok]}</p>}
          {children}
        </div>
      </div>
      <aside className="hidden flex-col justify-center gap-4 bg-primary-soft p-12 md:flex">
        <h2 className="font-display text-3xl font-bold text-ink">Saiba de onde vem cada contato do seu WhatsApp.</h2>
        <ul className="space-y-2 text-mute">
          <li>✓ 7 dias grátis, sem cartão</li>
          <li>✓ Botão, formulário ou os dois no seu site</li>
          <li>✓ Contatos organizados por origem e etapa</li>
        </ul>
      </aside>
    </main>
  );
}
