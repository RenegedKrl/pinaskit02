// Enquanto uma tela do painel carrega: esqueleto no lugar do conteúdo, sem números inventados.
export default function Carregando() {
  return (
    <div role="status" aria-live="polite" className="animate-pulse">
      <span className="sr-only">Carregando…</span>
      <div className="mb-2 h-8 w-56 rounded-lg bg-line" />
      <div className="mb-6 h-4 w-80 max-w-full rounded bg-line" />
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-24 rounded-2xl border border-line bg-card" />)}
      </div>
      <div className="h-64 rounded-2xl border border-line bg-card" />
    </div>
  );
}
