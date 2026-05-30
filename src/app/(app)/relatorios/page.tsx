"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/hooks/use-app";
import { Avatar, PageShell, PageHeader, SectionCard, StatTile } from "@/components/ui";
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
    <PageShell>
      <PageHeader
        eyebrow="Análise"
        title="Relatórios"
        subtitle="Insights do seu ministério — quem mais serve, confirmações e lacunas de cobertura."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile tone="brand" loading={loading} value={schedules.length} label="Total de escalas" icon="🗓️" />
        <StatTile tone="success" loading={loading} value={`${confirmRate}%`} label="Taxa de confirmação" icon="✅" />
        <StatTile tone="info" loading={loading} value={members.length} label="Membros ativos" icon="👥" />
        <StatTile tone="amber" loading={loading} value={`${totalCoverageRate}%`} label="Cobertura das funções" icon="🎯" />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <SectionCard title="Mais servem" padding="none">
          {loading ? (
            <div className="px-5 py-6 text-center text-sm text-ink-faint">Carregando...</div>
          ) : topServing.length === 0 ? (
            <div className="px-5 py-6 text-center text-sm text-ink-faint">Nenhum dado.</div>
          ) : (
            topServing.map((m, i) => (
              <div key={m.id} className="flex items-center gap-3 border-t border-border-soft px-5 py-2.5 first:border-t-0">
                <span className="w-4 text-xs text-ink-faint">{i + 1}.</span>
                <Avatar name={m.name} color={m.avatar_color} photoUrl={m.photo_url} size={28} />
                <div className="flex-1 text-sm font-medium">{m.name}</div>
                <span className="text-sm font-semibold text-brand">{m.total_schedules}</span>
              </div>
            ))
          )}
        </SectionCard>

        <SectionCard title="Menor confirmação" padding="none">
          {loading ? (
            <div className="px-5 py-6 text-center text-sm text-ink-faint">Carregando...</div>
          ) : lowConfirm.length === 0 ? (
            <div className="px-5 py-6 text-center text-sm text-ink-faint">Dados insuficientes.</div>
          ) : (
            lowConfirm.map((m, i) => (
              <div key={m.id} className="flex items-center gap-3 border-t border-border-soft px-5 py-2.5 first:border-t-0">
                <span className="w-4 text-xs text-ink-faint">{i + 1}.</span>
                <Avatar name={m.name} color={m.avatar_color} photoUrl={m.photo_url} size={28} />
                <div className="flex-1 text-sm font-medium">{m.name}</div>
                <span className={`text-sm font-semibold ${m.confirm_rate < 80 ? "text-danger" : "text-amber"}`}>
                  {m.confirm_rate}%
                </span>
              </div>
            ))
          )}
        </SectionCard>

        <SectionCard title="Funções mais descobertas" padding="none">
          {loading ? (
            <div className="px-5 py-6 text-center text-sm text-ink-faint">Carregando...</div>
          ) : uncoveredFunctions.length === 0 ? (
            <div className="px-5 py-6 text-center text-sm text-ink-faint">
              Nenhuma lacuna de cobertura nas funções planejadas.
            </div>
          ) : (
            uncoveredFunctions.map((item) => (
              <div
                key={item.key}
                className="flex items-start justify-between gap-3 border-t border-border-soft px-5 py-3 first:border-t-0"
              >
                <div className="min-w-0">
                  <div className="break-words text-sm font-medium">{item.functionName}</div>
                  <div className="break-words text-[11px] text-ink-faint">{item.departmentName}</div>
                </div>
                <span className="shrink-0 text-sm font-semibold text-amber">-{item.missing}</span>
              </div>
            ))
          )}
        </SectionCard>
      </div>
    </PageShell>
  );
}
