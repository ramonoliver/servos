"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/hooks/use-app";
import { supabase } from "@/lib/supabase/client";
import { getGreeting } from "@/lib/utils/helpers";
import { getPerson } from "@/lib/pastoral/selectors";
import {
  careCases,
  pastoralCells,
  prayerRequests,
  timelineEvents,
} from "@/lib/pastoral/mock-data";
import {
  DashboardV3Home,
  type CarePerson,
  type CellSummary,
  type DashboardV3Data,
  type Insight,
  type PrayerRequestCardData,
  type PriorityCard,
  type PriorityListItem,
  type QuickActionItem,
  type TimelineItem,
  type UpcomingEventItem,
} from "@/components/dashboard/home-v3-ui";
import type { Department, Event, Notification, Schedule, ScheduleMember, User } from "@/types";

function formatShortDate(date: string) {
  const value = new Date(`${date}T12:00:00`);
  return value.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" }).replace(".", "");
}

function formatRelative(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const hours = Math.max(1, Math.round(diff / 36e5));
  if (hours < 24) return `há ${hours}h`;
  return `há ${Math.round(hours / 24)}d`;
}

function timelineTone(tone: string): TimelineItem["tone"] {
  if (tone === "success") return "visitor";
  if (tone === "amber") return "care";
  if (tone === "info") return "cell";
  if (tone === "danger") return "coral";
  return "coral";
}

function DashboardV3Skeleton() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] p-6">
      <div className="mx-auto max-w-[1240px] space-y-6">
        <div className="h-12 rounded-full bg-white" />
        <div className="h-72 rounded-[36px] bg-white" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => <div key={item} className="h-56 rounded-[30px] bg-white" />)}
        </div>
      </div>
    </div>
  );
}

