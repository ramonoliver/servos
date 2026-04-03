"use client";
import { useState } from "react";
import { useApp } from "@/hooks/use-app";
import { getDB } from "@/lib/db/local-db";
import { getIconEmoji, getDayName } from "@/lib/utils/helpers";
import Link from "next/link";
import type { Schedule, Event, ScheduleMember } from "@/types";

export default function CalendarioPage() {
  const { user, departments } = useApp();
  const db = getDB();
  const [monthOffset, setMonthOffset] = useState(0);
  const now = new Date();
  const viewDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthName = viewDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const schedules = db.getAll<Schedule>("schedules").filter(s => s.church_id === user.church_id && s.status !== "cancelled");
  const events = db.getWhere<Event>("events", { church_id: user.church_id });
  const allSM = db.getAll<ScheduleMember>("schedule_members");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const cells = [];
  for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const selectedDateStr = selectedDay ? `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}` : null;
  const daySchedules = selectedDateStr ? schedules.filter(s => s.date === selectedDateStr) : [];

  function getSchedulesForDay(day: number) {
    const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return schedules.filter(s => s.date === ds);
  }

  return (
    <div>
      <div className="mb-6"><h1 className="page-title">Calendario</h1></div>
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setMonthOffset(m => m - 1)} className="btn btn-ghost btn-sm">&larr;</button>
          <span className="font-display text-lg capitalize">{monthName}</span>
          <button onClick={() => setMonthOffset(m => m + 1)} className="btn btn-ghost btn-sm">&rarr;</button>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Seg","Ter","Qua","Qui","Sex","Sab","Dom"].map(d => <div key={d} className="text-[10px] font-bold text-ink-faint text-center py-1 uppercase">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (!day) return <div key={i} />;
            const dayScheds = getSchedulesForDay(day);
            const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
            const isSelected = day === selectedDay;
            return (
              <button key={i} onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                className={`relative aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-all ${isSelected ? "bg-brand text-white" : isToday ? "bg-brand-light text-brand font-bold" : "hover:bg-surface-alt"}`}>
                {day}
                {dayScheds.length > 0 && <div className={`absolute bottom-1 flex gap-0.5`}>{dayScheds.slice(0, 3).map((_, j) => <div key={j} className={`w-1 h-1 rounded-full ${isSelected ? "bg-white" : "bg-brand"}`} />)}</div>}
              </button>
            );
          })}
        </div>
      </div>
      {selectedDay && (
        <div className="mt-5">
          <h3 className="font-display text-lg mb-3">Escalas em {selectedDay}/{month + 1}</h3>
          {daySchedules.length === 0 ? <div className="card px-5 py-8 text-center text-sm text-ink-faint">Nenhuma escala neste dia.</div> : (
            <div className="card">{daySchedules.map(s => {
              const ev = events.find(e => e.id === s.event_id);
              const dept = departments.find(d => d.id === s.department_id);
              const sm = allSM.filter(m => m.schedule_id === s.id);
              return (
                <Link key={s.id} href={`/escalas/${s.id}`} className="flex items-center gap-3 px-5 py-3 border-t border-border-soft first:border-t-0 hover:bg-brand-glow transition-colors">
                  <span className="text-lg">{ev ? getIconEmoji(ev.icon) : ""}</span>
                  <div className="flex-1"><div className="text-sm font-medium">{ev?.name}</div><div className="text-[11px] text-ink-faint">{s.time} - {dept?.name} - {sm.length} escalados</div></div>
                </Link>
              );
            })}</div>
          )}
        </div>
      )}
    </div>
  );
}
