import { AuthShell } from "../auth-shell";
import { Button, Field, Input } from "@/components/ui";
import { resetPassword } from "../entrar/actions";

export default async function Page({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  return (
    <AuthShell title="Recuperar senha" desc="Enviaremos um link para você criar uma nova senha." sp={await searchParams}>
      <form action={resetPassword} className="space-y-4">
        <Field label="E-mail"><Input name="email" type="email" required /></Field>
        <Button className="w-full">Enviar link</Button>
      </form>
    </AuthShell>
  );
}
