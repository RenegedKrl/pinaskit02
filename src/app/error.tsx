"use client";
import Link from "next/link";

// Erro inesperado fora do painel (site, login).
export default function Erro({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="max-w-md text-center">
        <p className="font-display text-lg font-bold text-primary">Pinas Kit</p>
        <h1 className="mt-4 font-display text-2xl font-bold">Algo deu errado</h1>
        <p className="mt-2 text-mute">Tente de novo em alguns segundos.</p>
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={reset} className="h-11 rounded-lg bg-primary px-5 font-semibold text-white">Tentar de novo</button>
          <Link href="/" className="inline-flex h-11 items-center rounded-lg border border-line bg-card px-5 font-semibold">Página inicial</Link>
        </div>
      </div>
    </main>
  );
}
