import { Logo } from "@/components/logo";
import Link from "next/link";

export function Legal({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/"><Logo /></Link>
      <h1 className="mt-8 font-display text-3xl font-bold">{title}</h1>
      <p className="mt-1 text-sm text-mute">Modelo inicial. Revise com um advogado antes de lançar e preencha os dados da empresa.</p>
      <div className="mt-6 space-y-4 leading-relaxed [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold">{children}</div>
    </div>
  );
}
