// Marca do Pinas Kit.
// Nome: "pinas" reto com o pingo do i em forma de balão de conversa + "kit" em itálico.
// Ícone: monograma PK com uma estrela (a chegada de um contato) — usado na guia do navegador e no menu recolhido.

/** Monograma PK com estrela, em quadrado escuro. */
export function LogoMark({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" className={`shrink-0 ${className}`}>
      <rect width="64" height="64" rx="14" fill="#0b1018" />
      <path d="M14 52V12h11a10 10 0 0 1 0 20H14" fill="none" stroke="#ece9e1" strokeWidth="7" strokeLinejoin="round" />
      <path d="M36 12v40M54 12L39 32l16 20" fill="none" stroke="#ece9e1" strokeWidth="7" />
      <path d="M27 38l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#facc15" />
    </svg>
  );
}

/** Nome "pinaskit". compact = só o monograma (menu recolhido). */
export function Logo({ compact, className = "" }: { size?: number; compact?: boolean; className?: string }) {
  if (compact) return <LogoMark size={30} className={className} />;
  return (
    <span className={`inline-flex items-baseline whitespace-nowrap text-[26px] font-medium leading-none tracking-[-0.055em] text-ink ${className}`} aria-label="Pinas Kit" role="img">
      p
      <span className="relative inline-block">
        ı
        <svg viewBox="0 0 16 15" width="0.3em" height="0.28em" aria-hidden="true" className="absolute left-1/2 top-[-0.02em] -translate-x-1/2 fill-primary">
          <path d="M8 0a7 6.3 0 1 1-3.4 11.8L1 13.5l1.2-3.4A6.3 6.3 0 0 1 8 0z" />
        </svg>
      </span>
      nas
      <em className="ml-px font-[family-name:var(--font-serif)] text-[1.12em] font-normal italic tracking-[-0.01em] text-primary">kit</em>
    </span>
  );
}
