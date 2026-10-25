import Link from "next/link";
import { AuthShell } from "../auth-shell";
import { Button, Field, Input } from "@/components/ui";
import { signInGoogle, signUp } from "../entrar/actions";

export default async function Page({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const sp = await searchParams;
  return (
    <AuthShell title="Criar conta grátis" desc="7 dias para testar tudo. Não pedimos cartão." sp={sp}>
      <form action={signInGoogle}><Button variant="outline" className="w-full">Continuar com Google</Button></form>
      <p className="my-4 text-center text-sm text-mute">ou</p>
      <form action={signUp} className="space-y-4">
        <Field label="Seu nome"><Input name="name" autoComplete="name" required /></Field>
        <Field label="Nome do negócio"><Input name="business" placeholder="Ex.: Clínica Sorriso" required /></Field>
        <Field label="E-mail"><Input name="email" type="email" autoComplete="email" required /></Field>
        <Field label="Senha" hint="Pelo menos 8 caracteres."><Input name="password" type="password" autoComplete="new-password" minLength={8} required /></Field>
        <Button className="w-full">Criar minha conta</Button>
      </form>
      <p className="mt-4 text-xs text-mute">Ao criar a conta você aceita os <Link className="underline" href="/termos">Termos de Uso</Link> e a <Link className="underline" href="/privacidade">Política de Privacidade</Link>.</p>
      <p className="mt-4 text-sm text-mute">Já tem conta? <Link className="font-semibold text-primary" href="/entrar">Entrar</Link></p>
    </AuthShell>
  );
}
