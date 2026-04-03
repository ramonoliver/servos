"use client";
import { useState } from "react";
import { useApp } from "@/hooks/use-app";
import { getDB } from "@/lib/db/local-db";
import { getDayName, getIconEmoji, formatShortDate } from "@/lib/utils/helpers";
import Link from "next/link";
import type { Schedule, ScheduleMember, Event, Department } from "@/types";

export default function EscalasPage() {
  const { user, canDo, toast, departments } = useApp();
  const db = getDB();
  const [filter, setFilter] = useState<"all" | "active" | "draft">("all");

  const schedules = db.getAll<Schedule>("schedules").filter(s => s.church_id === user.church_id);
  const events = db.getWhere<Event>("events", { church_id: user.church_id });
  const allSM = db.getAll<ScheduleMember>("schedule_members");

  const filtered = schedules.filter(s => filter === "all" || s.status === filter).sort((a, b) => a.date.localeCompare(b.date));

  function deleteSchedule(id: string) {
    if (!confirm("Excluir esta escala?")) return;
    db.deleteWhere("schedule_members", { schedule_id: id });
    db.deleteWhere("schedule_slots", { schedule_id: id });
    db.delete("schedules", id);
    toast("Escala excluida.");
    window.dispatchEvent(new Event("servos:refresh"));
    location.href = "/escalas";
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="page-title">Escalas</h1><p className="page-subtitle">{schedules.length} escalas</p></div>
        {canDo("schedule.create") && <Link href="/escalas/nova" className="btn btn-primary">+ Nova Escala</Link>}
      </div>
      <div className="flex gap-1 mb-5 bg-surface-alt rounded-[10px] p-0.5 w-fit">
        {(["all", "active", "draft"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all ${filter === f ? "bg-surface text-ink font-semibold shadow-sm" : "text-ink-muted"}`}>
            {f === "all" ? "Todas" : f === "active" ? "Ativas" : "Rascunhos"}
          </button>
        ))}
      </div>
      <div className="card">
        {filtered.length === 0 ? (
          <div className="px-5 py-16 text-center"><div className="text-4xl mb-3 opacity-40">&#128197;</div><p className="font-display text-lg mb-1">Nenhuma escala</p><p className="text-sm text-ink-muted mb-4">Crie a primeira escala.</p>{canDo("schedule.create") && <Link href="/escalas/nova" className="btn btn-primary">+ Criar</Link>}</div>
        ) : filtered.map(s => {
          const ev = events.find(e => e.id === s.event_id);
          const dept = departments.find(d => d.id === s.department_id);
          const sm = allSM.filter(m => m.schedule_id === s.id);
          const confirmed = sm.filter(m => m.status === "confirmed").length;
          const allOk = confirmed === sm.length && sm.length > 0;
          return (
            <div key={s.id} className="flex items-center gap-3.5 px-5 py-3.5 border-t border-border-soft first:border-t-0 hover:bg-brand-glow transition-colors group">
              <Link href={`/escalas/${s.id}`} className="flex items-center gap-3.5 flex-1 min-w-0">
                <div className={`w-12 h-[50px] rounded-[10px] flex flex-col items-center justify-center flex-shrink-0 ${ev?.type === "special" ? "bg-brand-light" : "bg-surface-alt"}`}>
                  <span className="text-[9px] font-bold uppercase text-brand tracking-wide">{getDayName(s.date)}</span>
                  <span className="font-display text-[20px] leading-none">{s.date.split("-")[2]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate flex items-center gap-2">
                    {ev?.name || "Escala"}
                    {ev?.type === "special" && <span className="badge badge-brand">Especial</span>}
                    {s.status === "draft" && <span className="badge badge-info">Rascunho</span>}
                    {s.status === "cancelled" && <span className="badge badge-red">Cancelada</span>}
                  </div>
                  <div className="text-[11px] text-ink-faint">{formatShortDate(s.date)} &middot; {s.time} &middot; {dept?.name} &middot; {sm.length} escalados</div>
                </div>
                {sm.length > 0 ? <span className={`badge ${allOk ? "badge-green" : "badge-amber"}`}>{confirmed}/{sm.length}{allOk ? " \u2713" : ""}</span> : <span className="badge badge-info">Vazia</span>}
              </Link>
              {canDo("schedule.delete") && (
                <button onClick={() => deleteSchedule(s.id)} className="btn btn-ghost btn-sm text-danger opacity-0 group-hover:opacity-100 transition-opacity" title="Excluir">&#10005;</button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
