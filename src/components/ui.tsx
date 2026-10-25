import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline" | "ghost" | "danger" | "whatsapp"; size?: "sm" | "md" };
export function Button({ variant = "primary", size = "md", className, ...p }: BtnProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        size === "md" ? "h-11 px-5 text-[15px]" : "h-9 px-3 text-sm",
        variant === "primary" && "bg-primary text-white hover:bg-primary-hover",
        variant === "outline" && "border border-line bg-card text-ink hover:bg-primary-soft",
        variant === "ghost" && "text-ink hover:bg-primary-soft",
        variant === "danger" && "bg-red-600 text-white hover:brightness-110",
        variant === "whatsapp" && "bg-success text-white hover:brightness-95",
        className,
      )}
      {...p}
    />
  );
}

export const inputCls = "w-full rounded-lg border border-line bg-card px-3 py-2.5 text-[15px] text-ink outline-none focus:border-primary focus:ring-3 focus:ring-primary/20";
export const Input = ({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) => <input className={cn(inputCls, className)} {...p} />;
export const Textarea = ({ className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea className={cn(inputCls, className)} {...p} />;
export const Select = ({ className, ...p }: SelectHTMLAttributes<HTMLSelectElement>) => <select className={cn(inputCls, "pr-8", className)} {...p} />;

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold text-ink">{label}</span>
      {children}
      {hint && <span className="block text-sm text-mute">{hint}</span>}
    </label>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn("rounded-2xl border border-line bg-card p-5 shadow-[0_1px_2px_rgba(24,21,44,0.04)]", className)}>{children}</section>;
}

export function Badge({ className, children }: { className?: string; children: ReactNode }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", className)}>{children}</span>;
}

export function PageHeader({ title, desc, action }: { title: string; desc: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink md:text-[28px]">{title}</h1>
        <p className="mt-1 text-mute">{desc}</p>
      </div>
      {action}
    </div>
  );
}

export function Empty({ title, desc, action }: { title: string; desc: string; action?: ReactNode }) {
  return (
    <Card className="flex flex-col items-center py-12 text-center">
      <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
      <p className="mt-1 max-w-md text-mute">{desc}</p>
      {action && <div className="mt-5">{action}</div>}
    </Card>
  );
}

export function Toggle({ name, label, defaultChecked, hint }: { name: string; label: string; defaultChecked?: boolean; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 py-1">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-1 size-4 accent-primary" />
      <span><span className="text-[15px] font-medium text-ink">{label}</span>{hint && <span className="block text-sm text-mute">{hint}</span>}</span>
    </label>
  );
}
