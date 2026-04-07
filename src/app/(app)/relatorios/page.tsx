"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/hooks/use-app";
import { Avatar } from "@/components/ui";
import { supabase } from "@/lib/supabase/client";
import type { User, Schedule, ScheduleMember, ScheduleSlot } from "@/types";

export default function RelatóriosPage() {
  const { user, departments } = useApp();

  const [members, setMembers] = useState<User[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [allSM, setAllSM] = useState<ScheduleMember[]>([]);
  const [allSlots, setAllSlots] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);

    const [
      { data: usersData, error: usersError },
      { data: schedulesData, error: schedulesError },
    ] = await Promise.all([
      supabase.from("users").select("*").eq("church_id", user.church_id).eq("active", true),
      supabase.from("schedules").select("*").eq("church_id", user.church_id),
    ]);

    if (usersError || schedulesError) {
      console.error({ usersError, schedulesError });
      setLoading(false);
      return;
    }

    const scheduleIds = ((schedulesData || []) as Schedule[]).map((schedule) => schedule.id);
    const [{ data: smData, error: smError }, { data: slotsData, error: slotsError }] =
      scheduleIds.length
        ? await Promise.all([
            supabase.from("schedule_members").select("*").in("schedule_id", scheduleIds),
            supabase.from("schedule_slots").select("*").in("schedule_id", scheduleIds),
          ])
        : [{ data: [], error: null }, { data: [], error: null }];

    if (smError || slotsError) {
      console.error({ smError, slotsError });
      setLoading(false);
      return;
    }

    setMembers((usersData || []) as User[]);
    setSchedules((schedulesData || []) as Schedule[]);
    setAllSM((smData || []) as ScheduleMember[]);
    setAllSlots((slotsData || []) as ScheduleSlot[]);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [user.church_id]);

  const topServing = useMemo(
    () => [...members].sort((a, b) => b.total_schedules - a.total_schedules).slice(0, 5),
    [members]
  );

  const lowConfirm = useMemo(
    () =>
      [...members]
        .filter((m) => m.total_schedules > 2)
        .sort((a, b) => a.confirm_rate - b.confirm_rate)
        .slice(0, 5),
    [members]
  );

  const totalConfirmed = useMemo(
    () => allSM.filter((sm) => sm.status === "confirmed").length,
    [allSM]
  );

  const totalAll = allSM.length;
  const confirmRate = totalAll ? Math.round((totalConfirmed / totalAll) * 100) : 0;
  const totalPlannedSlots = useMemo(
    () => allSlots.reduce((sum, slot) => sum + slot.quantity, 0),
    [allSlots]
  );
  const totalFilledSlots = useMemo(
    () => allSlots.reduce((sum, slot) => sum + slot.filled, 0),
    [allSlots]
  );
  const totalCoverageRate = totalPlannedSlots
    ? Math.round((Math.min(totalFilledSlots, totalPlannedSlots) / totalPlannedSlots) * 100)
    : 0;
  const uncoveredFunctions = useMemo(() => {
    const map = new Map<string, { key: string; departmentName: string; functionName: string; missing: number }>();

    for (const slot of allSlots) {
      const missing = Math.max(0, slot.quantity - slot.filled);
      if (missing <= 0) continue;
      const schedule = schedules.find((item) => item.id === slot.schedule_id);
      const departmentName =
        departments.find((department) => department.id === schedule?.department_id)?.name || "Ministério";
      const key = `${schedule?.department_id || "unknown"}::${slot.function_name}`;
      const current = map.get(key);
      map.set(key, {
        key,
        departmentName,
        functionName: slot.function_name,
        missing: (current?.missing || 0) + missing,
      });
    }

    return [...map.values()].sort((a, b) => b.missing - a.missing).slice(0, 6);
  }, [allSlots, schedules, departments]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">Relatórios</h1>
        <p className="page-subtitle">Insights do seu ministério</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="bg-surface border border-border-soft rounded-[14px] px-5 py-4">
          <div className="font-display text-[28px] text-brand">
            {loading ? "..." : schedules.length}
          </div>
          <div className="text-xs text-ink-muted">Total de escalas</div>
        </div>

        <div className="bg-surface border border-border-soft rounded-[14px] px-5 py-4">
          <div className="font-display text-[28px] text-success">
            {loading ? "..." : `${confirmRate}%`}
          </div>
          <div className="text-xs text-ink-muted">Taxa de confirmação</div>
        </div>

        <div className="bg-surface border border-border-soft rounded-[14px] px-5 py-4">
          <div className="font-display text-[28px] text-info">
            {loading ? "..." : members.length}
          </div>
          <div className="text-xs text-ink-muted">Membros ativos</div>
        </div>

        <div className="bg-surface border border-border-soft rounded-[14px] px-5 py-4">
          <div className="font-display text-[28px] text-amber">
            {loading ? "..." : `${totalCoverageRate}%`}
          </div>
          <div className="text-xs text-ink-muted">Cobertura das funções</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="card">
          <div className="px-5 pt-4 pb-3">
            <span className="font-display text-[17px]">Mais servem</span>
          </div>

          {loading ? (
            <div className="px-5 py-6 text-sm text-ink-faint text-center">Carregando...</div>
          ) : topServing.length === 0 ? (
            <div className="px-5 py-6 text-sm text-ink-faint text-center">Nenhum dado.</div>
          ) : (
            topServing.map((m, i) => (
              <div key={m.id} className="flex items-center gap-3 px-5 py-2.5 border-t border-border-soft">
                <span className="text-xs text-ink-faint w-4">{i + 1}.</span>
                <Avatar name={m.name} color={m.avatar_color} photoUrl={m.photo_url} size={28} />
                <div className="flex-1 text-sm font-medium">{m.name}</div>
                <span className="text-sm font-semibold text-brand">{m.total_schedules}</span>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div className="px-5 pt-4 pb-3">
            <span className="font-display text-[17px]">Menor confirmação</span>
          </div>

          {loading ? (
            <div className="px-5 py-6 text-sm text-ink-faint text-center">Carregando...</div>
          ) : lowConfirm.length === 0 ? (
            <div className="px-5 py-6 text-sm text-ink-faint text-center">Dados insuficientes.</div>
          ) : (
            lowConfirm.map((m, i) => (
              <div key={m.id} className="flex items-center gap-3 px-5 py-2.5 border-t border-border-soft">
                <span className="text-xs text-ink-faint w-4">{i + 1}.</span>
                <Avatar name={m.name} color={m.avatar_color} photoUrl={m.photo_url} size={28} />
                <div className="flex-1 text-sm font-medium">{m.name}</div>
                <span
                  className={`text-sm font-semibold ${
                    m.confirm_rate < 80 ? "text-danger" : "text-amber"
                  }`}
                >
                  {m.confirm_rate}%
                </span>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div className="px-5 pt-4 pb-3">
            <span className="font-display text-[17px]">Funções mais descobertas</span>
          </div>

          {loading ? (
            <div className="px-5 py-6 text-sm text-ink-faint text-center">Carregando...</div>
          ) : uncoveredFunctions.length === 0 ? (
            <div className="px-5 py-6 text-sm text-ink-faint text-center">
              Nenhuma lacuna de cobertura nas funções planejadas.
            </div>
          ) : (
            uncoveredFunctions.map((item) => (
              <div
                key={item.key}
                className="flex items-start justify-between gap-3 px-5 py-3 border-t border-border-soft"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium break-words">{item.functionName}</div>
                  <div className="text-[11px] text-ink-faint break-words">{item.departmentName}</div>
                </div>
                <span className="text-sm font-semibold text-amber shrink-0">-{item.missing}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