export default function DashboardV3Page() {
  const { user, church, departments, unreadNotifications } = useApp();
  const [members, setMembers] = useState<User[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [scheduleMembers, setScheduleMembers] = useState<ScheduleMember[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const visibleDepartmentIds = useMemo(() => departments.map((department) => department.id), [departments]);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      const [
        { data: membersData },
        { data: schedulesData },
        { data: eventsData },
        { data: notificationsData },
        { data: departmentMembersData },
      ] = await Promise.all([
        supabase.from("users").select("*").eq("church_id", user.church_id).eq("active", true),
        supabase.from("schedules").select("*").eq("church_id", user.church_id).neq("status", "cancelled"),
        supabase.from("events").select("*").eq("church_id", user.church_id),
        supabase.from("notifications").select("*").eq("user_id", user.id).eq("read", false).limit(8),
        departments.length
          ? supabase.from("department_members").select("*").in("department_id", visibleDepartmentIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      const allSchedules = (schedulesData || []) as Schedule[];
      const scheduleIds = allSchedules.map((schedule) => schedule.id);
      const { data: smData } = scheduleIds.length
        ? await supabase.from("schedule_members").select("*").in("schedule_id", scheduleIds)
        : { data: [] };

      if (cancelled) return;

      const scopedDepartmentIds = new Set(visibleDepartmentIds);
      const scopedSchedules =
        user.role === "admin"
          ? allSchedules
          : allSchedules.filter((schedule) => scopedDepartmentIds.has(schedule.department_id));
      const scopedScheduleIds = new Set(scopedSchedules.map((schedule) => schedule.id));
      const scopedMembers =
        user.role === "admin"
          ? ((membersData || []) as User[])
          : ((membersData || []) as User[]).filter((member) =>
              ((departmentMembersData || []) as Array<{ user_id: string; department_id: string }>).some(
                (link) => link.user_id === member.id && scopedDepartmentIds.has(link.department_id)
              )
            );

      setMembers(scopedMembers);
      setSchedules(scopedSchedules);
      setScheduleMembers(((smData || []) as ScheduleMember[]).filter((sm) => scopedScheduleIds.has(sm.schedule_id)));
      setEvents((eventsData || []) as Event[]);
      setNotifications((notificationsData || []) as Notification[]);
      setLoading(false);
    }

    void loadData();
    return () => {
      cancelled = true;
    };
  }, [departments.length, user.church_id, user.id, user.role, visibleDepartmentIds]);

  const data = useMemo<DashboardV3Data>(() => {
    const today = new Date();
    const todayIso = today.toISOString().slice(0, 10);
    const greeting = getGreeting();
    const firstName = user.name.split(" ")[0] || user.name;
    const isAdminLike = user.role === "admin" || user.role === "leader" || user.cell_role === "pastor" || user.cell_role === "coordenacao";
    const hasMinistry = departments.length > 0;
    const profileMode: DashboardV3Data["profileMode"] = isAdminLike
      ? user.role === "leader"
        ? "hybrid"
        : "admin"
      : hasMinistry
      ? "departmentMember"
      : pastoralCells.length
      ? "cellMember"
      : "connect";

    const activeSchedules = schedules.filter((schedule) => schedule.status === "active" && schedule.published);
    const upcomingSchedules = activeSchedules
      .filter((schedule) => schedule.date >= todayIso)
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
    const pendingConfirmations = scheduleMembers.filter((sm) =>
      activeSchedules.some((schedule) => schedule.id === sm.schedule_id) && sm.status === "pending"
    ).length;
    const myPending = scheduleMembers.filter((sm) => sm.user_id === user.id && sm.status === "pending").length;
    const myUpcoming = scheduleMembers
      .filter((sm) => sm.user_id === user.id)
      .map((sm) => upcomingSchedules.find((schedule) => schedule.id === sm.schedule_id))
      .filter(Boolean) as Schedule[];
    const nextMemberSchedule = myUpcoming[0] || upcomingSchedules[0];
    const todaysCells = pastoralCells.filter((cell) => {
      const weekday = today.toLocaleDateString("pt-BR", { weekday: "long" }).toLowerCase();
      return weekday.startsWith(cell.weekDay.slice(0, 3).toLowerCase());
    });
    const activePrayerRequests = prayerRequests.filter((request) => request.status === "open");
    const visitorsWithoutCare = 1;
    const openCareCount = careCases.filter((care) => care.status !== "finished").length;

    const heroTitle =
      profileMode === "connect"
        ? `Bem-vindo ao Servos, ${firstName}. Vamos ajudar você a se conectar.`
        : profileMode === "cellMember"
        ? `${greeting}, ${firstName}. Sua comunidade está organizada para hoje.`
        : `${greeting}, ${firstName}. Aqui está o que precisa da sua atenção hoje.`;

    const heroSummary =
      profileMode === "connect"
        ? "Comece encontrando uma célula, conhecendo ministérios e completando seu cadastro para receber os próximos convites."
        : isAdminLike
        ? `Hoje você possui ${pendingConfirmations} confirmações pendentes e ${openCareCount} pessoas precisando de cuidado.`
        : nextMemberSchedule
        ? `Sua próxima escala acontece em ${formatShortDate(nextMemberSchedule.date)} às ${nextMemberSchedule.time}.`
        : `Sua próxima célula acontece ${pastoralCells[0]?.weekDay.toLowerCase() || "esta semana"} às ${pastoralCells[0]?.time || "20:00"}.`;
    const heroFocus =
      profileMode === "connect"
        ? "Complete seu cadastro, encontre uma célula e conheça ministérios para servir."
        : isAdminLike
        ? `Hoje você possui ${pendingConfirmations} confirmações pendentes e ${openCareCount} pessoas precisando de cuidado.`
        : heroSummary;

    const priorities: PriorityCard[] = isAdminLike
      ? [
          {
            label: "Confirmações pendentes",
            value: pendingConfirmations,
            description: "voluntários ainda precisam responder às escalas.",
            href: "/escalas",
            action: "Revisar confirmações",
            icon: "check",
            tone: "coral",
          },
          {
            label: "Pessoas em cuidado",
            value: openCareCount,
            description: "acompanhamentos pastorais em aberto.",
            href: "/acompanhamentos",
            action: "Abrir cuidado",
            icon: "heart",
            tone: "care",
          },
          {
            label: "Células acontecendo",
            value: Math.max(todaysCells.length, 2),
            description: "encontros ativos ou próximos nesta semana.",
            href: "/celulas",
            action: "Ver células",
            icon: "calendar",
            tone: "cell",
          },
          {
            label: "Visitantes sem acompanhamento",
            value: visitorsWithoutCare,
            description: "pessoas novas aguardando conexão.",
            href: "/pessoas",
            action: "Conectar visitantes",
            icon: "users",
            tone: "visitor",
          },
        ]
      : [
          {
            label: "Minhas confirmações",
            value: myPending,
            description: "respostas pendentes nas suas escalas.",
            href: "/minhas-escalas",
            action: "Responder agora",
            icon: "check",
            tone: "coral",
          },
          {
            label: "Próxima escala",
            value: nextMemberSchedule ? nextMemberSchedule.time : "Livre",
            description: nextMemberSchedule ? formatShortDate(nextMemberSchedule.date) : "nenhuma escala publicada.",
            href: "/minhas-escalas",
            action: "Ver detalhes",
            icon: "calendar",
            tone: "care",
          },
          {
            label: "Minha célula",
            value: pastoralCells[0]?.time || "20:00",
            description: pastoralCells[0]?.name || "encontro da semana.",
            href: "/celulas",
            action: "Abrir célula",
            icon: "home",
            tone: "cell",
          },
          {
            label: "Pedidos de oração",
            value: activePrayerRequests.length,
            description: "motivos compartilhados para intercessão.",
            href: "/pedidos-oracao",
            action: "Orar agora",
            icon: "heart",
            tone: "visitor",
          },
        ];

    const priorityItems: PriorityListItem[] = [
      {
        title: "Confirmar escala do Louvor",
        meta: "Ainda faltam respostas para domingo",
        badge: "Escalas",
        href: "/escalas",
        icon: "check",
      },
      {
        title: "Entrar em contato com Elisa",
        meta: "Visitante recorrente sem célula",
        badge: "Cuidado",
        href: "/pessoas",
        icon: "heart",
      },
      {
        title: "Aprovar visitantes",
        meta: "Novas pessoas aguardando acolhimento",
        badge: "Pessoas",
        href: "/pessoas",
        icon: "users",
      },
      {
        title: "Revisar célula Jovens Norte",
        meta: "Encontro com novos participantes",
        badge: "Células",
        href: "/celulas",
        icon: "calendar",
      },
      {
        title: "Fechar escala de produção",
        meta: "Publicação pendente para os voluntários",
        badge: "Hoje",
        href: "/escalas",
        icon: "settings",
      },
    ];

    const timeline: TimelineItem[] = [
      ...timelineEvents.slice(0, 4).map((event) => {
        const person = getPerson(event.personId);
        return {
          title: person ? `${person.fullName.split(" ")[0]}: ${event.title.toLowerCase()}` : event.title,
          meta: event.description,
          time: formatRelative(event.date),
          tone: timelineTone(event.tone),
          icon: event.type === "schedule_confirmed" ? "check" : event.type === "visit" ? "users" : event.type === "absence" ? "heart" : "spark",
        } satisfies TimelineItem;
      }),
      ...notifications.slice(0, 1).map((notification) => ({
        title: notification.title,
        meta: notification.body,
        time: formatRelative(notification.created_at),
        tone: "neutral" as const,
        icon: "bell" as const,
      })),
    ].slice(0, 5);

    const upcomingFromSchedules: UpcomingEventItem[] = upcomingSchedules.slice(0, 3).map((schedule) => {
      const event = events.find((item) => item.id === schedule.event_id);
      const department = departments.find((item) => item.id === schedule.department_id);
      return {
        title: event?.name || "Escala",
        meta: department?.name || "Ministério",
        time: `${formatShortDate(schedule.date)} · ${schedule.time}`,
        location: event?.location || "Igreja",
        badge: scheduleMembers.some((sm) => sm.schedule_id === schedule.id && sm.status === "pending") ? "Confirmar" : "Em breve",
        href: `/escalas?id=${schedule.id}`,
        icon: "calendar",
      };
    });
    const upcomingFromCells: UpcomingEventItem[] = pastoralCells.slice(0, Math.max(0, 3 - upcomingFromSchedules.length)).map((cell) => ({
      title: cell.name,
      meta: cell.audience,
      time: `${cell.weekDay} · ${cell.time}`,
      location: cell.address,
      badge: "Célula",
      href: `/celulas/${cell.id}`,
      icon: "home" as const,
    }));

    const upcoming: UpcomingEventItem[] = [
      ...upcomingFromSchedules,
      ...upcomingFromCells,
      {
        title: "Culto de Celebração",
        meta: "Celebração principal",
        time: "Domingo · 18:00",
        location: "Auditório principal",
        badge: "Culto",
        href: "/eventos",
        icon: "spark" as const,
      },
      {
        title: "Ensaio Geral",
        meta: "Louvor",
        time: "Sábado · 16:00",
        location: "Sala de ensaios",
        badge: "Ensaio",
        href: "/escalas",
        icon: "calendar" as const,
      },
    ];

    const carePeople: CarePerson[] = careCases.map((care) => {
      const person = getPerson(care.personId);
      return {
        id: care.id,
        name: person?.fullName || care.title,
        reason: care.reason,
        lastPresence: person?.lastContactAt ? `último contato em ${formatShortDate(person.lastContactAt)}` : "sem contato recente",
        badge: care.priority === "high" ? "Atenção pastoral" : "Participação baixa",
        avatarColor: person?.avatarColor || "#F4532A",
        photoUrl: person?.photoUrl || null,
      };
    });

    const insights: Insight[] = [
      { value: "+18%", label: "Crescimento", description: "mais conexões registradas nas últimas semanas." },
      { value: "7", label: "Novos visitantes", description: "pessoas novas chegaram e precisam de acolhimento." },
      { value: "4", label: "Reconectadas", description: "pessoas retomaram participação comunitária." },
      { value: "92%", label: "Presença média", description: "boa constância nas escalas e células acompanhadas." },
    ];

    const cellLeader = pastoralCells[0] ? getPerson(pastoralCells[0].leaderId) : null;
    const cell: CellSummary | undefined = pastoralCells[0]
      ? {
          name: pastoralCells[0].name,
          nextMeeting: `${pastoralCells[0].weekDay} às ${pastoralCells[0].time} · ${pastoralCells[0].address}`,
          notice: "Separar pedidos de oração e confirmar presença antes do encontro.",
          leader: cellLeader?.fullName || "Liderança da célula",
          prayerCount: activePrayerRequests.length,
          href: `/celulas/${pastoralCells[0].id}`,
        }
      : undefined;

    const prayers: PrayerRequestCardData[] = activePrayerRequests.slice(0, 2).map((request) => {
      const person = getPerson(request.personId);
      return {
        title: request.title,
        description: request.description,
        person: person?.fullName || "Pedido compartilhado",
        href: "/pedidos-oracao",
      };
    });

    const quickActions: QuickActionItem[] = isAdminLike
      ? [
          { label: "Nova escala", href: "/escalas/nova", icon: "plus" },
          { label: "Nova célula", href: "/celulas", icon: "home" },
          { label: "Nova pessoa", href: "/pessoas", icon: "users" },
        ]
      : profileMode === "connect"
      ? [
          { label: "Quero servir", href: "/ministerios", icon: "heart" },
          { label: "Encontrar célula", href: "/celulas", icon: "home" },
          { label: "Completar cadastro", href: "/perfil", icon: "check" },
        ]
      : [
          { label: "Minha escala", href: "/minhas-escalas", icon: "calendar" },
          { label: "Minha célula", href: "/celulas", icon: "home" },
          { label: "Pedir oração", href: "/pedidos-oracao", icon: "heart" },
        ];

    return {
      profileMode,
      greeting,
      heroTitle,
      heroSummary,
      heroFocus,
      user,
      churchName: church.name,
      unreadNotifications,
      priorities,
      priorityItems,
      timeline,
      upcoming,
      carePeople,
      insights,
      cell,
      prayers,
      quickActions,
    };
  }, [church.name, departments, events, members, notifications, scheduleMembers, schedules, unreadNotifications, user]);

  if (loading) return <DashboardV3Skeleton />;

  return <DashboardV3Home data={data} />;
}
