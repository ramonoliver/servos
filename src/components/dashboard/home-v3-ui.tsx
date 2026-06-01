"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Avatar } from "@/components/ui";
import { cn } from "@/lib/utils/helpers";
import type { User } from "@/types";

type IconName =
  | "arrow"
  | "bell"
  | "calendar"
  | "check"
  | "chevron"
  | "heart"
  | "home"
  | "message"
  | "plus"
  | "search"
  | "settings"
  | "spark"
  | "users";

type Tone = "coral" | "care" | "cell" | "visitor" | "neutral";
type ProfileMode = "admin" | "hybrid" | "departmentMember" | "cellMember" | "connect";

export type PriorityCard = {
  label: string;
  value: number | string;
  description: string;
  href: string;
  action: string;
  icon: IconName;
  tone: Tone;
};

export type PriorityListItem = {
  title: string;
  meta: string;
  badge: string;
  href: string;
  icon: IconName;
};

export type TimelineItem = {
  title: string;
  meta: string;
  time: string;
  tone: Tone;
  icon: IconName;
};

export type UpcomingEventItem = {
  title: string;
  meta: string;
  time: string;
  location: string;
  badge: string;
  href: string;
  icon: IconName;
};

export type CarePerson = {
  id: string;
  name: string;
  reason: string;
  lastPresence: string;
  badge: string;
  avatarColor: string;
  photoUrl: string | null;
};

export type Insight = {
  value: string;
  label: string;
  description: string;
};

export type CellSummary = {
  name: string;
  nextMeeting: string;
  notice: string;
  leader: string;
  prayerCount: number;
  href: string;
};

export type PrayerRequestCardData = {
  title: string;
  description: string;
  person: string;
  href: string;
};

export type QuickActionItem = {
  label: string;
  href: string;
  icon: IconName;
};

export type DashboardV3Data = {
  profileMode: ProfileMode;
  greeting: string;
  heroTitle: string;
  heroSummary: string;
  user: User;
  churchName: string;
  unreadNotifications: number;
  priorities: PriorityCard[];
  priorityItems: PriorityListItem[];
  timeline: TimelineItem[];
  upcoming: UpcomingEventItem[];
  carePeople: CarePerson[];
  insights: Insight[];
  cell?: CellSummary;
  prayers: PrayerRequestCardData[];
  quickActions: QuickActionItem[];
};

const toneSurface: Record<Tone, string> = {
  coral: "bg-[#FFF0EC] text-[#191919]",
  care: "bg-[#FFF8ED] text-[#191919]",
  cell: "bg-[#F5F0FF] text-[#191919]",
  visitor: "bg-[#EEF9F1] text-[#191919]",
  neutral: "bg-white text-[#191919]",
};

const toneIcon: Record<Tone, string> = {
  coral: "bg-white/75 text-[#F4532A]",
  care: "bg-white/80 text-[#D99025]",
  cell: "bg-white/80 text-[#7B61FF]",
  visitor: "bg-white/80 text-[#33995B]",
  neutral: "bg-[#FAFAF8] text-[#777777]",
};

const toneDot: Record<Tone, string> = {
  coral: "bg-[#F4532A]",
  care: "bg-[#E7A13A]",
  cell: "bg-[#8C72FF]",
  visitor: "bg-[#45A86B]",
  neutral: "bg-[#B9B5C9]",
};

function Icon({ name, size = 18, className }: { name: IconName; size?: number; className?: string }) {
  const s = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.85,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: cn("overflow-visible", className),
  };
  const icons: Record<IconName, React.ReactNode> = {
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="3" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
    check: <><path d="M20 6 9 17l-5-5" /><path d="M21 12a9 9 0 1 1-4.8-8" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21.2l8.8-8.8a5.5 5.5 0 0 0 0-7.8Z" />,
    home: <><path d="M3 10 12 3l9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V10Z" /><path d="M9 22V12h6v10" /></>,
    message: <><path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5Z" /></>,
    plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4.2-4.2" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1h.1a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></>,
    spark: <><path d="M13 2 6 14h6l-1 8 7-12h-6l1-8Z" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.8" /><path d="M16 3.2a4 4 0 0 1 0 7.6" /></>,
  };
  return <svg {...s}>{icons[name]}</svg>;
}

