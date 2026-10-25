import { Card } from "@/components/ui";
import { dateTime } from "@/lib/utils";

export interface PageView { page_url: string | null; source_label: string | null; created_at: string }

function path(url: string | null): string {
  if (!url) return "(página desconhecida)";
  try { const u = new URL(url); return u.hostname + (u.pathname === "/" ? "" : u.pathname); } catch { return url; }
}

/** Visitas agrupadas por dia (horário de Brasília), da mais antiga para a mais recente. */
export function groupVisits(views: PageView[]) {
  const days = new Map<string, PageView[]>();
  for (const v of views) {
    const d = new Date(v.created_at).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
    days.set(d, [...(days.get(d) ?? []), v]);
  }
  return [...days.entries()];
}

/** Jornada do visitante antes (e depois) de virar contato: páginas vistas e retornos. */
export function Journey({ views, hasVisitor, contactAt }: { views: PageView[]; hasVisitor: boolean; contactAt: string }) {
  const days = groupVisits(views);
  return (
    <Card>
      <h2 className="mb-1 font-display font-semibold">Jornada no site</h2>
      {!views.length ? (
        <p className="text-sm text-mute">
          {hasVisitor
            ? "Nenhuma visita registrada. Alguns navegadores (como o Brave) e bloqueadores de anúncio impedem o registro das páginas vistas."
            : "Este contato não veio pelo script do site, então não há páginas vistas para mostrar."}
        </p>
      ) : (
        <>
          <p className="mb-3 text-sm text-mute">{views.length} {views.length === 1 ? "página vista" : "páginas vistas"} em {days.length} {days.length === 1 ? "dia" : "dias diferentes"}.</p>
          <ol className="space-y-3">
            {days.map(([day, list]) => (
              <li key={day} className="border-l-2 border-primary-soft pl-3">
                <p className="text-sm font-semibold">{day}{list[0].source_label ? <span className="font-normal text-mute"> · veio de {list[0].source_label}</span> : null}</p>
                <ul className="mt-1 space-y-0.5 text-sm">
                  {list.map((v, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="w-12 shrink-0 text-mute">{new Date(v.created_at).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" })}</span>
                      <span className="break-all">{path(v.page_url)}{v.created_at > contactAt ? <span className="text-mute"> (depois de virar contato)</span> : null}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs text-mute">Primeira visita: {dateTime(views[0].created_at)}</p>
        </>
      )}
    </Card>
  );
}
