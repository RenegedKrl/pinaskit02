import Link from "next/link";
import { LifeBuoy } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * "Fale com o suporte": abre o WhatsApp do suporte do Pinas Kit.
 * O número vem de NEXT_PUBLIC_SUPPORT_WHATSAPP (só dígitos, com DDI). Sem número configurado, leva para a Central de ajuda.
 */
export function SupportButton({ compact, plain, className = "" }: { compact?: boolean; plain?: boolean; className?: string }) {
  const phone = (process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? "").replace(/\D/g, "");
  const text = encodeURIComponent("Olá! Preciso de ajuda com o Pinas Kit.");
  const cls = cn("inline-flex items-center gap-2 rounded-lg font-semibold", plain ? "" : "h-11 bg-success px-5 text-white hover:brightness-95", className);
  if (!phone) return <Link href="/ajuda" className={cls}><LifeBuoy size={18} />{!compact && "Central de ajuda"}</Link>;
  return (
    <a href={`https://wa.me/${phone}?text=${text}`} target="_blank" rel="noopener" className={cls}>
      <WhatsAppIcon size={18} />{!compact && "Fale com o suporte"}
    </a>
  );
}