function SectionTitle({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        {eyebrow && <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#AAAAAA]">{eyebrow}</div>}
        <h2 className="text-[22px] font-semibold tracking-[-0.025em] text-[#191919] md:text-[24px]">{title}</h2>
      </div>
      {action}
    </div>
  );
}

function Panel({
  children,
  className,
  dataSectionId,
}: {
  children: React.ReactNode;
  className?: string;
  dataSectionId?: string;
}) {
  return (
    <motion.section
      data-section={dataSectionId}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className={cn(
        "rounded-[28px] border border-[#F0EFEB] bg-white shadow-[0_18px_50px_-34px_rgba(25,25,25,0.35)]",
        className,
      )}
    >
      {children}
    </motion.section>
  );
}

export function DashboardHero({
  title,
  summary,
  churchName,
}: {
  title: string;
  summary: string;
  churchName: string;
}) {
  const [namePart, ...rest] = title.split(". ");
  const subtitlePart = rest.join(". ");
  const emoji = title.startsWith("Bom dia")
    ? "☀️"
    : title.startsWith("Boa tarde")
    ? "🌤️"
    : title.startsWith("Boa noite")
    ? "🌙"
    : "👋";

  return (
    <section
      data-section="hero"
      className="relative overflow-hidden rounded-[36px] border border-white bg-[linear-gradient(135deg,#FFFFFF_0%,#FFF0EC_48%,#FAFAF8_100%)] px-6 py-8 shadow-[0_28px_80px_-50px_rgba(244,83,42,0.30)] md:px-10 md:py-10"
    >
      <div className="pointer-events-none absolute -right-28 -top-36 h-72 w-72 rounded-full bg-[#F4532A]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-16 h-64 w-64 rounded-full bg-[#F4532A]/6 blur-3xl" />
      <div className="relative grid gap-8 lg:grid-cols-[1fr_320px] lg:items-end">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#F0EFEB] bg-white/75 px-3 py-1.5 text-[12px] font-semibold text-[#777777] shadow-[0_8px_24px_-18px_rgba(25,25,25,0.20)]">
            <span className="aurora-pulse h-1.5 w-1.5 rounded-full bg-[#F4532A]" />
            {churchName}
          </div>
          <h1 className="max-w-[860px] leading-[1.03] tracking-[-0.055em] text-[#191919]">
            <span className="text-[38px] font-bold md:text-[48px]">
              {namePart} <span className="aurora-wave inline-block">{emoji}</span>
            </span>
            {subtitlePart && (
              <span className="mt-2 block text-[18px] font-normal text-[#777777]">
                {subtitlePart}
              </span>
            )}
          </h1>
          <p className="mt-5 max-w-[690px] text-[15px] leading-7 text-[#777777] md:text-[16px]">
            {summary}
          </p>
        </div>
        <div className="rounded-[26px] border border-[#F0EFEB] bg-white/80 p-4 shadow-[0_18px_45px_-32px_rgba(25,25,25,0.35)] backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF0EC] text-[#F4532A]">
              <Icon name="spark" size={20} />
            </div>
            <div>
              <div className="text-[13px] font-semibold text-[#191919]">Radar inteligente</div>
              <div className="text-[12px] leading-5 text-[#777777]">
                Prioridades, cuidado e agenda em um só lugar.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function PriorityCards({ items }: { items: PriorityCard[] }) {
  return (
    <section data-section="priority-cards" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, delay: index * 0.04 }}
        >
          <Link
            href={item.href}
            className={cn(
              "group block min-h-[220px] rounded-[30px] border border-white/70 p-6 shadow-[0_18px_50px_-36px_rgba(25,25,25,0.4)] transition hover:border-white hover:shadow-[0_24px_60px_-36px_rgba(25,25,25,0.42)]",
              toneSurface[item.tone]
            )}
          >
            <div className="flex items-start justify-between gap-5">
              <div className={cn("flex h-14 w-14 items-center justify-center rounded-[22px] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]", toneIcon[item.tone])}>
                <Icon name={item.icon} size={24} />
              </div>
              <Icon name="arrow" size={18} className="mt-2 text-[#AAAAAA] transition group-hover:text-[#191919]" />
            </div>
            <div className="mt-8 text-[42px] font-bold leading-none tracking-[-0.055em] text-[#191919]">{item.value}</div>
            <div className="mt-3 text-[16px] font-semibold tracking-[-0.015em] text-[#191919]">{item.label}</div>
            <p className="mt-1.5 text-[14px] leading-6 text-[#777777]">{item.description}</p>
            <div className="mt-6 text-[13px] font-semibold text-[#191919]/72">{item.action}</div>
          </Link>
        </motion.div>
      ))}
    </section>
  );
}

const priorityBadgeColors: Record<string, string> = {
  Escalas: "bg-[#FFF0EC] text-[#D94420]",
  Cuidado: "bg-[#FFF8ED] text-[#C07B1A]",
  Células: "bg-[#EEF1FF] text-[#4A5ADE]",
  Pessoas: "bg-[#EEFAF2] text-[#1F8044]",
  Hoje: "bg-[#FFF0EC] text-[#F4532A] font-bold",
};

