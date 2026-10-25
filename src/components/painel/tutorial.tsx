"use client";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui";

/** Botão que (re)abre o tour guiado do painel (componente Tour, no layout). */
export function Tutorial() {
  return <Button variant="outline" data-tour="tutorial" onClick={() => window.dispatchEvent(new Event("pk-tour"))}><GraduationCap size={16} />Tutorial</Button>;
}
