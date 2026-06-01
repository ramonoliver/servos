"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { getInitials, cn } from "@/lib/utils/helpers";
import type {
  AgendaItem,
  AttentionItem,
  DashboardStat,
  HeroFocus,
  Tone,
} from "@/lib/dashboard/home";
import { Avatar, Skeleton } from "@/components/ui";
import type { User } from "@/types";

// ============================================================
// ICONS — outline only (Aurora)
// ============================================================
export function Icon({ name, size = 18, className = "" }: { name: string; size?: number; className?: string }) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: cn("overflow-visible", className),
  };
  const icons: Record<string, React.ReactNode> = {
    plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
    bell: <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></>,
    search: <><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>,
    check: <><circle cx="12" cy="12" r="10" /><path d="M8 12l2.4 2.4L16 9" /></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="3" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></>,
    user: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
    "user-plus": <><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" /><circle cx="11" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></>,
    users: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /></>,
    heart: <path d="M12 21s-7-4.35-9.5-8.5C1 9.5 2.5 6 6 6c2 0 3.2 1.2 4 2.5C10.8 7.2 12 6 14 6c3.5 0 5 3.5 3.5 6.5C19 16.65 12 21 12 21z" />,
    flame: <path d="M12 2s5 3.8 5 9a5 5 0 01-10 0c0-1.6.6-2.7 1.2-3.4.5 1.1 1.6 1.6 2.3 1.6C9 7.5 11 4.5 12 2z" />,
    pin: <><path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></>,
    chevron: <polyline points="9 18 15 12 9 6" />,
  };
  return <svg {...props}>{icons[name] ?? icons.user}</svg>;
}

// ============================================================
// COUNT-UP — animated number reveal
// ============================================================
function CountUp({ to, duration = 1100 }: { to: number; duration?: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);
  return <>{n}</>;
}

