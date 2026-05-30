import { formatDate } from "@/lib/utils/helpers";
import { getPerson } from "@/lib/pastoral/selectors";
import type { CareCase, PastoralCell, PrayerRequest, TimelineEvent } from "@/lib/pastoral/types";
import type { Department, Event, Notification, Schedule, ScheduleMember, User } from "@/types";

export type Tone = "brand" | "success" | "amber" | "info" | "purple";

export type AgendaItem = {
  id: string;
  time: string;
  title: string;
  meta: string;
  tone: Tone;
  href: string;
};

export type HeroFocus = {
  eyebrow: string;
  title: string;
  description: string;
  timeMeta: string;
  status: string;
  href: string;
  people: User[];
  actionLabel: string;
  tone: Tone;
};

export type AttentionItem = {
  id: string;
  name: string;
  context: string;
  reason: string;
  time: string;
  action: string;
  href: string;
  tone: Tone;
  avatarColor?: string;
};

export type CommunityItem = {
  id: string;
  icon: string;
  tone: Tone;
  title: string;
  meta: string;
};

export type QuickAction = {
  label: string;
  href: string;
  icon: string;
};

export type DashboardStat = {
  icon: string;
  value: number | string;
  label: string;
  description: string;
  tone: Tone;
};

export const dashboardQuickActions: QuickAction[] = [
  { label: "Registrar presença", href: "/celulas", icon: "check" },
  { label: "Nova escala", href: "/escalas", icon: "calendar" },
  { label: "Adicionar pessoa", href: "/pessoas", icon: "user" },
  { label: "Enviar comunicado", href: "/comunicacao", icon: "send" },
];

export function getGreetingEmoji(greeting: string) {
  if (greeting === "Bom dia") return "☀️";
  if (greeting === "Boa tarde") return "🌤️";
  return "🌙";
}

export function getHeroFocus({
  upcomingSchedule,
  nextSchedEvent,
  nextSchedDept,
  nextSchedConfirmed,
  nextSchedSm,
  todaysCells,
  priorityCare,
  involvedUsers,
}: {
  upcomingSchedule: Schedule | null;
  nextSchedEvent: Event | null;
  nextSchedDept: Department | undefined;
  nextSchedConfirmed: number;
  nextSchedSm: ScheduleMember[];
  todaysCells: PastoralCell[];
  priorityCare: CareCase | undefined;
  involvedUsers: User[];
}): HeroFocus {
  if (todaysCells[0]) {
    return {
      eyebrow: "Hoje",
      title: todaysCells[0].name,
      description: `${todaysCells[0].address} · ${todaysCells[0].members.length} membros`,
      timeMeta: todaysCells[0].time,
      status: `${todaysCells[0].members.length} membros`,
      href: `/celulas/${todaysCells[0].id}`,
      people: [],
      actionLabel: "Abrir célula",
      tone: "brand",
    };
  }

  if (upcomingSchedule) {
    return {
      eyebrow: "Próxima escala",
      title: nextSchedEvent?.name || "Próxima escala",
      description: `${nextSchedDept?.name || "Ministério"} · ${upcomingSchedule.arrival_time || upcomingSchedule.time}`,
      timeMeta: `${formatDate(upcomingSchedule.date)} · ${upcomingSchedule.time}`,
      status: `${nextSchedConfirmed}/${nextSchedSm.length || 1} confirmados`,
      href: `/escalas?id=${upcomingSchedule.id}`,
      people: involvedUsers,
      actionLabel: "Abrir escala",
      tone: "brand",
    };
  }

  return {
    eyebrow: "Cuidado pastoral",
    title: priorityCare?.title || "Acompanhamento prioritário",
    description: priorityCare?.reason || "Há pessoas que podem receber atenção nesta semana.",
    timeMeta: "Esta semana",
    status: priorityCare?.priority === "high" ? "Alta prioridade" : "Em acompanhamento",
    href: "/pessoas",
    people: [],
    actionLabel: "Acompanhar",
    tone: "success",
  };
}

export function getHumanSummary({
  pendingTotal,
  myPending,
  todaysCells,
  alerts,
}: {
  pendingTotal: number;
  myPending: number;
  todaysCells: PastoralCell[];
  alerts: number;
}) {
  if (myPending > 0) {
    return `Você possui ${myPending} confirmação${myPending === 1 ? "" : "ões"} pendente${myPending === 1 ? "" : "s"} nas suas escalas.`;
  }
  if (todaysCells.length > 0) {
    return `Sua comunidade tem ${todaysCells.length} célula${todaysCells.length === 1 ? "" : "s"} se reunindo hoje.`;
  }
  if (pendingTotal > 0) {
    return `${pendingTotal} pessoa${pendingTotal === 1 ? "" : "s"} ainda precisam confirmar participação.`;
  }
  return `${alerts} sinais de cuidado estão organizados para acompanhamento pastoral.`;
}

