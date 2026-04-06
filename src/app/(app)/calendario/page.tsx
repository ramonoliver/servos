"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/hooks/use-app";
import { supabase } from "@/lib/supabase/client";
import { getIconEmoji } from "@/lib/utils/helpers";
import Link from "next/link";
import type { Schedule, Event, ScheduleMember } from "@/types";

export default function CalendarioPage() {
  const { user, departments } = useApp();

  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [allSM, setAllSM] = useState<ScheduleMember[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const viewDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthName = viewDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  async function loadData() {
    setLoading(true);

    const visibleDepartmentIds = departments.map((department) => department.id);

    const [
      { data: schedulesData, error: schedulesError },
      { data: eventsData, error: eventsError },
    ] = await Promise.all([
      supabase
        .from("schedules")
        .select("*")
        .eq("church_id", user.church_id)
        .neq("status", "cancelled"),
      supabase.from("events").select("*").eq("church_id", user.church_id),
    ]);

    if (schedulesError || eventsError) {
      console.error({ schedulesError, eventsError });
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

    const scopedSchedules =
      user.role === "admin"
        ? ((schedulesData || []) as Schedule[])
        : ((schedulesData || []) as Schedule[]).filter((schedule) =>
            visibleDepartmentIds.includes(schedule.department_id)
          );
    const scopedScheduleIds = new Set(scopedSchedules.map((schedule) => schedule.id));

    setSchedules(scopedSchedules);
    setEvents((eventsData || []) as Event[]);
    setAllSM(((smData || []) as ScheduleMember[]).filter((scheduleMember) => scopedScheduleIds.has(scheduleMember.schedule_id)));
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [user.church_id, departments.length]);

  const cells = useMemo(() => {
    const result: Array<number | null> = [];
    for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) result.push(null);
    for (let d = 1; d <= daysInMonth; d++) result.push(d);
    return result;
  }, [firstDay, daysInMonth]);

  const selectedDateStr = selectedDay
    ? `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`
    : null;

  const daySchedules = useMemo(() => {
    if (!selectedDateStr) return [];
    return schedules.filter((s) => s.date === selectedDateStr);
  }, [selectedDateStr, schedules]);

  const myScheduleIds = useMemo(
    () => new Set(allSM.filter((item) => item.user_id === user.id).map((item) => item.schedule_id)),
    [allSM, user.id]
  );

  const monthStats = useMemo(() => {
    let recurringDays = 0;
    let specialDays = 0;
    let myDays = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dailySchedules = getSchedulesForDay(day);
      if (dailySchedules.length === 0) continue;

      const hasRecurring = dailySchedules.some((schedule) => {
        const event = events.find((item) => item.id === schedule.event_id);
        return event?.type === "recurring";
      });

      const hasSpecial = dailySchedules.some((schedule) => {
        const event = events.find((item) => item.id === schedule.event_id);
        return event?.type === "special";
      });

      const hasMine = dailySchedules.some((schedule) => myScheduleIds.has(schedule.id));

      if (hasRecurring) recurringDays += 1;
      if (hasSpecial) specialDays += 1;
      if (hasMine) myDays += 1;
    }

    return { recurringDays, specialDays, myDays };
  }, [daysInMonth, schedules, events, myScheduleIds, year, month]);

  function getSchedulesForDay(day: number) {
    const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return schedules.filter((s) => s.date === ds);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">Calendário</h1>
        <p className="page-subtitle">Acompanhe dias com eventos recorrentes, especiais e as escalas em que você está incluído.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_260px] gap-5 items-start">
        <div className="card p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2 sm:gap-3 mb-4">
          <button onClick={() => setMonthOffset((m) => m - 1)} className="btn btn-ghost btn-sm">
            &larr;
          </button>
          <span className="font-display text-base sm:text-lg capitalize text-center break-words">{monthName}</span>
          <button onClick={() => setMonthOffset((m) => m + 1)} className="btn btn-ghost btn-sm">
            &rarr;
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"].map((d) => (
            <div key={d} className="text-[10px] font-bold text-ink-faint text-center py-1 uppercase">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (!day) return <div key={i} />;

            const dayScheds = getSchedulesForDay(day);
            const eventTypes = dayScheds.map((schedule) =>
              events.find((event) => event.id === schedule.event_id)?.type
            );
            const hasRecurring = eventTypes.includes("recurring");
            const hasSpecial = eventTypes.includes("special");
            const hasMine = dayScheds.some((schedule) => myScheduleIds.has(schedule.id));
            const isToday =
              day === now.getDate() &&
              month === now.getMonth() &&
              year === now.getFullYear();
            const isSelected = day === selectedDay;

            return (
              <button
                key={i}
                onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                className={`relative aspect-square min-h-[62px] rounded-2xl border text-sm transition-all overflow-hidden ${
                  isSelected
                    ? "bg-brand text-white border-brand shadow-lg shadow-brand/20 scale-[1.02]"
                    : isToday
                    ? "bg-brand-light text-brand border-brand/20 font-bold"
                    : hasMine
                    ? "bg-[#fff4dc] border-[#f1c46a] text-[#7b4c00] hover:bg-[#ffefcc]"
                    : hasSpecial
                    ? "bg-[#ffe8e3] border-[#f2b6a6] text-[#8f3b22] hover:bg-[#ffdcd2]"
                    : hasRecurring
                    ? "bg-[#edf6ef] border-[#b8d8bf] text-[#285e34] hover:bg-[#e4f1e7]"
                    : "bg-white border-border-soft hover:bg-surface-alt"
                }`}
              >
                <div className="absolute inset-x-0 top-0 h-1.5">
                  <div
                    className={`h-full ${
                      isSelected
                        ? "bg-white/35"
                        : hasMine
                        ? "bg-[#f0aa00]"
                        : hasSpecial
                        ? "bg-[#e46b42]"
                        : hasRecurring
                        ? "bg-[#4d9c62]"
                        : "bg-transparent"
                    }`}
                  />
                </div>

                <div className="h-full w-full flex flex-col items-center justify-between px-1.5 py-2">
                  <div className="text-[15px] font-semibold leading-none">{day}</div>

                  <div className="flex flex-wrap items-center justify-center gap-1 min-h-[20px]">
                    {hasMine && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isSelected ? "bg-white/20 text-white" : "bg-white/80 text-[#7b4c00]"}`}>
                        Minha
                      </span>
                    )}
                    {hasSpecial && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isSelected ? "bg-white/20 text-white" : "bg-white/80 text-[#8f3b22]"}`}>
                        Especial
                      </span>
                    )}
                    {!hasSpecial && hasRecurring && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isSelected ? "bg-white/20 text-white" : "bg-white/80 text-[#285e34]"}`}>
                        Recorrente
                      </span>
                    )}
                  </div>

                  {dayScheds.length > 0 ? (
                    <div className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : hasMine ? "bg-[#f0aa00]" : hasSpecial ? "bg-[#e46b42]" : "bg-brand"}`} />
                      <span className={`text-[10px] ${isSelected ? "text-white/90" : "text-ink-faint"}`}>
                        {dayScheds.length}
                      </span>
                    </div>
                  ) : (
                    <div className="h-[12px]" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
        </div>

        <div className="card p-5 space-y-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-faint mb-2">
              Leitura Rápida
            </div>
            <h2 className="font-display text-xl leading-tight">Panorama do mês</h2>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="rounded-2xl border border-[#f1c46a] bg-[#fff4dc] px-4 py-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#7b4c00]">Minhas escalas</div>
              <div className="text-2xl font-display text-[#7b4c00] mt-1">{monthStats.myDays}</div>
              <div className="text-xs text-[#8f6b1d] mt-1">Dias do mês em que você está escalado.</div>
            </div>

            <div className="rounded-2xl border border-[#b8d8bf] bg-[#edf6ef] px-4 py-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#285e34]">Recorrentes</div>
              <div className="text-2xl font-display text-[#285e34] mt-1">{monthStats.recurringDays}</div>
              <div className="text-xs text-[#467451] mt-1">Dias com cultos e eventos recorrentes.</div>
            </div>

            <div className="rounded-2xl border border-[#f2b6a6] bg-[#ffe8e3] px-4 py-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#8f3b22]">Especiais</div>
              <div className="text-2xl font-display text-[#8f3b22] mt-1">{monthStats.specialDays}</div>
              <div className="text-xs text-[#a35840] mt-1">Dias com eventos especiais ou fora da rotina.</div>
            </div>
          </div>

          <div className="border-t border-border-soft pt-4 space-y-2 text-xs text-ink-muted">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#f0aa00]" />
              <span>Dia em que você está escalado</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#4d9c62]" />
              <span>Evento recorrente</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#e46b42]" />
              <span>Evento especial</span>
            </div>
          </div>
        </div>
      </div>

      {selectedDay && (
        <div className="mt-5">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-3">
            <div>
              <h3 className="font-display text-lg break-words">Agenda de {selectedDay}/{month + 1}</h3>
              <p className="text-sm text-ink-muted">
                {daySchedules.length} {daySchedules.length === 1 ? "escala encontrada" : "escalas encontradas"} neste dia.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {daySchedules.some((schedule) => myScheduleIds.has(schedule.id)) && (
                <span className="badge" style={{ background: "#fff4dc", color: "#7b4c00" }}>
                  Você está escalado
                </span>
              )}
              {daySchedules.some((schedule) => events.find((event) => event.id === schedule.event_id)?.type === "special") && (
                <span className="badge" style={{ background: "#ffe8e3", color: "#8f3b22" }}>
                  Especial
                </span>
              )}
            </div>
          </div>

          {loading ? (
            <div className="card px-5 py-8 text-center text-sm text-ink-faint">Carregando...</div>
          ) : daySchedules.length === 0 ? (
            <div className="card px-5 py-8 text-center text-sm text-ink-faint">
              Nenhuma escala neste dia.
            </div>
          ) : (
            <div className="card">
              {daySchedules.map((s) => {
                const ev = events.find((e) => e.id === s.event_id);
                const dept = departments.find((d) => d.id === s.department_id);
                const sm = allSM.filter((m) => m.schedule_id === s.id);
                const isMine = myScheduleIds.has(s.id);
                const eventType = ev?.type === "special" ? "Especial" : "Recorrente";

                return (
                  <Link
                    key={s.id}
                    href={`/escalas/${s.id}`}
                    className={`flex items-start sm:items-center gap-3 px-5 py-4 border-t border-border-soft first:border-t-0 transition-colors ${
                      isMine ? "hover:bg-[#fff8ea] bg-[#fffdfa]" : "hover:bg-brand-glow"
                    }`}
                  >
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg shrink-0 ${
                        ev?.type === "special" ? "bg-[#ffe8e3]" : "bg-[#edf6ef]"
                      }`}
                    >
                      {ev ? getIconEmoji(ev.icon) : ""}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <div className="text-sm font-medium break-words">{ev?.name}</div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          ev?.type === "special"
                            ? "bg-[#ffe8e3] text-[#8f3b22]"
                            : "bg-[#edf6ef] text-[#285e34]"
                        }`}>
                          {eventType}
                        </span>
                        {isMine && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#fff4dc] text-[#7b4c00]">
                            Minha escala
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-ink-faint break-words leading-relaxed">
                        {s.time} · {dept?.name} · {sm.length} escalados
                      </div>
                    </div>
                    <div className="text-brand text-sm font-semibold shrink-0">&rarr;</div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
