import type { ComponentProps, ReactNode } from "react";

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("card p-5", className)} {...props} />;
}

export function WidgetFrame({
  title,
  icon,
  action,
  children,
  className,
}: {
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "card flex h-full min-h-0 flex-col overflow-hidden",
        className,
      )}
    >
      <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
        <div className="flex items-center gap-2.5 text-text-muted">
          {icon}
          <h2 className="text-sm font-semibold uppercase tracking-wide">{title}</h2>
        </div>
        {action}
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar p-5">{children}</div>
    </section>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full min-h-24 items-center justify-center text-center text-sm text-text-subtle">
      {children}
    </div>
  );
}

export function Button({
  className,
  variant = "default",
  ...props
}: ComponentProps<"button"> & { variant?: "default" | "primary" | "ghost" | "danger" }) {
  const styles = {
    default: "bg-surface-2 hover:bg-surface-hover text-text border border-border",
    primary: "bg-accent hover:bg-accent-strong text-accent-fg",
    ghost: "hover:bg-surface-hover text-text-muted",
    danger: "bg-danger/10 hover:bg-danger/20 text-danger border border-danger/30",
  }[variant];
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-50",
        styles,
        className,
      )}
      {...props}
    />
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-text-muted">{label}</span>
      {children}
    </label>
  );
}

export function inputClass(extra?: string) {
  return cn(
    "w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2 text-sm text-text",
    "outline-none placeholder:text-text-subtle focus:border-accent focus:ring-2 focus:ring-accent-soft",
    extra,
  );
}
