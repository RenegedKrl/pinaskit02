// Itens do menu do painel (lateral e topo usam a mesma lista).
import { BarChart3, Briefcase, CalendarDays, Home, KanbanSquare, ListChecks, MousePointerClick, Settings, Trophy, Users, Zap, type LucideIcon } from "lucide-react";

export interface NavItem { href: string; label: string; icon: LucideIcon; top?: boolean }

export const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  { title: "Dia a dia", items: [
    { href: "/painel/hoje", label: "Meu dia", icon: ListChecks, top: true },
    { href: "/painel", label: "Início", icon: Home, top: true },
    { href: "/painel/contatos", label: "Contatos", icon: Users, top: true },
    { href: "/painel/funil", label: "Funil", icon: KanbanSquare, top: true },
    { href: "/painel/negocios", label: "Negócios", icon: Briefcase, top: true },
    { href: "/painel/agenda", label: "Agenda", icon: CalendarDays },
  ] },
  { title: "Crescer", items: [
    { href: "/painel/captacao", label: "Botões e formulários", icon: MousePointerClick },
    { href: "/painel/automacoes", label: "Automações", icon: Zap },
    { href: "/painel/relatorios", label: "Relatórios", icon: BarChart3, top: true },
    { href: "/painel/equipe", label: "Equipe e metas", icon: Trophy },
    { href: "/painel/configuracoes", label: "Configurações", icon: Settings },
  ] },
];
export const NAV: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);
/** Barra de baixo no celular: 4 atalhos (o último abre "Mais"). */
export const MOBILE = ["/painel/hoje", "/painel/contatos", "/painel/funil"];

export const isActive = (path: string, href: string) => (href === "/painel" ? path === href : path === href || path.startsWith(href + "/"));