export function getAgendaItems({
  upcoming,
  todayIso,
  events,
  departments,
  todaysCells,
}: {
  upcoming: Schedule[];
  todayIso: string;
  events: Event[];
  departments: Department[];
  todaysCells: PastoralCell[];
}): AgendaItem[] {
  return [
    ...upcoming
      .filter((schedule) => schedule.date === todayIso)
      .slice(0, 3)
      .map((schedule) => {
        const event = events.find((item) => item.id === schedule.event_id);
        const department = departments.find((item) => item.id === schedule.department_id);
        return {
          id: schedule.id,
          time: schedule.time,
          title: event?.name || "Escala",
          meta: department?.name || "Ministério",
          tone: "brand" as const,
          href: `/escalas?id=${schedule.id}`,
        };
      }),
    ...todaysCells.slice(0, 2).map((cell) => ({
      id: cell.id,
      time: cell.time,
      title: cell.name,
      meta: cell.address,
      tone: "success" as const,
      href: `/celulas/${cell.id}`,
    })),
  ].sort((a, b) => a.time.localeCompare(b.time));
}

export function getAttentionItems({
  careCases,
  prayerRequests,
}: {
  careCases: CareCase[];
  prayerRequests: PrayerRequest[];
}): AttentionItem[] {
  const care = careCases.slice(0, 2).map((item, index) => {
    const person = getPerson(item.personId);
    return {
      id: item.id,
      name: person?.fullName || item.title,
      context: index === 0 ? "Faltou 3 reuniões seguidas" : item.title,
      reason: item.reason,
      time: index === 0 ? "há 1h" : "há 3h",
      action: item.priority === "high" ? "Acompanhar" : "Abrir perfil",
      href: "/pessoas",
      tone: item.priority === "high" ? "amber" : "success",
      avatarColor: person?.avatarColor,
    } as AttentionItem;
  });

  const prayer = prayerRequests.slice(0, 1).map((item) => {
    const person = getPerson(item.personId);
    return {
      id: item.id,
      name: person?.fullName || "Pedido de oração",
      context: item.title,
      reason: item.description,
      time: "há 5h",
      action: "Orar",
      href: "/pedidos-oracao",
      tone: "purple",
      avatarColor: person?.avatarColor,
    } as AttentionItem;
  });

  return [...care, ...prayer].slice(0, 3);
}

export function getCommunityItems({
  involvedUsers,
  timelineEvents,
  notifications,
}: {
  involvedUsers: User[];
  timelineEvents: TimelineEvent[];
  notifications: Notification[];
}): CommunityItem[] {
  return [
    {
      id: "confirmacao",
      icon: "check",
      tone: "success",
      title: involvedUsers[0]?.name ? `${involvedUsers[0].name.split(" ")[0]} confirmou presença` : "Felipe confirmou presença",
      meta: "Célula Jardim · há 2h",
    },
    {
      id: "entrada",
      icon: "user",
      tone: "info",
      title: "Mariana entrou para a célula",
      meta: "Jovens Norte · há 4h",
    },
    {
      id: "oracao",
      icon: "heart",
      tone: "purple",
      title: "Bruno pediu oração",
      meta: "Por sabedoria no trabalho · há 6h",
    },
    {
      id: "registro",
      icon: "calendar",
      tone: "brand",
      title: timelineEvents[0]?.title || notifications[0]?.title || "Reunião registrada",
      meta: "Célula Jardim · há 8h",
    },
  ];
}

export function getDashboardStats({
  isMember,
  myPending,
  pendingTotal,
  openCareCount,
  prayerCount,
  newPeopleCount,
}: {
  isMember: boolean;
  myPending: number;
  pendingTotal: number;
  openCareCount: number;
  prayerCount: number;
  newPeopleCount: number;
}): DashboardStat[] {
  return [
    {
      icon: "calendar",
      value: isMember ? myPending : pendingTotal,
      label: "Pendências",
      description: "ações que precisam de você",
      tone: "brand",
    },
    {
      icon: "users",
      value: openCareCount,
      label: "Acompanhamentos",
      description: "pessoas em cuidado",
      tone: "success",
    },
    {
      icon: "heart",
      value: prayerCount,
      label: "Pedidos de oração",
      description: "aguardam oração",
      tone: "purple",
    },
    {
      icon: "user",
      value: newPeopleCount,
      label: "Novos esta semana",
      description: "pessoas conectadas",
      tone: "info",
    },
  ];
}