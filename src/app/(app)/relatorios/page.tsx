"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/hooks/use-app";
import { supabase } from "@/lib/supabase/client";
import { getInitials } from "@/lib/utils/helpers";
import type { User, Schedule, ScheduleMember } from "@/types";

export default function RelatoriosPage() {
  const { user } = useApp();

  const [members, setMembers] = useState<User[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [allSM, setAllSM] = useState<ScheduleMember[]>([]);
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
    const { data: smData, error: smError } = scheduleIds.length
      ? await supabase.from("schedule_members").select("*").in("schedule_id", scheduleIds)
      : { data: [], error: null };

    if (smError) {
      console.error({ smError });
      setLoading(false);
      return;
    }

    setMembers((usersData || []) as User[]);
    setSchedules((schedulesData || []) as Schedule[]);
    setAllSM((smData || []) as ScheduleMember[]);
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">Relatorios</h1>
        <p className="page-subtitle">Insights do seu ministerio</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
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
          <div className="text-xs text-ink-muted">Taxa de confirmacao</div>
        </div>

        <div className="bg-surface border border-border-soft rounded-[14px] px-5 py-4">
          <div className="font-display text-[28px] text-info">
            {loading ? "..." : members.length}
          </div>
          <div className="text-xs text-ink-muted">Membros ativos</div>
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
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                  style={{ background: m.avatar_color }}
                >
                  {getInitials(m.name)}
                </div>
                <div className="flex-1 text-sm font-medium">{m.name}</div>
                <span className="text-sm font-semibold text-brand">{m.total_schedules}</span>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div className="px-5 pt-4 pb-3">
            <span className="font-display text-[17px]">Menor confirmacao</span>
          </div>

          {loading ? (
            <div className="px-5 py-6 text-sm text-ink-faint text-center">Carregando...</div>
          ) : lowConfirm.length === 0 ? (
            <div className="px-5 py-6 text-sm text-ink-faint text-center">Dados insuficientes.</div>
          ) : (
            lowConfirm.map((m, i) => (
              <div key={m.id} className="flex items-center gap-3 px-5 py-2.5 border-t border-border-soft">
                <span className="text-xs text-ink-faint w-4">{i + 1}.</span>
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                  style={{ background: m.avatar_color }}
                >
                  {getInitials(m.name)}
                </div>
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
      </div>
    </div>
  );
}