// ============================================================
// GREETING + TOPBAR
// ============================================================
export function DashboardHeader({
  greeting,
  greetingEmoji,
  user,
  summary,
  unreadNotifications,
  dateLabel,
}: {
  greeting: string;
  greetingEmoji: string;
  user: User;
  summary: string;
  unreadNotifications: number;
  dateLabel: string;
}) {
  return (
    <div className="space-y-5">
      {/* topbar */}
      <div className="flex items-center justify-between gap-3">
        <label className="flex h-11 w-full max-w-[340px] items-center gap-2.5 rounded-full border border-border-soft bg-white/70 px-4 text-sm text-ink-faint shadow-soft backdrop-blur transition-all focus-within:border-brand/50 focus-within:ring-4 focus-within:ring-brand/10">
          <Icon name="search" size={16} />
          <input
            className="w-full border-none bg-transparent text-ink outline-none placeholder:text-ink-faint"
            placeholder="Buscar pessoas, escalas…"
          />
        </label>
        <div className="flex items-center gap-2.5">
          <Link
            href="/notificacoes"
            className="relative flex h-11 w-11 items-center justify-center rounded-[14px] border border-border-soft bg-white/70 text-ink-soft shadow-soft backdrop-blur transition hover:border-brand/20 hover:bg-white hover:text-brand-deep hover:shadow-lift"
          >
            <Icon name="bell" size={19} />
            {unreadNotifications > 0 && (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-brand" />
            )}
          </Link>
          <Link href="/escalas" className="btn btn-primary btn-sm">
            <Icon name="plus" size={16} /> Nova escala
          </Link>
        </div>
      </div>

      {/* greeting */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <div className="mb-1.5 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-brand-deep">
          <span className="aurora-pulse h-1.5 w-1.5 rounded-full bg-brand" />
          {dateLabel}
        </div>
        <h1 className="font-display text-[34px] font-extrabold leading-[1.05] tracking-tight text-ink sm:text-[38px]">
          {greeting}, {user.name.split(" ")[0]}{" "}
          <span className="aurora-wave inline-block">{greetingEmoji}</span>
        </h1>
        <p className="mt-2.5 max-w-[640px] text-[15px] leading-relaxed text-ink-muted">{summary}</p>
      </motion.div>
    </div>
  );
}

// ============================================================
// NEXT SCHEDULE HERO — "Próxima escala" with confirmation widget
// ============================================================
export function HeroCard({
  hero,
  confirmed,
  total,
}: {
  hero: HeroFocus;
  confirmed: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((confirmed / total) * 100) : 0;
  const pending = Math.max(total - confirmed, 0);
  const [fill, setFill] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setFill(pct), 350);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="relative overflow-hidden rounded-[26px] border border-border-soft bg-white/70 shadow-lift backdrop-blur-xl"
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,107,87,0.10),transparent_45%),radial-gradient(70%_120%_at_92%_8%,rgba(155,140,251,0.14),transparent_55%)]" />
      <div className="relative grid gap-5 p-6 lg:grid-cols-[1fr_270px]">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-light px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-brand-deep">
            <Icon name="clock" size={13} /> {hero.eyebrow}
          </span>
          <h2 className="mt-3.5 font-display text-[26px] font-extrabold leading-tight tracking-tight text-ink">{hero.title}</h2>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-[14px] text-ink-muted">
            <span className="inline-flex items-center gap-1.5"><Icon name="calendar" size={15} className="text-ink-faint" /><b className="font-semibold text-ink-soft">{hero.timeMeta}</b></span>
            <span className="inline-flex items-center gap-1.5"><Icon name="pin" size={15} className="text-ink-faint" /><b className="font-semibold text-ink-soft">{hero.description}</b></span>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {hero.people.length > 0 && (
              <div className="flex">
                {hero.people.slice(0, 5).map((p, i) => (
                  <div
                    key={p.id}
                    className={cn("flex h-9 w-9 items-center justify-center rounded-full border-[2.5px] border-white text-[11px] font-bold text-white shadow-soft", i > 0 && "-ml-2.5")}
                    style={{ background: p.avatar_color }}
                    title={p.name}
                  >
                    {getInitials(p.name)}
                  </div>
                ))}
                {hero.people.length > 5 && (
                  <div className="-ml-2.5 flex h-9 w-9 items-center justify-center rounded-full border-[2.5px] border-white bg-surface-hover text-[11px] font-bold text-ink-muted">
                    +{hero.people.length - 5}
                  </div>
                )}
              </div>
            )}
            <Link href={hero.href} className="btn btn-primary btn-sm">{hero.actionLabel}</Link>
          </div>
        </div>

        {/* confirmation widget */}
        <div className="flex flex-col gap-4 rounded-[22px] border border-border-soft bg-gradient-to-b from-white/90 to-white/55 p-5 shadow-soft">
          <div className="flex items-end justify-between gap-2">
            <div>
              <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.1em] text-ink-faint">Confirmados</div>
              <div className="font-display text-[34px] font-extrabold leading-none tracking-tight text-ink">
                <CountUp to={confirmed} /><span className="text-[18px] font-bold text-ink-faint">/{total}</span>
              </div>
            </div>
            <span className="rounded-full bg-brand-light px-2.5 py-1 text-xs font-extrabold text-brand-deep"><CountUp to={pct} />%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-ink/[0.08]">
            <div className="h-full rounded-full bg-gradient-to-r from-brand to-rose transition-[width] duration-[1200ms] ease-out" style={{ width: `${fill}%` }} />
          </div>
          <div className="flex gap-4 text-xs font-semibold text-ink-muted">
            <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-brand" />{confirmed} confirmados</span>
            <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-ink-ghost" />{pending} pendentes</span>
          </div>
          <Link href={hero.href} className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-deep transition-all hover:gap-2.5">
            Cobrar pendentes <Icon name="chevron" size={13} />
          </Link>
        </div>
      </div>
    </motion.section>
  );
}

// ============================================================
// STAT TILES — vertical, count-up, accent per index (coral/sun/lavender/rose)
// ============================================================
const TILE_TONES = [
  { num: "text-brand", icon: "bg-brand-light text-brand" },
  { num: "text-sun-deep", icon: "bg-sun-light text-sun-deep" },
  { num: "text-lavender-deep", icon: "bg-lavender-light text-lavender-deep" },
  { num: "text-rose-deep", icon: "bg-rose-light text-rose-deep" },
];

