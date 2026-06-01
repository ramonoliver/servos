"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/helpers";
import { SkeletonList } from "@/components/ui";

// ============================================
// TONE SYSTEM — shared accent palette
// Mirrors the dashboard "tone" language so every
// screen can pick from the same five accents.
// ============================================
export type Tone = "brand" | "success" | "amber" | "info" | "purple";

const toneText: Record<Tone, string> = {
  brand: "text-brand",
  success: "text-success",
  amber: "text-amber",
  info: "text-info",
  purple: "text-[#8B5BD6]",
};

const toneSoftBg: Record<Tone, string> = {
  brand: "bg-brand-light text-brand",
  success: "bg-success-light text-success",
  amber: "bg-amber-light text-amber",
  info: "bg-info-light text-info",
  purple: "bg-[#f4ecff] text-[#8B5BD6]",
};

// ============================================
// PAGE SHELL — consistent max-width + rhythm
// ============================================
export function PageShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
  /** @deprecated width is now unified by the app layout (1200px) */
  width?: "default" | "wide" | "narrow";
}) {
  return <div className={cn("w-full space-y-6 pb-8", className)}>{children}</div>;
}

// ============================================
// PAGE HEADER — single source of truth for the
// eyebrow + title + subtitle + actions pattern.
// Replaces .page-header markup and <PageIntro>.
// ============================================
export function PageHeader({
  eyebrow,
  tone = "brand",
  title,
  subtitle,
  actions,
  backHref,
  backLabel = "Voltar",
  className,
}: {
  eyebrow?: string;
  tone?: Tone;
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn("flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}
    >
      <div className="min-w-0">
        {backHref && (
          <Link
            href={backHref}
            className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-ink-muted transition-colors hover:text-ink"
          >
            <span aria-hidden>&larr;</span> {backLabel}
          </Link>
        )}
        {eyebrow && (
          <div className={cn("mb-1 text-[10px] font-bold uppercase tracking-[.12em]", toneText[tone])}>
            {eyebrow}
          </div>
        )}
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle mt-1 max-w-[640px]">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 self-start sm:self-auto">{actions}</div>}
    </motion.div>
  );
}

// ============================================
// SECTION CARD — consolidates `.card` + <SoftCard>.
// Optional header (title + action), padding control,
// gentle entrance, and an optional tonal top accent.
// ============================================
export function SectionCard({
  children,
  className,
  title,
  action,
  tone,
  padding = "default",
  href,
  animate = true,
}: {
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  action?: React.ReactNode;
  tone?: Tone;
  padding?: "default" | "tight" | "none";
  href?: string;
  animate?: boolean;
}) {
  const pad = padding === "none" ? "" : padding === "tight" ? "p-4" : "p-5";

  const inner = (
    <>
      {tone && <div className={cn("h-1 w-full", toneSoftBg[tone].split(" ")[0])} />}
      {title && (
        <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
          <span className="card-title">{title}</span>
          {action}
        </div>
      )}
      <div className={cn(title ? "px-5 pb-5" : pad)}>{children}</div>
    </>
  );

  const Wrapper: any = animate ? motion.div : "div";
  const motionProps = animate
    ? {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.2, ease: "easeOut" },
      }
    : {};

  const card = (
    <Wrapper
      {...motionProps}
      className={cn(
        "overflow-hidden rounded-[18px] border border-border-soft bg-surface shadow-sm",
        href && "transition-shadow hover:shadow-md",
        className
      )}
    >
      {inner}
    </Wrapper>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {card}
      </Link>
    );
  }
  return card;
}

// ============================================
// STAT TILE — modern metric card (dashboard look).
// ============================================
export function StatTile({
  value,
  label,
  tone = "brand",
  icon,
  hint,
  loading,
}: {
  value: React.ReactNode;
  label: string;
  tone?: Tone;
  icon?: React.ReactNode;
  hint?: string;
  loading?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="group rounded-[20px] border border-border-soft bg-surface p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className={cn("font-display text-[28px] leading-none tracking-tight", toneText[tone])}>
            {loading ? "···" : value}
          </div>
          <div className="mt-2 text-xs font-medium text-ink-muted">{label}</div>
          {hint && <div className="mt-0.5 text-[11px] text-ink-faint">{hint}</div>}
        </div>
        {icon && (
          <div
            className={cn(
              "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-lg",
              toneSoftBg[tone]
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ============================================
// SEGMENTED CONTROL — pill tab switcher.
// ============================================
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: React.ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-1 overflow-x-auto rounded-full border border-border-soft bg-white p-1", className)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "min-h-[36px] whitespace-nowrap rounded-full px-3.5 text-xs font-semibold transition-colors",
            value === opt.value ? "bg-brand-light text-brand" : "text-ink-muted hover:bg-surface-alt hover:text-ink"
          )}
          aria-pressed={value === opt.value}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ============================================
// PAGE LOADING — standard skeleton for list pages.
// ============================================
export function PageLoading({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-6">
      <SkeletonList rows={rows} />
    </div>
  );
}
