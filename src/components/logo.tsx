/** Marca do Pinas Kit: "P" com a cabeça de um alfinete de mapa (de onde veio o contato). */
export function LogoMark({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true" className={`shrink-0 ${className}`}>
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <path d="M11.5 24.5V13.5a5.5 5.5 0 1 1 5.5 5.5h-5.5" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="17" cy="13.5" r="1.7" fill="#fff" />
    </svg>
  );
}

/** Marca + nome. compact = só a marca (menu recolhido). */
export function Logo({ size = 28, compact, className = "" }: { size?: number; compact?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`} aria-label="Pinas Kit">
      <LogoMark size={size} />
      {!compact && <span className="text-lg font-bold tracking-tight text-ink">Pinas<span className="text-primary"> Kit</span></span>}
    </span>
  );
}
