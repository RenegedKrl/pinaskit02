"use client";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

/** Botão Claro/Escuro. Guarda a escolha neste navegador. */
export function ThemeToggle({ compact, className = "" }: { compact?: boolean; className?: string }) {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);
  function toggle() {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("pk-tema", next ? "escuro" : "claro"); } catch { /* sem armazenamento */ }
    setDark(next);
  }
  const label = dark ? "Tema claro" : "Tema escuro";
  return (
    <button type="button" onClick={toggle} aria-label={label} title={label}
      className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] text-ink hover:bg-bg", className)}>
      {dark ? <Sun size={18} /> : <Moon size={18} />}{!compact && label}
    </button>
  );
}
