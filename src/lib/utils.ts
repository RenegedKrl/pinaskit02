import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...c: ClassValue[]) => twMerge(clsx(c));

export function formatPhone(e164: string): string {
  const d = e164.replace(/\D/g, "");
  if (d.startsWith("55") && (d.length === 12 || d.length === 13)) {
    const n = d.slice(4);
    return `+55 (${d.slice(2, 4)}) ${n.slice(0, n.length - 4)}-${n.slice(-4)}`;
  }
  return "+" + d;
}

export const dateTime = (s: string) =>
  new Date(s).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });

export function since(days: number): string {
  return new Date(Date.now() - days * 864e5).toISOString();
}

export function randomKey(len = 10): string {
  const a = "abcdefghijkmnpqrstuvwxyz23456789";
  const b = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(b, (x) => a[x % a.length]).join("");
}
