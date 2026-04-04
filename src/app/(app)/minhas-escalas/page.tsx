"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/hooks/use-app";
import { supabase } from "@/lib/supabase/client";
import { formatDate, getDayName, getInitials } from "@/lib/utils/helpers";
import type { Schedule, ScheduleMember, Event, User } from "@/types";

type MyScheduleItem = {
  sm: ScheduleMember;
  schedule: Schedule;
  event?: Event;
  department?: { id: string; name: string };
  team: ScheduleMember[];
};

export default function MinhasEscalasPage() {
  const { user, toast, departments } = useApp();

  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [responding, setResponding] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [allSM, setAllSM] = useState<ScheduleMember[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);

    const [
      { data: schedulesData, error: schedulesError },
      { data: smData, error: smError },
      { data: eventsData, error: eventsError },
      { data: usersData, error: usersError },
    ] = await Promise.all([
      supabase
        .from("schedules")
        .select("*")
        .eq("church_id", user.church_id)
        .eq("status", "active"),
      supabase.from("schedule_members").select("*"),
      supabase.from("events").select("*").eq("church_id", user.church_id),
      supabase.from("users").select("*").eq("church_id", user.church_id),
    ]);

    if (schedulesError || smError || eventsError || usersError) {
      console.error({ schedulesError, smError, eventsError, usersError });
      toast("Erro ao carregar suas escalas.");
      setLoading(false);
      return;
    }

    setSchedules((schedulesData || []) as Schedule[]);
    setAllSM((smData || []) as ScheduleMember[]);
    setEvents((eventsData || []) as Event[]);
    setMembers((usersData || []) as User[]);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [user.church_id]);

  const mySchedules = useMemo(() => {
    return allSM
      .filter((sm) => sm.user_id === user.id)
      .map((sm) => {
        const sched = schedules.find((s) => s.id === sm.schedule_id);
        if (!sched) return null;

        const ev = events.find((e) => e.id === sched.event_id);
        const dept = departments.find((d) => d.id === sched.department_id);
        const teamMembers = allSM.filter(
          (m) => m.schedule_id === sched.id && m.user_id !== user.id
        );

        return {
          sm,
          schedule: sched,
          event: ev,
          department: dept,
          team: teamMembers,
        } as MyScheduleItem;
      })
      .filter(Boolean)
      .sort((a, b) => a!.schedule.date.localeCompare(b!.schedule.date)) as MyScheduleItem[];
  }, [allSM, schedules, events, departments, user.id]);

  const today = new Date().toISOString().split("T")[0];
  const upcoming = mySchedules.filter((s) => s.schedule.date >= today);
  const past = mySchedules.filter((s) => s.schedule.date < today);
  const list = tab === "upcoming" ? upcoming : past;

  async function confirm(smId: string) {
    const { error } = await supabase
      .from("schedule_members")
      .update({
        status: "confirmed",
        responded_at: new Date().toISOString(),
      })
      .eq("id", smId);

    if (error) {
      console.error("Erro ao confirmar presença:", error);
      toast("Erro ao confirmar presença.");
      return;
    }

    toast("Presenca confirmada! Obrigado por servir.");
    setResponding(null);
    await loadData();
  }

  async function decline(smId: string) {
    const { error } = await supabase
      .from("schedule_members")
      .update({
        status: "declined",
        decline_reason: declineReason,
        responded_at: new Date().toISOString(),
      })
      .eq("id", smId);

    if (error) {
      console.error("Erro ao registrar ausência:", error);
      toast("Erro ao registrar ausência.");
      return;
    }

    toast("Ausencia registrada. O lider sera notificado.");
    setResponding(null);
    setDeclineReason("");
    await loadData();
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">Minhas Escalas</h1>
        <p className="page-subtitle">Suas escalas e confirmacoes</p>
      </div>

      <div className="flex gap-1 mb-5 bg-surface-alt rounded-[10px] p-0.5 w-fit">
        <button
          onClick={() => setTab("upcoming")}
          className={`px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
            tab === "upcoming"
              ? "bg-surface text-ink font-semibold shadow-sm"
              : "text-ink-muted"
          }`}
        >
          Proximas ({upcoming.length})
        </button>

        <button
          onClick={() => setTab("past")}
          className={`px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
            tab === "past"
              ? "bg-surface text-ink font-semibold shadow-sm"
              : "text-ink-muted"
          }`}
        >
          Passadas ({past.length})
        </button>
      </div>

      {loading ? (
        <div className="card px-5 py-16 text-center">
          <div className="text-4xl mb-3 opacity-40">&#128197;</div>
          <p className="text-sm text-ink-muted">Carregando suas escalas...</p>
        </div>
      ) : list.length === 0 ? (
        <div className="card px-5 py-16 text-center">
          <div className="text-4xl mb-3 opacity-40">
            {tab === "upcoming" ? "&#128197;" : "&#128203;"}
          </div>
          <p className="text-sm text-ink-muted">
            {tab === "upcoming" ? "Nenhuma escala futura." : "Nenhuma escala passada."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((item) => {
            const { sm, schedule, event: ev, department: dept, team } = item;
            const isResponding = responding === sm.id;

            return (
              <div key={sm.id} className="card">
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-[14px] bg-surface-alt flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold uppercase text-brand">
                        {getDayName(schedule.date)}
                      </span>
                      <span className="font-display text-[24px] leading-none">
                        {schedule.date.split("-")[2]}
                      </span>
                    </div>

                    <div className="flex-1">
                      <div className="text-base font-semibold">{ev?.name}</div>
                      <div className="text-[13px] text-ink-muted">
                        {formatDate(schedule.date)} &middot; {schedule.time} &middot; {dept?.name}
                      </div>
                      <div className="text-[12px] text-ink-faint mt-1">
                        Funcao: <strong className="text-ink-soft">{sm.function_name || "-"}</strong>
                      </div>
                      {schedule.arrival_time && (
                        <div className="text-[12px] text-ink-faint">
                          Chegada: {schedule.arrival_time}
                        </div>
                      )}
                      {schedule.instructions && (
                        <div className="text-[12px] text-ink-faint mt-1 italic">
                          {schedule.instructions}
                        </div>
                      )}
                    </div>

                    <span
                      className={`badge ${
                        sm.status === "confirmed"
                          ? "badge-green"
                          : sm.status === "pending"
                          ? "badge-amber"
                          : "badge-red"
                      }`}
                    >
                      {sm.status === "confirmed"
                        ? "Confirmado"
                        : sm.status === "pending"
                        ? "Pendente"
                        : "Recusado"}
                    </span>
                  </div>

                  {team.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-border-soft">
                      <div className="text-[10px] font-bold text-ink-faint uppercase tracking-wider mb-2">
                        Quem mais servira
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {team.slice(0, 6).map((t) => {
                          const m = members.find((u) => u.id === t.user_id);

                          return m ? (
                            <div
                              key={t.id}
                              className="flex items-center gap-1.5 bg-surface-alt px-2.5 py-1 rounded-full"
                            >
                              <div
                                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold"
                                style={{ background: m.avatar_color }}
                              >
                                {getInitials(m.name)}
                              </div>
                              <span className="text-[11px] font-medium">
                                {m.name.split(" ")[0]}
                              </span>
                            </div>
                          ) : null;
                        })}

                        {team.length > 6 && (
                          <span className="text-[11px] text-ink-faint self-center">
                            +{team.length - 6}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {sm.status === "pending" && tab === "upcoming" && !isResponding && (
                    <div className="mt-4 pt-3 border-t border-border-soft flex gap-2">
                      <button onClick={() => confirm(sm.id)} className="btn btn-green flex-1">
                        &#10003; Confirmar presenca
                      </button>
                      <button
                        onClick={() => setResponding(sm.id)}
                        className="btn btn-danger flex-1"
                      >
                        Nao poderei servir
                      </button>
                    </div>
                  )}

                  {isResponding && (
                    <div className="mt-4 pt-3 border-t border-border-soft space-y-3">
                      <div>
                        <label className="input-label">Motivo (opcional)</label>
                        <textarea
                          className="input-field min-h-[60px]"
                          value={declineReason}
                          onChange={(e) => setDeclineReason(e.target.value)}
                          placeholder="Conte o motivo da sua ausencia..."
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setResponding(null);
                            setDeclineReason("");
                          }}
                          className="btn btn-secondary flex-1"
                        >
                          Cancelar
                        </button>
                        <button onClick={() => decline(sm.id)} className="btn btn-danger flex-1">
                          Confirmar ausencia
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}