const priorityIconColors: Record<string, string> = {
  Escalas: "bg-[#FFF0EC] text-[#F4532A]",
  Cuidado: "bg-[#FFF8ED] text-[#C07B1A]",
  Células: "bg-[#EEF1FF] text-[#4A5ADE]",
  Pessoas: "bg-[#EEFAF2] text-[#1F8044]",
  Hoje: "bg-[#FFF0EC] text-[#F4532A]",
};

const priorityFallbackColors = { badge: "bg-[#F0EFEB] text-[#777777]", icon: "bg-[#FAFAF8] text-[#777777]" };

export function PriorityList({ items }: { items: PriorityListItem[] }) {
  return (
    <Panel className="p-6" dataSectionId="priority-list">
      <SectionTitle title="Prioridades de hoje" eyebrow="Ações" />
      <div className="space-y-2">
        {items.map((item) => {
          const badgeClass = priorityBadgeColors[item.badge] ?? priorityFallbackColors.badge;
          const iconClass = priorityIconColors[item.badge] ?? priorityFallbackColors.icon;
          return (
            <Link
              key={item.title}
              href={item.href}
              className="group flex items-center gap-3 rounded-[18px] px-2.5 py-3 transition hover:bg-[#FAFAF8]"
            >
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-2xl", iconClass)}>
                <Icon name={item.icon} size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-semibold text-[#191919]">{item.title}</div>
                <div className="truncate text-[12px] text-[#777777]">{item.meta}</div>
              </div>
              <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", badgeClass)}>{item.badge}</span>
              <Icon name="chevron" size={16} className="text-[#AAAAAA] transition group-hover:text-[#191919]" />
            </Link>
          );
        })}
      </div>
    </Panel>
  );
}

export function ActivityTimeline({ items }: { items: TimelineItem[] }) {
  return (
    <Panel className="p-6" dataSectionId="timeline">
      <SectionTitle title="Timeline viva" eyebrow="Comunidade" />
      <div className="relative space-y-1 pl-3">
        <div className="absolute bottom-6 left-[31px] top-3 w-px bg-[#F0EFEB]" />
        {items.map((item) => (
          <div key={`${item.title}-${item.time}`} className="relative flex gap-4 py-3">
            <div className={cn("relative z-10 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-[5px] border-white text-white", toneDot[item.tone])}>
              <Icon name={item.icon} size={13} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <div className="truncate text-[14px] font-semibold text-[#191919]">{item.title}</div>
                <div className="flex-shrink-0 text-[11px] font-medium text-[#AAAAAA]">{item.time}</div>
              </div>
              <p className="mt-1 text-[12px] leading-5 text-[#777777]">{item.meta}</p>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

const eventIconColors: Record<string, { bg: string; text: string }> = {
  calendar: { bg: "bg-[#FFF0EC]", text: "text-[#F4532A]" },
  home: { bg: "bg-[#EEF1FF]", text: "text-[#4A5ADE]" },
};

const eventIconFallback = { bg: "bg-[#FAFAF8]", text: "text-[#777777]" };

export function UpcomingEvents({ items }: { items: UpcomingEventItem[] }) {
  return (
    <Panel className="p-6" dataSectionId="upcoming-events">
      <SectionTitle title="Próximos encontros" eyebrow="Agenda" />
      <div className="space-y-3">
        {items.map((item) => {
          const iconStyle = eventIconColors[item.icon] ?? eventIconFallback;
          return (
            <Link
              key={`${item.title}-${item.time}`}
              href={item.href}
              className="block rounded-[20px] border border-[#F0EFEB] bg-white p-4 transition hover:border-[#F0EFEB] hover:bg-[#FAFAF8]"
            >
              <div className="flex gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl",
                    iconStyle.bg,
                    iconStyle.text,
                  )}
                >
                  <Icon name={item.icon} size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-semibold text-[#191919]">{item.title}</div>
                  <div className="mt-1 text-[12px] text-[#777777]">
                    {item.time} · {item.location}
                  </div>
                  <div className="mt-1 text-[12px] text-[#AAAAAA]">{item.meta}</div>
                </div>
                <span className="h-fit rounded-full bg-[#FFF0EC] px-2.5 py-1 text-[11px] font-semibold text-[#D94420]">
                  {item.badge}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </Panel>
  );
}

export function CarePeopleSection({ people }: { people: CarePerson[] }) {
  return (
    <Panel className="p-6" dataSectionId="care-people">
      <SectionTitle title="Pessoas precisando de cuidado" eyebrow="Cuidado pastoral" />
      <div className="grid gap-4 lg:grid-cols-2">
        {people.map((person) => (
          <div key={person.id} className="rounded-[24px] border border-[#F0EFEB] bg-white p-5">
            <div className="flex items-start gap-3">
              <Avatar name={person.name} color={person.avatarColor} photoUrl={person.photoUrl} size={44} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-semibold text-[#191919]">{person.name}</div>
                <div className="mt-1 text-[13px] leading-5 text-[#777777]">{person.reason}</div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#FFF0EC] px-2.5 py-1 text-[11px] font-semibold text-[#D94420]">{person.badge}</span>
                  <span className="text-[11px] text-[#AAAAAA]">{person.lastPresence}</span>
                </div>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {["Contato", "Acompanhar", "Orar"].map((label) => (
                <button key={label} className="min-h-10 rounded-full border border-[#F0EFEB] px-3 text-[12px] font-semibold text-[#191919] transition hover:bg-[#FAFAF8]">
                  {label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function InsightCards({ items }: { items: Insight[] }) {
  return (
    <Panel className="p-6" dataSectionId="insights">
      <SectionTitle title="Insights da semana" eyebrow="Leitura pastoral" />
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className="rounded-[22px] border border-[#F0EFEB] bg-[#FAFAF8] p-4">
            <div className="text-[27px] font-bold leading-none tracking-[-0.045em] text-[#191919]">{item.value}</div>
            <div className="mt-2 text-[13px] font-semibold text-[#191919]">{item.label}</div>
            <p className="mt-1 text-[12px] leading-5 text-[#777777]">{item.description}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function CellCard({ cell }: { cell?: CellSummary }) {
  if (!cell) return null;
  return (
    <Panel className="bg-[#F5F0FF] p-6" dataSectionId="cell">
      <SectionTitle title="Minha célula" eyebrow="Comunhão" />
      <div className="rounded-[24px] bg-white/70 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[18px] font-semibold tracking-[-0.025em] text-[#191919]">{cell.name}</div>
            <p className="mt-2 text-[13px] leading-6 text-[#777777]">{cell.nextMeeting}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#7B61FF]">
            <Icon name="home" size={22} />
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[18px] bg-white p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#AAAAAA]">Aviso</div>
            <div className="mt-1 text-[13px] leading-5 text-[#191919]">{cell.notice}</div>
          </div>
          <div className="rounded-[18px] bg-white p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#AAAAAA]">Liderança</div>
            <div className="mt-1 text-[13px] leading-5 text-[#191919]">{cell.leader}</div>
            <div className="mt-1 text-[12px] text-[#777777]">{cell.prayerCount} pedidos de oração</div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

export function PrayerRequestCard({ items }: { items: PrayerRequestCardData[] }) {
  if (!items.length) return null;
  return (
    <Panel className="p-6" dataSectionId="prayer-requests">
      <SectionTitle title="Pedidos de oração" eyebrow="Cuidado" />
      <div className="space-y-3">
        {items.map((item) => (
          <Link key={item.title} href={item.href} className="block rounded-[20px] border border-[#F0EFEB] bg-white p-4 transition hover:bg-[#FAFAF8]">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-[#FFF8ED] text-[#D99025]">
                <Icon name="heart" size={18} />
              </div>
              <div>
                <div className="text-[14px] font-semibold text-[#191919]">{item.title}</div>
                <p className="mt-1 text-[12px] leading-5 text-[#777777]">{item.description}</p>
                <div className="mt-2 text-[11px] font-medium text-[#AAAAAA]">{item.person}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Panel>
  );
}

export function QuickActions({ items }: { items: QuickActionItem[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Link key={item.label} href={item.href} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#F0EFEB] bg-white px-4 text-[13px] font-semibold text-[#191919] shadow-[0_10px_24px_-20px_rgba(25,25,25,0.4)] transition hover:bg-[#FAFAF8]">
          <Icon name={item.icon} size={15} />
          {item.label}
        </Link>
      ))}
    </div>
  );
}

export function PersonalizedEmptyState() {
  return (
    <Panel className="p-6" dataSectionId="empty-state">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-[20px] font-semibold tracking-[-0.025em] text-[#191919]">Vamos ajudar você a se conectar.</div>
          <p className="mt-2 max-w-[620px] text-[14px] leading-6 text-[#777777]">
            Encontre uma célula, conheça ministérios e complete seu cadastro para receber convites alinhados com sua caminhada.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/celulas" className="rounded-full bg-[linear-gradient(135deg,#F4532A_0%,#F4532A_100%)] px-4 py-2.5 text-[13px] font-semibold text-white shadow-[0_14px_30px_-16px_rgba(244,83,42,0.75)]">Encontrar célula</Link>
          <Link href="/ministerios" className="rounded-full border border-[#F0EFEB] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#191919]">Quero servir</Link>
        </div>
      </div>
    </Panel>
  );
}

export function DashboardV3Topbar({ unreadNotifications }: { unreadNotifications: number }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div
      data-section="topbar"
      className="sticky top-0 z-20 -mx-4 mb-6 border-b border-white/70 bg-[#FAFAF8]/75 px-4 py-4 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 xl:-mx-10 xl:px-10"
    >
      <div className="mx-auto flex min-h-[56px] max-w-[1240px] items-center gap-4">
        <label className="mx-auto flex h-12 w-full max-w-[620px] items-center gap-3 rounded-full border border-[#F0EFEB] bg-white px-4 text-[14px] text-[#777777] shadow-[0_14px_35px_-28px_rgba(25,25,25,0.25)]">
          <Icon name="search" size={17} />
          <input
            className="min-w-0 flex-1 border-0 bg-transparent text-[#191919] outline-none placeholder:text-[#AAAAAA]"
            placeholder="Buscar pessoas, escalas, células, ministérios..."
          />
        </label>
        <Link
          href="/notificacoes"
          className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-[#F0EFEB] bg-white text-[#777777] transition hover:bg-[#FAFAF8]"
        >
          <Icon name="bell" size={18} />
          {unreadNotifications > 0 && (
            <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-[#F4532A]" />
          )}
        </Link>
        <div ref={dropdownRef} className="relative hidden md:block">
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex min-h-12 flex-shrink-0 items-center gap-2 rounded-full bg-[#F4532A] px-5 text-[14px] font-semibold text-white shadow-[0_16px_34px_-18px_rgba(244,83,42,0.55)] transition hover:brightness-[0.97]"
          >
            <Icon name="plus" size={17} />
            Ações rápidas
            <Icon
              name="chevron"
              size={14}
              className={cn("transition-transform duration-200", open && "rotate-90")}
            />
          </button>
          {open && (
            <div className="absolute right-0 top-[calc(100%+8px)] w-44 overflow-hidden rounded-[14px] border border-[#F0EFEB] bg-white shadow-[0_12px_32px_-16px_rgba(25,25,25,0.25)]">
              {(
                [
                  { label: "Nova escala", href: "/escalas/nova", icon: "plus" as const },
                  { label: "Nova célula", href: "/celulas", icon: "home" as const },
                  { label: "Nova pessoa", href: "/pessoas", icon: "users" as const },
                ] as const
              ).map((item, i, arr) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 px-4 py-3 text-[13px] font-medium text-[#191919] transition hover:bg-[#FAFAF8]",
                    i < arr.length - 1 && "border-b border-[#F0EFEB]",
                  )}
                >
                  <Icon name={item.icon} size={14} />
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function DashboardV3Home({ data }: { data: DashboardV3Data }) {
  const showPastoralManagement = data.profileMode === "admin" || data.profileMode === "hybrid";
  const showCellLife = data.profileMode === "hybrid" || data.profileMode === "cellMember";

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <DashboardV3Topbar unreadNotifications={data.unreadNotifications} />
      <div className="mx-auto max-w-[1240px] space-y-6 pb-12">
        <DashboardHero
          title={data.heroTitle}
          summary={data.heroSummary}
          churchName={data.churchName}
        />
        {data.profileMode === "connect" && <PersonalizedEmptyState />}
        <PriorityCards items={data.priorities} />

        <section className="grid gap-6 xl:grid-cols-[1fr_1fr_360px]">
          {showPastoralManagement ? <PriorityList items={data.priorityItems} /> : <ActivityTimeline items={data.timeline} />}
          {showPastoralManagement ? <ActivityTimeline items={data.timeline} /> : <PrayerRequestCard items={data.prayers} />}
          <UpcomingEvents items={data.upcoming} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
          {showPastoralManagement ? <CarePeopleSection people={data.carePeople} /> : showCellLife ? <CellCard cell={data.cell} /> : <PrayerRequestCard items={data.prayers} />}
          <div className="space-y-6">
            {showCellLife && showPastoralManagement && <CellCard cell={data.cell} />}
            <InsightCards items={data.insights} />
            {!showPastoralManagement && showCellLife && <PrayerRequestCard items={data.prayers} />}
          </div>
        </section>
      </div>
    </div>
  );
}
