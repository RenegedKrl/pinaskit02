import Link from "next/link";
import { AuthShell } from "../auth-shell";
import { Button, Field, Input } from "@/components/ui";
import { signIn, signInGoogle } from "./actions";

export default async function Page({ searchParams }: { searchParams: Promise<{ erro?: string; ok?: string; redirect?: string }> }) {
  const sp = await searchParams;
  return (
    <AuthShell title="Entrar" desc="Acesse seu painel do Pinas Kit." sp={sp}>
      <form action={signInGoogle}><Button variant="outline" className="w-full">Entrar com Google</Button></form>
      <p className="my-4 text-center text-sm text-mute">ou</p>
      <form action={signIn} className="space-y-4">
        <input type="hidden" name="redirect" value={sp.redirect ?? "/painel"} />
        <Field label="E-mail"><Input name="email" type="email" autoComplete="email" required /></Field>
        <Field label="Senha"><Input name="password" type="password" autoComplete="current-password" required /></Field>
        <div className="text-right text-sm"><Link className="text-primary" href="/recuperar-senha">Esqueci a senha</Link></div>
        <Button className="w-full">Entrar</Button>
      </form>
      <p className="mt-6 text-sm text-mute">Ainda não tem conta? <Link className="font-semibold text-primary" href="/criar-conta">Criar conta grátis</Link></p>
    </AuthShell>
  );
}
