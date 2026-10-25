import { since } from "@/lib/utils";

export interface LeadFilters { p?: string; q?: string; origem?: string; temp?: string; status?: string; pag?: string }

// Genérico: devolve o mesmo tipo de consulta recebido, mantendo o tipo das linhas.
export function applyFilters<Q>(query: Q, f: LeadFilters): { q: Q; days: number } {
  const days = [7, 30, 90, 365].includes(Number(f.p)) ? Number(f.p) : 30;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q = (query as any).gte("created_at", since(days));
  if (f.origem) q = q.eq("source_label", f.origem);
  if (f.temp) q = q.eq("temperature", f.temp);
  if (f.status) q = q.eq("status", f.status);
  if (f.q) {
    const s = f.q.replace(/[%,()]/g, "").slice(0, 60);
    const digits = s.replace(/\D/g, "");
    q = q.or(`name.ilike.%${s}%,email.ilike.%${s}%${digits.length >= 4 ? `,phone_e164.like.%${digits}%` : ""}`);
  }
  return { q, days };
}
