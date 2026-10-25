"use client";
import { useEffect } from "react";
import Link from "next/link";
import { Button, Card } from "@/components/ui";

// Erro inesperado numa tela do painel: explica em português e deixa tentar de novo.
export default function ErroPainel({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <Card className="mx-auto mt-10 max-w-lg text-center">
      <h1 className="font-display text-xl font-bold">Algo deu errado nesta tela</h1>
      <p className="mt-2 text-mute">Seus dados estão salvos. Tente carregar de novo; se continuar, volte para o início.</p>
      {error.digest && <p className="mt-2 text-xs text-mute">Código do erro: {error.digest}</p>}
      <div className="mt-5 flex justify-center gap-2">
        <Button onClick={reset}>Tentar de novo</Button>
        <Link href="/painel" className="inline-flex h-11 items-center rounded-lg border border-line bg-card px-4 font-semibold">Ir para o início</Link>
      </div>
    </Card>
  );
}
