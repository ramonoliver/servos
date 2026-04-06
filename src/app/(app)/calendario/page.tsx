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

  function getSchedulesForDay(day: number) {
    const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return schedules.filter((s) => s.date === ds);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">Calendário</h1>
        <p className="page-subtitle">Veja escalas do mês e abra os detalhes por dia</p>
      </div>

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
            const isToday =
              day === now.getDate() &&
              month === now.getMonth() &&
              year === now.getFullYear();
            const isSelected = day === selectedDay;

            return (
              <button
                key={i}
                onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                className={`relative aspect-square min-h-[46px] rounded-lg flex flex-col items-center justify-center text-sm transition-all ${
                  isSelected
                    ? "bg-brand text-white"
                    : isToday
                    ? "bg-brand-light text-brand font-bold"
                    : "hover:bg-surface-alt"
                }`}
              >
                {day}
                {dayScheds.length > 0 && (
                  <div className="absolute bottom-1 flex gap-0.5">
                    {dayScheds.slice(0, 3).map((_, j) => (
                      <div
                        key={j}
                        className={`w-1 h-1 rounded-full ${isSelected ? "bg-white" : "bg-brand"}`}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDay && (
        <div className="mt-5">
          <h3 className="font-display text-lg mb-3 break-words">Escalas em {selectedDay}/{month + 1}</h3>

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

                return (
                  <Link
                    key={s.id}
                    href={`/escalas/${s.id}`}
                    className="flex items-start sm:items-center gap-3 px-5 py-3 border-t border-border-soft first:border-t-0 hover:bg-brand-glow transition-colors"
                  >
                    <span className="text-lg">{ev ? getIconEmoji(ev.icon) : ""}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium break-words">{ev?.name}</div>
                      <div className="text-[11px] text-ink-faint break-words leading-relaxed">
                        {s.time} - {dept?.name} - {sm.length} escalados
                      </div>
                    </div>
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
