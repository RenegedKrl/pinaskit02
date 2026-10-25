import { AuthShell } from "../../auth-shell";
import { Button, Field, Input } from "@/components/ui";
import { updatePassword } from "../../entrar/actions";

export default async function Page({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  return (
    <AuthShell title="Nova senha" desc="Escolha uma senha com pelo menos 8 caracteres." sp={await searchParams}>
      <form action={updatePassword} className="space-y-4">
        <Field label="Nova senha"><Input name="password" type="password" minLength={8} required /></Field>
        <Button className="w-full">Salvar senha</Button>
      </form>
    </AuthShell>
  );
}
