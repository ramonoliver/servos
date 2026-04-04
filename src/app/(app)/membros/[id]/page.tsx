"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/hooks/use-app";
import { supabase } from "@/lib/supabase/client";
import { getInitials, formatShortDate, genId } from "@/lib/utils/helpers";
import { MemberEditModal } from "@/components/shared/member-edit-modal";
import { AvailabilityGrid } from "@/components/ui";
import Link from "next/link";
import type { User, DepartmentMember, Schedule, ScheduleMember, Event } from "@/types";

type SelectedDepartment = {
  department_id: string;
  function_name: string;
};

export default function MembroDetailPage({ params }: { params: { id: string } }) {
  const { user, departments, canDo, toast } = useApp();

  const [showEdit, setShowEdit] = useState(false);
  const [member, setMember] = useState<User | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [dms, setDms] = useState<DepartmentMember[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [allSM, setAllSM] = useState<ScheduleMember[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);

    const [
      { data: memberData, error: memberError },
      { data: membersData, error: membersError },
      { data: dmsData, error: dmsError },
      { data: schedulesData, error: schedulesError },
      { data: smData, error: smError },
      { data: eventsData, error: eventsError },
    ] = await Promise.all([
      supabase.from("users").select("*").eq("id", params.id).maybeSingle(),
      supabase.from("users").select("*").eq("church_id", user.church_id),
      supabase.from("department_members").select("*").eq("user_id", params.id),
      supabase.from("schedules").select("*").eq("church_id", user.church_id),
      supabase.from("schedule_members").select("*").eq("user_id", params.id),
      supabase.from("events").select("*").eq("church_id", user.church_id),
    ]);

    if (memberError || membersError || dmsError || schedulesError || smError || eventsError) {
      console.error({
        memberError,
        membersError,
        dmsError,
        schedulesError,
        smError,
        eventsError,
      });
      toast("Erro ao carregar dados do membro.");
      setLoading(false);
      return;
    }

    setMember((memberData || null) as User | null);
    setMembers((membersData || []) as User[]);
    setDms((dmsData || []) as DepartmentMember[]);
    setSchedules((schedulesData || []) as Schedule[]);
    setAllSM((smData || []) as ScheduleMember[]);
    setEvents((eventsData || []) as Event[]);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [params.id, user.church_id]);

  if (loading) {
    return <div className="py-20 text-center text-ink-faint">Carregando membro...</div>;
  }

  if (!member) {
    return <div className="py-20 text-center text-ink-faint">Membro nao encontrado.</div>;
  }

  const spouse = member.spouse_id ? members.find((m) => m.id === member.spouse_id) : null;
  const roleCls =
    member.role === "admin"
      ? "bg-purple-50 text-purple-600"
      : member.role === "leader"
      ? "bg-brand-light text-brand"
      : "bg-success-light text-success";

  return (
    <div>
      <Link href="/membros" className="inline-flex items-center gap-1.5 text-[13px] text-brand font-medium mb-5 hover:underline">
        &larr; Membros
      </Link>

      <div className="grid grid-cols-[1fr_320px] gap-6 items-start">
        <div className="space-y-5">
          <div className="flex items-center gap-5 mb-2">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold"
              style={{ background: member.avatar_color }}
            >
              {getInitials(member.name)}
            </div>

            <div>
              <h1 className="page-title">{member.name}</h1>
              <p className="page-subtitle">{member.email}</p>

              <div className="flex gap-2 mt-2 flex-wrap">
                <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${roleCls}`}>
                  {member.role === "admin" ? "Administrador" : member.role === "leader" ? "Lider" : "Membro"}
                </span>

                {spouse && (
                  <span className="text-[10px] font-semibold text-brand bg-brand-light px-2 py-0.5 rounded-full">
                    &#128145; {spouse.name}
                  </span>
                )}

                {member.must_change_password && <span className="badge badge-amber">Senha temporaria</span>}
              </div>
            </div>

            {canDo("member.edit") && (
              <button onClick={() => setShowEdit(true)} className="btn btn-secondary btn-sm ml-auto self-start">
                &#9998; Editar
              </button>
            )}
          </div>

          <div className="card p-5">
            <div className="font-display text-lg mb-3">Disponibilidade</div>
            <AvailabilityGrid availability={member.availability || []} />
          </div>

          <div className="card">
            <div className="px-5 pt-4 pb-3">
              <span className="font-display text-[17px]">Historico de Escalas</span>
            </div>

            {allSM.slice(0, 10).map((sm) => {
              const sched = schedules.find((s) => s.id === sm.schedule_id);
              const ev = sched ? events.find((e) => e.id === sched.event_id) : null;

              return sched ? (
                <Link
                  key={sm.id}
                  href={`/escalas/${sched.id}`}
                  className="flex items-center gap-3 px-5 py-2.5 border-t border-border-soft hover:bg-brand-glow transition-colors"
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                      sm.status === "confirmed"
                        ? "bg-success-light"
                        : sm.status === "pending"
                        ? "bg-amber-light"
                        : "bg-danger-light"
                    }`}
                  >
                    {sm.status === "confirmed" ? "\u2713" : sm.status === "pending" ? "\u23F3" : "\u2715"}
                  </div>

                  <div className="flex-1">
                    <div className="text-sm font-medium">{ev?.name}</div>
                    <div className="text-[11px] text-ink-faint">{formatShortDate(sched.date)}</div>
                  </div>
                </Link>
              ) : null;
            })}

            {allSM.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-ink-faint">Nenhuma escala ainda.</div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="card p-5">
            <div className="font-display text-lg mb-3">Informacoes</div>

            <div className="space-y-2 text-sm">
              {[
                ["Telefone", member.phone || "-"],
                ["Escalas", String(member.total_schedules)],
                ["Confirmacao", member.confirm_rate + "%"],
                ["Status", member.status],
                ["Desde", member.joined_at?.split("T")[0] || "-"],
              ].map(([l, v], i) => (
                <div key={i} className="flex justify-between py-1.5 border-t border-border-soft first:border-t-0">
                  <span className="text-ink-muted">{l}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <div className="font-display text-lg mb-3">Ministerios</div>

            {dms.length === 0 ? (
              <p className="text-sm text-ink-faint">Nenhum ministerio.</p>
            ) : (
              dms.map((dm) => {
                const d = departments.find((dep) => dep.id === dm.department_id);
                return d ? (
                  <div key={dm.id} className="flex items-center justify-between py-1.5">
                    <span className="text-sm font-medium">{d.name}</span>
                    <span className="text-xs text-ink-faint">{dm.function_name}</span>
                  </div>
                ) : null;
              })
            )}
          </div>
        </div>
      </div>

      {showEdit && (
        <MemberEditModal
          member={member}
          departments={departments}
          allDeptMembers={dms}
          allMembers={members}
          onClose={() => setShowEdit(false)}
          onSave={async (updates, selectedDepartments, spouseId) => {
            const { error: updateUserError } = await supabase
              .from("users")
              .update(updates)
              .eq("id", member.id);

            if (updateUserError) {
              console.error("Erro ao atualizar membro:", updateUserError);
              toast("Erro ao atualizar membro.");
              return;
            }

            const { error: deleteDMError } = await supabase
              .from("department_members")
              .delete()
              .eq("user_id", member.id);

            if (deleteDMError) {
              console.error("Erro ao limpar ministerios atuais:", deleteDMError);
              toast("Erro ao atualizar ministerios.");
              return;
            }

            if (selectedDepartments.length > 0) {
              const payload = selectedDepartments.map((dept: SelectedDepartment) => ({
                id: genId(),
                department_id: dept.department_id,
                user_id: member.id,
                function_name: dept.function_name,
                joined_at: new Date().toISOString(),
              }));

              const { error: insertDMError } = await supabase
                .from("department_members")
                .insert(payload);

              if (insertDMError) {
                console.error("Erro ao salvar ministerios:", insertDMError);
                toast("Erro ao atualizar ministerios.");
                return;
              }
            }

            if (spouseId && spouseId !== member.spouse_id) {
              const { error: spouseSetError } = await supabase
                .from("users")
                .update({ spouse_id: member.id })
                .eq("id", spouseId);

              if (spouseSetError) {
                console.error("Erro ao vincular conjuge:", spouseSetError);
              }
            }

            if (!spouseId && member.spouse_id) {
              const { error: spouseClearError } = await supabase
                .from("users")
                .update({ spouse_id: null })
                .eq("id", member.spouse_id);

              if (spouseClearError) {
                console.error("Erro ao desvincular conjuge:", spouseClearError);
              }
            }

            toast("Membro atualizado!");
            setShowEdit(false);
            await loadData();
          }}
        />
      )}
    </div>
  );
}