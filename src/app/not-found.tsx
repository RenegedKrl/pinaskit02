import { Logo } from "@/components/logo";
import Link from "next/link";

// Endereço que não existe (ou contato/botão de outra conta).
export default function NaoEncontrado() {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="max-w-md text-center">
        <Logo className="justify-center" />
        <h1 className="mt-4 font-display text-2xl font-bold">Página não encontrada</h1>
        <p className="mt-2 text-mute">O endereço pode estar errado, ou o item foi apagado.</p>
        <div className="mt-6 flex justify-center gap-2">
          <Link href="/painel" className="inline-flex h-11 items-center rounded-lg bg-primary px-5 font-semibold text-white">Ir para o painel</Link>
          <Link href="/" className="inline-flex h-11 items-center rounded-lg border border-line bg-card px-5 font-semibold">Página inicial</Link>
        </div>
      </div>
    </main>
  );
}
