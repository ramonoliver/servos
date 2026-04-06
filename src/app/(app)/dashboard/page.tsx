"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/hooks/use-app";
import { supabase } from "@/lib/supabase/client";
import { getVerseOfDay } from "@/lib/ai/engine";
import { getGreeting, getDayName, getInitials, formatShortDate } from "@/lib/utils/helpers";
import Link from "next/link";
import type { Schedule, ScheduleMember, Event, User, Notification } from "@/types";

export default function DashboardPage() {
  const { user, departments, canDo } = useApp();
  const verse = getVerseOfDay();

  const [members, setMembers] = useState<User[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [allSM, setAllSM] = useState<ScheduleMember[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const todayLabel = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  async function loadData() {
    setLoading(true);
    const [
      { data: membersData, error: membersError },
      { data: schedulesData, error: schedulesError },
      { data: eventsData, error: eventsError },
      { data: notificationsData, error: notificationsError },
    ] = await Promise.all([
      supabase.from("users").select("*").eq("church_id", user.church_id).eq("active", true),
      supabase.from("schedules").select("*").eq("church_id", user.church_id).neq("status", "cancelled"),
      supabase.from("events").select("*").eq("church_id", user.church_id),
      supabase.from("notifications").select("*").eq("user_id", user.id).eq("read", false),
    ]);

    if (membersError || schedulesError || eventsError || notificationsError) {
      console.error({
        membersError,
        schedulesError,
        eventsError,
        notificationsError,
      });
      setLoading(false);
      return;
    }

    const scheduleIds = ((schedulesData || []) as Schedule[]).map((schedule) => schedule.id);
    const { data: smData, error: smError } = scheduleIds.length
      ? await supabase.from("schedule_members").select("*").in("schedule_id", scheduleIds)
      : { data: [], error: null };

    if (smError) {
      console.error({ smError });
      setLoading(false);
      return;
    }

    setMembers((membersData || []) as User[]);
    setSchedules((schedulesData || []) as Schedule[]);
    setAllSM((smData || []) as ScheduleMember[]);
    setEvents((eventsData || []) as Event[]);
    setNotifications((notificationsData || []) as Notification[]);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [user.church_id, user.id]);

  const upcoming = useMemo(() => {
    return schedules
      .filter((s) => s.status === "active" && s.published)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5);
  }, [schedules]);

  const pendingTotal = useMemo(() => {
    return allSM.filter(
      (sm) =>
        schedules.some((s) => s.id === sm.schedule_id && s.status === "active") &&
        sm.status === "pending"
    ).length;
  }, [allSM, schedules]);

  const mySchedules = useMemo(() => {
    return allSM.filter(
      (sm) =>
        sm.user_id === user.id &&
        schedules.some((s) => s.id === sm.schedule_id && s.status === "active")
    );
  }, [allSM, schedules, user.id]);

  const myPending = useMemo(() => {
    return mySchedules.filter((sm) => sm.status === "pending");
  }, [mySchedules]);

  const isMember = user.role === "member";

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="page-title">{getGreeting()}, {user.name.split(" ")[0]}</h1>
          <p className="page-subtitle capitalize">{todayLabel}</p>
        </div>

        {!isMember && canDo("schedule.create") && (
          <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
            <Link href="/escalas/nova" className="btn btn-primary btn-sm">
              + Nova Escala
            </Link>
            {canDo("member.invite") && (
              <Link href="/membros/convidar" className="btn btn-secondary btn-sm">
                Convidar Membro
              </Link>
            )}
          </div>
        )}

        {isMember && (
          <Link href="/perfil" className="btn btn-secondary btn-sm self-start sm:self-auto">
            Editar perfil
          </Link>
        )}
      </div>

      <div className={`grid ${isMember ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"} gap-3 mb-6`}>
        {isMember ? (
          <>
            <Stat value={mySchedules.length} label="Minhas escalas" color="text-brand" />
            <Stat value={myPending.length} label="Pendentes" color="text-amber" />
            <Stat value={user.confirm_rate + "%"} label="Confirmação" color="text-success" />
          </>
        ) : (
          <>
            <Stat value={upcoming.length} label="Escalas ativas" color="text-brand" />
            <Stat value={members.length} label="Membros" color="text-success" />
            <Stat value={pendingTotal} label="Pendentes" color="text-amber" />
            <Stat value={departments.length} label="Ministérios" color="text-info" />
          </>
        )}
      </div>

      {isMember && myPending.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-3.5 bg-amber-light rounded-[14px] border border-amber/10 mb-6">
          <span className="text-lg">&#9888;&#65039;</span>
          <span className="text-[13px] text-ink-soft flex-1">
            Você tem <strong>{myPending.length} {myPending.length === 1 ? "escala" : "escalas"}</strong> aguardando sua confirmação.
          </span>
          <Link href="/minhas-escalas" className="text-xs font-semibold text-brand hover:underline self-start">
            Ver &rarr;
          </Link>
        </div>
      )}

      {!isMember && pendingTotal > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-3.5 bg-amber-light rounded-[14px] border border-amber/10 mb-6">
          <span className="text-lg">&#9888;&#65039;</span>
          <span className="text-[13px] text-ink-soft flex-1">
            <strong>{pendingTotal} {pendingTotal === 1 ? "membro" : "membros"}</strong> não confirmaram escalas.
          </span>
          <Link href="/escalas" className="text-xs font-semibold text-brand hover:underline self-start">
            Ver escalas &rarr;
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
        <div className="space-y-5">
          <div className="card">
            <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
              <span className="font-display text-[17px] break-words">
                {isMember ? "Minhas próximas escalas" : "Próximas escalas"}
              </span>
            </div>

            {loading ? (
              <div className="px-5 pb-6 text-sm text-ink-faint text-center py-8">Carregando...</div>
            ) : (isMember ? mySchedules : upcoming).length === 0 ? (
              <div className="px-5 pb-6 text-sm text-ink-faint text-center py-8">Nenhuma escala encontrada.</div>
            ) : (
              (isMember ? mySchedules : upcoming).map((item, i) => {
                const sched = isMember
                  ? schedules.find((s) => s.id === (item as ScheduleMember).schedule_id)
                  : (item as Schedule);

                if (!sched) return null;

                const ev = events.find((e) => e.id === sched.event_id);
                const dept = departments.find((d) => d.id === sched.department_id);
                const sm = allSM.filter((m) => m.schedule_id === sched.id);
                const confirmed = sm.filter((m) => m.status === "confirmed").length;
                const mySM = isMember ? (item as ScheduleMember) : null;

                return (
                  <Link
                    key={sched.id + "-" + i}
                    href={isMember ? "/minhas-escalas" : `/escalas/${sched.id}`}
                    className="flex items-start sm:items-center gap-3.5 px-5 py-3 border-t border-border-soft hover:bg-brand-glow transition-colors"
                  >
                    <div className="w-12 h-[50px] rounded-[10px] bg-surface-alt flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-[9px] font-bold uppercase text-brand tracking-wide">
                        {getDayName(sched.date)}
                      </span>
                      <span className="font-display text-[20px] leading-none">
                        {sched.date.split("-")[2]}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium break-words sm:truncate">{ev?.name || "Escala"}</div>
                      <div className="text-[11px] text-ink-faint break-words leading-relaxed">
                        {sched.time} &middot; {dept?.name}
                      </div>
                    </div>

                    {isMember && mySM ? (
                      <span
                        className={`badge shrink-0 ${
                          mySM.status === "confirmed"
                            ? "badge-green"
                            : mySM.status === "pending"
                            ? "badge-amber"
                            : "badge-red"
                        }`}
                      >
                        {mySM.status === "confirmed"
                          ? "Confirmado"
                          : mySM.status === "pending"
                          ? "Pendente"
                          : "Recusado"}
                      </span>
                    ) : (
                      <span className={`badge shrink-0 ${confirmed === sm.length && sm.length > 0 ? "badge-green" : "badge-amber"}`}>
                        {confirmed}/{sm.length}
                      </span>
                    )}
                  </Link>
                );
              })
            )}
          </div>

          {!isMember && pendingTotal > 0 && (
            <div className="card">
              <div className="px-5 pt-4 pb-3">
                <span className="font-display text-[17px] break-words">Aguardando confirmação</span>
              </div>

              {allSM
                .filter(
                  (sm) =>
                    sm.status === "pending" &&
                    schedules.some((s) => s.id === sm.schedule_id && s.status === "active")
                )
                .slice(0, 5)
                .map((sm) => {
                  const m = members.find((u) => u.id === sm.user_id);
                  const sched = schedules.find((s) => s.id === sm.schedule_id);
                  const ev = events.find((e) => e.id === sched?.event_id);

                  if (!m || !sched) return null;

                  return (
                    <div key={sm.id} className="flex items-start sm:items-center gap-3.5 px-5 py-3 border-t border-border-soft">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                        style={{ background: m.avatar_color }}
                      >
                        {getInitials(m.name)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium break-words sm:truncate">{m.name}</div>
                        <div className="text-[11px] text-ink-faint break-words leading-relaxed">
                          {ev?.name} &middot; {formatShortDate(sched.date)}
                        </div>
                      </div>

                      <span className="badge badge-amber">Pendente</span>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="bg-brand-glow border border-brand/10 rounded-[14px] p-5">
            <p className="font-display italic text-sm text-ink-soft leading-relaxed mb-1.5">
              &ldquo;{verse.text}&rdquo;
            </p>
            <p className="text-[11px] text-brand font-semibold">{verse.ref}</p>
          </div>

          {notifications.length > 0 && (
            <div className="card">
              <div className="px-5 pt-4 pb-3 flex items-center justify-between gap-3">
                <span className="font-display text-[17px]">Notificações</span>
                <span className="badge badge-red">{notifications.length}</span>
              </div>

              {notifications.slice(0, 3).map((n) => (
                <div key={n.id} className="px-5 py-3 border-t border-border-soft">
                  <div className="text-[13px] font-semibold mb-0.5 break-words">{n.title}</div>
                  <div className="text-[11px] text-ink-muted leading-relaxed break-words">{n.body}</div>
                </div>
              ))}

              <Link
                href="/notificacoes"
                className="block text-center text-xs text-brand font-semibold py-3 border-t border-border-soft hover:bg-brand-glow transition-colors"
              >
                Ver todas &rarr;
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label, color }: { value: number | string; label: string; color: string }) {
  return (
    <div className="bg-surface border border-border-soft rounded-[14px] px-5 py-4 min-w-0">
      <div className={`font-display text-[28px] tracking-tight leading-none ${color}`}>{value}</div>
      <div className="text-xs text-ink-muted font-medium mt-1 break-words">{label}</div>
    </div>
  );
}
