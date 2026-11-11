// Lightweight UI kit adapted from TailAdmin (MIT) — plain Tailwind, no runtime UI library.
import Link from "next/link";
import type React from "react";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/* ---------------------------------- Button --------------------------------- */

type ButtonVariant = "primary" | "outline" | "ghost" | "danger" | "success";
type ButtonSize = "xs" | "sm" | "md" | "lg";

const buttonBase =
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg border font-medium transition-all outline-none select-none active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 disabled:active:translate-y-0 [&_svg]:shrink-0";

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "border-transparent bg-brand-600 text-white shadow-theme-xs hover:bg-brand-700 focus-visible:ring-3 focus-visible:ring-brand-500/25 dark:bg-brand-600 dark:hover:bg-brand-500",
  outline:
    "border-gray-300 bg-white text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 focus-visible:ring-3 focus-visible:ring-gray-300/50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white",
  ghost:
    "border-transparent bg-transparent text-gray-700 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white",
  danger:
    "border-red-200 bg-white text-red-600 shadow-theme-xs hover:bg-red-50 focus-visible:ring-3 focus-visible:ring-red-500/20 dark:border-red-500/30 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-500/10",
  success:
    "border-green-200 bg-white text-green-700 shadow-theme-xs hover:bg-green-50 dark:border-green-500/30 dark:bg-transparent dark:text-green-400 dark:hover:bg-green-500/10",
};

const buttonSizes: Record<ButtonSize, string> = {
  xs: "h-8 px-3 text-xs [&_svg]:size-3.5",
  sm: "h-9 px-3.5 text-sm [&_svg]:size-4",
  md: "h-11 px-4 text-sm [&_svg]:size-5",
  lg: "h-12 px-5 text-base [&_svg]:size-5",
};

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(buttonBase, buttonVariants[variant], buttonSizes[size], className);
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

/* ---------------------------------- Inputs --------------------------------- */

export const inputClass =
  "h-11 w-full min-w-0 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs outline-none transition-colors placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/15 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100/60 disabled:text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-gray-500 dark:focus:border-brand-500/50 dark:disabled:border-gray-800 dark:disabled:bg-gray-800/50";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputClass, className)} {...props} />;
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(inputClass, "appearance-auto pr-3", className)} {...props} />;
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputClass, "h-auto min-h-24 py-3", className)} {...props} />;
}

export function Field({
  label,
  hint,
  className,
  children,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">{label}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-xs text-gray-500 dark:text-gray-400">{hint}</span> : null}
    </label>
  );
}

export const checkboxClass =
  "size-5 shrink-0 cursor-pointer rounded-md border-gray-300 accent-brand-600 dark:border-gray-700";

/* ----------------------------------- Card ---------------------------------- */

export function Card({
  className,
  title,
  description,
  actions,
  children,
  bodyClassName,
}: {
  className?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  bodyClassName?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]",
        className
      )}
    >
      {title || actions ? (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 px-5 py-4 sm:px-6 dark:border-gray-800">
          <div>
            {title ? <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">{title}</h3> : null}
            {description ? (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className={cn("p-5 sm:p-6", bodyClassName)}>{children}</div>
    </div>
  );
}

/* -------------------------------- Page header ------------------------------- */

export function PageHeader({
  title,
  description,
  actions,
  crumbs,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  crumbs?: Array<{ label: string; href?: string }>;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {crumbs && crumbs.length ? (
          <nav className="mb-1.5">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
              {crumbs.map((c, i) => (
                <li key={i} className="inline-flex items-center gap-1.5">
                  {c.href ? (
                    <Link href={c.href} className="hover:text-brand-600 dark:hover:text-brand-300">
                      {c.label}
                    </Link>
                  ) : (
                    <span className="text-gray-800 dark:text-white/90">{c.label}</span>
                  )}
                  {i < crumbs.length - 1 ? (
                    <svg width="16" height="16" viewBox="0 0 17 16" fill="none" aria-hidden="true">
                      <path
                        d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : null}
                </li>
              ))}
            </ol>
          </nav>
        ) : null}
        <h2 className="text-xl font-semibold text-gray-800 sm:text-2xl dark:text-white/90">{title}</h2>
        {description ? <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/* ---------------------------------- Badge ---------------------------------- */

type BadgeColor = "primary" | "success" | "error" | "warning" | "gray" | "gold";

const badgeColors: Record<BadgeColor, string> = {
  primary: "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300",
  success: "bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  error: "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400",
  warning: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  gray: "bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-white/80",
  gold: "bg-gold-100 text-gold-700 dark:bg-gold-400/15 dark:text-gold-300",
};

export function Badge({
  color = "primary",
  className,
  children,
}: {
  color?: BadgeColor;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center justify-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium",
        badgeColors[color],
        className
      )}
    >
      {children}
    </span>
  );
}

/* ---------------------------------- Alert ---------------------------------- */

export function Alert({
  variant = "error",
  children,
  className,
}: {
  variant?: "error" | "success" | "info";
  children: React.ReactNode;
  className?: string;
}) {
  const styles = {
    error: "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-300",
    success:
      "border-green-200 bg-green-50 text-green-800 dark:border-green-500/30 dark:bg-green-500/15 dark:text-green-300",
    info: "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300",
  }[variant];
  return (
    <div role={variant === "error" ? "alert" : "status"} className={cn("rounded-xl border p-3.5 text-sm", styles, className)}>
      {children}
    </div>
  );
}

/* ---------------------------------- Table ---------------------------------- */

export const tableWrapClass =
  "overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]";
export const tableClass = "w-full text-left text-sm";
export const theadClass = "border-b border-gray-100 dark:border-gray-800";
export const thClass = "px-5 py-3 text-xs font-medium whitespace-nowrap text-gray-500 dark:text-gray-400";
export const tbodyClass = "divide-y divide-gray-100 dark:divide-gray-800";
export const tdClass = "px-5 py-3.5 text-gray-700 dark:text-gray-300";

/* -------------------------------- Stat card -------------------------------- */

export function StatCard({
  icon,
  label,
  value,
  sub,
  tone = "brand",
}: {
  icon?: React.ReactNode;
  label: React.ReactNode;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: "brand" | "gold" | "gray";
}) {
  const iconTone = {
    brand: "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300",
    gold: "bg-gold-100 text-gold-700 dark:bg-gold-400/15 dark:text-gold-300",
    gray: "bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-gray-300",
  }[tone];
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center gap-4">
        {icon ? (
          <div className={cn("flex size-12 shrink-0 items-center justify-center rounded-xl [&_svg]:size-6", iconTone)}>
            {icon}
          </div>
        ) : null}
        <div className="min-w-0">
          <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
          <div className="mt-1 truncate text-xl font-bold text-gray-800 dark:text-white/90">{value}</div>
          {sub ? <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{sub}</div> : null}
        </div>
      </div>
    </div>
  );
}