export function DashboardStatsGrid({ stats }: { stats: DashboardStat[] }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat, i) => {
        const tone = TILE_TONES[i % TILE_TONES.length];
        const numeric = typeof stat.value === "number";
        return (
          <motion.div
            key={`${stat.label}-${i}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: 0.04 * i }}
            className="rounded-[22px] border border-border-soft bg-white/70 p-5 shadow-soft backdrop-blur transition hover:border-white hover:bg-white/85 hover:shadow-lift"
          >
            <div className={cn("mb-3.5 flex h-11 w-11 items-center justify-center rounded-[14px]", tone.icon)}>
              <Icon name={stat.icon} size={21} />
            </div>
            <div className={cn("font-display text-[30px] font-extrabold leading-none tracking-tight", tone.num)}>
              {numeric ? <CountUp to={stat.value as number} /> : stat.value}
            </div>
            <div className="mt-1.5 text-[13px] font-semibold text-ink-soft">{stat.label}</div>
            <div className="mt-0.5 text-[12px] text-ink-faint">{stat.description}</div>
          </motion.div>
        );
      })}
    </section>
  );
}

// ============================================================
// SOFT CARD — glassy panel with header
// ============================================================
export function QuietPanel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
      className="rounded-[24px] border border-border-soft bg-white/70 p-5 shadow-soft backdrop-blur-xl"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-display text-[17px] font-bold text-ink">{title}</h2>
        {action}
      </div>
      {children}
    </motion.div>
  );
}

export function PanelLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 text-xs font-bold text-brand-deep transition-all hover:gap-2">
      {children} <Icon name="chevron" size={13} />
    </Link>
  );
}

// ============================================================
// AGENDA ROW — time chip + colored bar
// ============================================================
const ROW_ACCENT: Record<Tone, { bar: string; tag: string }> = {
  brand: { bar: "bg-brand", tag: "bg-brand-light text-brand-deep" },
  success: { bar: "bg-mint", tag: "bg-mint-light text-success-deep" },
  amber: { bar: "bg-sun", tag: "bg-sun-light text-sun-deep" },
  info: { bar: "bg-sky", tag: "bg-sky-light text-info" },
  purple: { bar: "bg-lavender", tag: "bg-lavender-light text-lavender-deep" },
};

export function AgendaRow({ item }: { item: AgendaItem }) {
  const accent = ROW_ACCENT[item.tone];
  return (
    <Link href={item.href} className="flex items-center gap-3 rounded-[16px] p-2.5 transition-all hover:translate-x-1 hover:bg-white/70">
      <div className="w-[52px] flex-shrink-0 text-center">
        <div className="font-display text-[15px] font-bold text-ink">{item.time}</div>
      </div>
      <div className={cn("h-9 w-[3px] flex-shrink-0 rounded-full", accent.bar)} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-bold text-ink">{item.title}</div>
        <div className="truncate text-[12.5px] text-ink-muted">{item.meta}</div>
      </div>
    </Link>
  );
}

// ============================================================
// ATTENTION ROW — person + action chip
// ============================================================
export function AttentionRow({ item }: { item: AttentionItem }) {
  const accent = ROW_ACCENT[item.tone];
  return (
    <Link href={item.href} className="flex items-center gap-3 rounded-[15px] p-2.5 transition-all hover:translate-x-1 hover:bg-white/70">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white" style={{ background: item.avatarColor || "#9B8CFB" }}>
        {getInitials(item.name)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13.5px] font-bold text-ink">{item.name}</div>
        <div className="truncate text-[12px] text-ink-muted">{item.context}</div>
      </div>
      <span className={cn("flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold", accent.tag)}>{item.action}</span>
    </Link>
  );
}

// ============================================================
// EMPTY LINE
// ============================================================
export function EmptyLine({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-[16px] bg-surface-alt/70 px-4 py-5 text-center">
      <div className="text-[13px] font-bold text-ink">{title}</div>
      <div className="mt-1 text-[12px] text-ink-muted">{description}</div>
    </div>
  );
}

// ============================================================
// VERSE — discreet footnote
// ============================================================
export function VerseCard({ text, reference }: { text: string; reference: string }) {
  return (
    <div className="flex flex-col gap-1.5 border-t border-border-soft pt-5 sm:flex-row sm:items-baseline sm:gap-4">
      <p className="max-w-[640px] text-[14px] italic leading-relaxed text-ink-muted">“{text}”</p>
      <p className="whitespace-nowrap text-[11.5px] font-bold uppercase tracking-[0.04em] text-ink-faint">{reference}</p>
    </div>
  );
}

// ============================================================
// SKELETON
// ============================================================
export function DashboardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-11 w-80 rounded-full" />
        <Skeleton className="h-11 w-36 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-9 w-72" />
      </div>
      <Skeleton className="h-56 rounded-[26px]" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-36 rounded-[22px]" />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-[24px]" />
        <Skeleton className="h-64 rounded-[24px]" />
      </div>
    </div>
  );
}
