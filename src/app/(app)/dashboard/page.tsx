"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useApp } from "@/hooks/use-app";
import { supabase } from "@/lib/supabase/client";
import { getVerseOfDay } from "@/lib/ai/engine";
import { getGreeting } from "@/lib/utils/helpers";
import {
  dashboardQuickActions,
  getAgendaItems,
  getAttentionItems,
  getCommunityItems,
  getDashboardStats,
  getGreetingEmoji,
  getHeroFocus,
  getHumanSummary,
} from "@/lib/dashboard/home";
import {
  AgendaRow,
  AttentionRow,
  DashboardHeader,
  DashboardSkeleton,
  DashboardStatsGrid,
  EmptyLine,
  HeroCard,
  PanelLink,
  QuietPanel,
  VerseCard,
} from "@/components/dashboard/home-ui";
import {
  careCases,
  pastoralAlerts,
  pastoralCells,
  prayerRequests,
  timelineEvents,
} from "@/lib/pastoral/mock-data";
import type { Event, Notification, Schedule, ScheduleMember, User } from "@/types";

export default function DashboardPage() {
  const { user, departments, unreadNotifications } = useApp();
  const verse = getVerseOfDay();
  const isMember = user.role === "member";
  const visibleDepartmentIds = useMemo(() => departments.map((d) => d.id), [departments]);
  const quickRef = useRef<HTMLDivElement | null>(null);

  const [members, setMembers] = useState<User[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [allSM, setAllSM] = useState<ScheduleMember[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickOpen, setQuickOpen] = useState(false);

  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);
  const todayWeekday = today.toLocaleDateString("pt-BR", { weekday: "long" }).replace("-feira", "");
  const greeting = getGreeting();
  const greetingEmoji = getGreetingEmoji(greeting);
  const dateLabelRaw = today.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  const dateLabel = dateLabelRaw.charAt(0).toUpperCase() + dateLabelRaw.slice(1);

  async function loadData() {
    setLoading(true);
    const [
      { data: membersData, error: membersError },
      { data: schedulesData, error: schedulesError },
      { data: eventsData, error: eventsError },
      { data: notificationsData, error: notificationsError },
      { data: departmentMembersData, error: departmentMembersError },
    ] = await Promise.all([
      supabase.from("users").select("*").eq("church_id", user.church_id).eq("active", true),
      supabase.from("schedules").select("*").eq("church_id", user.church_id).neq("status", "cancelled"),
      supabase.from("events").select("*").eq("church_id", user.church_id),
      supabase.from("notifications").select("*").eq("user_id", user.id).eq("read", false).limit(5),
      departments.length
        ? supabase.from("department_members").select("*").in("department_id", visibleDepartmentIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (membersError || schedulesError || eventsError || notificationsError || departmentMembersError) {
      console.error({ membersError, schedulesError, eventsError, notificationsError, departmentMembersError });
      setLoading(false);
      return;
    }

    const scheduleIds = ((schedulesData || []) as Schedule[]).map((s) => s.id);
    const { data: smData, error: smError } = scheduleIds.length
      ? await supabase.from("schedule_members").select("*").in("schedule_id", scheduleIds)
      : { data: [], error: null };

    if (smError) {
      console.error({ smError });
      setLoading(false);
      return;
    }

    const scopedSchedules =
      user.role === "admin"
        ? ((schedulesData || []) as Schedule[])
        : ((schedulesData || []) as Schedule[]).filter((s) => visibleDepartmentIds.includes(s.department_id));
    const scopedScheduleIds = new Set(scopedSchedules.map((s) => s.id));
    const scopedDepartmentIds = new Set(visibleDepartmentIds);
    const scopedMembers =
      user.role === "admin"
        ? ((membersData || []) as User[])
        : ((membersData || []) as User[]).filter((m) =>
            ((departmentMembersData || []) as Array<{ user_id: string; department_id: string }>).some(
              (dm) => dm.user_id === m.id && scopedDepartmentIds.has(dm.department_id)
            )
          );

    setMembers(scopedMembers);
    setSchedules(scopedSchedules);
    setAllSM(((smData || []) as ScheduleMember[]).filter((sm) => scopedScheduleIds.has(sm.schedule_id)));
    setEvents((eventsData || []) as Event[]);
    setNotifications((notificationsData || []) as Notification[]);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [user.church_id, user.id]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!quickRef.current?.contains(event.target as Node)) setQuickOpen(false);
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const upcoming = useMemo(() => {
    return schedules
      .filter((s) => s.status === "active" && s.published && s.date >= todayIso)
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
      .slice(0, 6);
  }, [schedules, todayIso]);

  const pendingTotal = useMemo(() => {
    return allSM.filter(
      (sm) => schedules.some((s) => s.id === sm.schedule_id && s.status === "active") && sm.status === "pending"
    ).length;
  }, [allSM, schedules]);

  const mySchedules = useMemo(() => {
    return allSM
      .filter((sm) => sm.user_id === user.id && schedules.some((s) => s.id === sm.schedule_id && s.status === "active"))
      .sort((a, b) => {
        const scheduleA = schedules.find((s) => s.id === a.schedule_id);
        const scheduleB = schedules.find((s) => s.id === b.schedule_id);
        return `${scheduleA?.date || ""} ${scheduleA?.time || ""}`.localeCompare(`${scheduleB?.date || ""} ${scheduleB?.time || ""}`);
      });
  }, [allSM, schedules, user.id]);

  const myPending = useMemo(() => mySchedules.filter((sm) => sm.status === "pending"), [mySchedules]);

  const upcomingSchedule = useMemo((): Schedule | null => {
    if (isMember) {
      const firstSM = mySchedules[0];
      if (!firstSM) return null;
      return schedules.find((s) => s.id === firstSM.schedule_id) ?? null;
    }
    return upcoming[0] ?? null;
  }, [isMember, mySchedules, upcoming, schedules]);

  const nextSchedSm = upcomingSchedule ? allSM.filter((sm) => sm.schedule_id === upcomingSchedule.id) : [];
  const nextSchedConfirmed = nextSchedSm.filter((sm) => sm.status === "confirmed").length;
  const nextSchedEvent = upcomingSchedule ? events.find((e) => e.id === upcomingSchedule.event_id) : null;
  const nextSchedDept = upcomingSchedule ? departments.find((d) => d.id === upcomingSchedule.department_id) : null;
  const involvedUsers = nextSchedSm.map((sm) => members.find((member) => member.id === sm.user_id)).filter(Boolean) as User[];

  const todaysCells = pastoralCells.filter((cell) => cell.weekDay.toLowerCase().startsWith(todayWeekday.slice(0, 3)));
  const priorityCare = careCases.find((care) => care.priority === "high" && care.status !== "finished") || careCases[0];
  const hero = getHeroFocus({
    upcomingSchedule,
    nextSchedEvent,
    nextSchedDept,
    nextSchedConfirmed,
    nextSchedSm,
    todaysCells,
    priorityCare,
    involvedUsers,
  });

  const agendaItems = getAgendaItems({
    upcoming,
    todayIso,
    events,
    departments,
    todaysCells,
  });

  const attentionItems = useMemo(
    () => getAttentionItems({ careCases, prayerRequests }),
    []
  );

  const communityItems = getCommunityItems({
    involvedUsers,
    timelineEvents,
    notifications,
  });

  const stats = getDashboardStats({
    isMember,
    myPending: myPending.length,
    pendingTotal,
    openCareCount: careCases.filter((care) => care.status !== "finished").length,
    prayerCount: prayerRequests.length,
    newPeopleCount: Math.max(7, members.slice(0, 7).length),
  });

  const summary = getHumanSummary({
    pendingTotal,
    myPending: myPending.length,
    todaysCells,
    alerts: pastoralAlerts.length,
  });

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="w-full space-y-6 pb-8">
      <DashboardHeader
        greeting={greeting}
        greetingEmoji={greetingEmoji}
        user={user}
        summary={summary}
        unreadNotifications={unreadNotifications}
        dateLabel={dateLabel}
      />

      <HeroCard hero={hero} confirmed={nextSchedConfirmed} total={nextSchedSm.length || 1} />

      <DashboardStatsGrid stats={stats} />

      <section className="grid gap-4 lg:grid-cols-2">
        <QuietPanel title="Agenda de hoje" action={<PanelLink href="/calendario">Ver calendário</PanelLink>}>
          <div className="space-y-1">
            {agendaItems.length ? agendaItems.map((item) => <AgendaRow key={item.id} item={item} />) : (
              <EmptyLine title="Dia sem compromissos" description="Nenhum encontro precisa da sua atenção agora." />
            )}
          </div>
        </QuietPanel>

        <QuietPanel title="Precisando de atenção" action={<PanelLink href="/pessoas">Ver todas</PanelLink>}>
          <div className="space-y-1">
            {attentionItems.length ? attentionItems.map((item) => <AttentionRow key={item.id} item={item} />) : (
              <EmptyLine title="Tudo certo por aqui" description="Ninguém precisa de acompanhamento imediato agora." />
            )}
          </div>
        </QuietPanel>
      </section>

      <VerseCard text={verse.text} reference={verse.ref} />
    </div>
  );
}
