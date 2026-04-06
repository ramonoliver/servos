"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/hooks/use-app";
import { supabase } from "@/lib/supabase/client";
import { getDayName, formatShortDate } from "@/lib/utils/helpers";
import Link from "next/link";
import type { Schedule, ScheduleMember, Event } from "@/types";

export default function EscalasPage() {
  const { user, canDo, toast, departments } = useApp();
  const [filter, setFilter] = useState<"all" | "active" | "draft">("all");
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [allSM, setAllSM] = useState<ScheduleMember[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);

    const [
      { data: schedulesData, error: schedulesError },
      { data: eventsData, error: eventsError },
      { data: smData, error: smError },
    ] = await Promise.all([
      supabase.from("schedules").select("*").eq("church_id", user.church_id),
      supabase.from("events").select("*").eq("church_id", user.church_id),
      supabase.from("schedule_members").select("*"),
    ]);

    if (schedulesError || eventsError || smError) {
      console.error({ schedulesError, eventsError, smError });
      toast("Erro ao carregar escalas.");
      setLoading(false);
      return;
    }

    setSchedules((schedulesData || []) as Schedule[]);
    setEvents((eventsData || []) as Event[]);
    setAllSM((smData || []) as ScheduleMember[]);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [user.church_id]);

  const filtered = useMemo(() => {
    return schedules
      .filter((s) => filter === "all" || s.status === filter)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [schedules, filter]);

  async function deleteSchedule(id: string) {
    if (!confirm("Excluir esta escala?")) return;

    try {
      const response = await fetch("/api/schedules/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scheduleId: id,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        console.error("Erro ao excluir escala:", data);
        toast(data?.error || "Erro ao excluir escala.");
        return;
      }

      toast("Escala excluida.");
      await loadData();
    } catch (error) {
      console.error("Erro ao excluir escala:", error);
      toast("Erro ao excluir escala.");
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="page-title">Escalas</h1>
          <p className="page-subtitle">{schedules.length} escalas</p>
        </div>

        {canDo("schedule.create") && (
          <Link href="/escalas/nova" className="btn btn-primary self-start sm:self-auto">
            + Nova Escala
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-1 mb-5 bg-surface-alt rounded-[10px] p-0.5 w-fit max-w-full">
        {(["all", "active", "draft"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
              filter === f
                ? "bg-surface text-ink font-semibold shadow-sm"
                : "text-ink-muted"
            }`}
          >
            {f === "all" ? "Todas" : f === "active" ? "Ativas" : "Rascunhos"}
          </button>
        ))}
      </div>

      <div className="card">
        {loading ? (
          <div className="px-5 py-16 text-center">
            <div className="text-4xl mb-3 opacity-40">&#128197;</div>
            <p className="font-display text-lg mb-1">Carregando escalas...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="text-4xl mb-3 opacity-40">&#128197;</div>
            <p className="font-display text-lg mb-1">Nenhuma escala</p>
            <p className="text-sm text-ink-muted mb-4">Crie a primeira escala.</p>
            {canDo("schedule.create") && (
              <Link href="/escalas/nova" className="btn btn-primary">
                + Criar
              </Link>
            )}
          </div>
        ) : (
          filtered.map((s) => {
            const ev = events.find((e) => e.id === s.event_id);
            const dept = departments.find((d) => d.id === s.department_id);
            const sm = allSM.filter((m) => m.schedule_id === s.id);
            const confirmed = sm.filter((m) => m.status === "confirmed").length;
            const allOk = confirmed === sm.length && sm.length > 0;

            return (
              <div
                key={s.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3.5 px-5 py-3.5 border-t border-border-soft first:border-t-0 hover:bg-brand-glow transition-colors group"
              >
                <Link href={`/escalas/${s.id}`} className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                  <div
                    className={`w-12 h-[50px] rounded-[10px] flex flex-col items-center justify-center flex-shrink-0 ${
                      ev?.type === "special" ? "bg-brand-light" : "bg-surface-alt"
                    }`}
                  >
                    <span className="text-[9px] font-bold uppercase text-brand tracking-wide">
                      {getDayName(s.date)}
                    </span>
                    <span className="font-display text-[20px] leading-none">
                      {s.date.split("-")[2]}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium flex flex-wrap items-center gap-2 leading-snug">
                      <span className="break-words">{ev?.name || "Escala"}</span>
                      {ev?.type === "special" && <span className="badge badge-brand">Especial</span>}
                      {s.status === "draft" && <span className="badge badge-info">Rascunho</span>}
                      {s.status === "cancelled" && <span className="badge badge-red">Cancelada</span>}
                    </div>

                    <div className="text-[11px] text-ink-faint break-words leading-relaxed">
                      {formatShortDate(s.date)} &middot; {s.time} &middot; {dept?.name} &middot; {sm.length} escalados
                    </div>
                  </div>

                  {sm.length > 0 ? (
                    <span className={`badge shrink-0 ${allOk ? "badge-green" : "badge-amber"}`}>
                      {confirmed}/{sm.length}
                      {allOk ? " \u2713" : ""}
                    </span>
                  ) : (
                    <span className="badge shrink-0 badge-info">Vazia</span>
                  )}
                </Link>

                {canDo("schedule.delete") && (
                  <button
                    onClick={() => deleteSchedule(s.id)}
                    className="btn btn-ghost btn-sm text-danger self-start sm:self-auto opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                    title="Excluir"
                  >
                    &#10005;
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
