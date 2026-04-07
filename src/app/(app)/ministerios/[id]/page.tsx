"use client";

import { useMemo, useState, useEffect } from "react";
import { useApp } from "@/hooks/use-app";
import { supabase } from "@/lib/supabase/client";
import { getInitials, getIconEmoji } from "@/lib/utils/helpers";
import { Modal } from "@/components/ui";
import Link from "next/link";
import type { User, DepartmentMember, Schedule, Event } from "@/types";

export default function MinisterioDetailPage({ params }: { params: { id: string } }) {
  const { user, departments, canDo, toast } = useApp();
  const [showAddMember, setShowAddMember] = useState(false);

  const [allMembers, setAllMembers] = useState<User[]>([]);
  const [dms, setDms] = useState<DepartmentMember[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const dept = departments.find((d) => d.id === params.id);

  async function loadData() {
    if (!dept) return;
    setLoading(true);

    const [
      { data: usersData, error: usersError },
      { data: dmData, error: dmError },
      { data: schedulesData, error: schedulesError },
      { data: eventsData, error: eventsError },
    ] = await Promise.all([
      supabase.from("users").select("*").eq("church_id", user.church_id).eq("active", true),
      supabase.from("department_members").select("*").eq("department_id", dept.id),
      supabase.from("schedules").select("*").eq("department_id", dept.id),
      supabase.from("events").select("*").eq("church_id", user.church_id),
    ]);

    if (usersError || dmError || schedulesError || eventsError) {
      console.error({
        usersError,
        dmError,
        schedulesError,
        eventsError,
      });
      toast("Erro ao carregar dados do ministério.");
      setLoading(false);
      return;
    }

    setAllMembers((usersData || []) as User[]);
    setDms((dmData || []) as DepartmentMember[]);
    setSchedules(
      ((schedulesData || []) as Schedule[])
        .filter((s) => s.status !== "cancelled")
        .sort((a, b) => a.date.localeCompare(b.date))
    );
    setEvents((eventsData || []) as Event[]);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [params.id, user.church_id]);

  const deptMemberIds = useMemo(() => dms.map((dm) => dm.user_id), [dms]);

  const leaders = useMemo(
    () =>
      (dept?.leader_ids || [])
        .map((id) => allMembers.find((m) => m.id === id))
        .filter(Boolean),
    [dept, allMembers]
  );

  const coLeaders = useMemo(
    () =>
      (dept?.co_leader_ids || [])
        .map((id) => allMembers.find((m) => m.id === id))
        .filter(Boolean),
    [dept, allMembers]
  );

  const availableToAdd = useMemo(
    () => allMembers.filter((m) => !deptMemberIds.includes(m.id)),
    [allMembers, deptMemberIds]
  );

  async function addMembersToDept(selectedMembers: { userId: string; functionName: string }[]) {
    if (!dept) return;

    try {
      const response = await fetch("/api/department-members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          departmentId: dept.id,
          members: selectedMembers,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        console.error("Erro ao adicionar membro:", data);
        toast(data?.error || "Erro ao adicionar membro ao ministério.");
        return;
      }

      toast(
        selectedMembers.length === 1
          ? "Membro adicionado ao ministério!"
          : `${selectedMembers.length} membros adicionados ao ministério!`
      );
      setShowAddMember(false);
      await loadData();
    } catch (error) {
      console.error("Erro ao adicionar membro:", error);
      toast("Erro ao adicionar membro ao ministério.");
    }
  }

  async function removeMemberFromDept(dmId: string, memberName: string) {
    if (!confirm(`Remover ${memberName} deste ministério?`)) return;

    try {
      const params = new URLSearchParams({
        departmentId: dept.id,
        departmentMemberId: dmId,
      });

      const response = await fetch(`/api/department-members?${params.toString()}`, {
        method: "DELETE",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        console.error("Erro ao remover membro:", data);
        toast(data?.error || "Erro ao remover membro do ministério.");
        return;
      }

      toast(memberName + " removido do ministério.");
      await loadData();
    } catch (error) {
      console.error("Erro ao remover membro:", error);
      toast("Erro ao remover membro do ministério.");
    }
  }

  if (!dept) {
    return <div className="py-20 text-center text-ink-faint">Ministério não encontrado.</div>;
  }

  if (loading) {
    return <div className="py-20 text-center text-ink-faint">Carregando ministério...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="card p-5 sm:p-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm"
            style={{ background: dept.color + "22", color: dept.color }}
          >
            {getIconEmoji(dept.icon)}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="page-title mb-0 break-words leading-tight">{dept.name}</h1>
              {!dept.active && (
                <span className="text-[10px] font-semibold bg-danger-light text-danger px-2 py-0.5 rounded-full">
                  Inativo
                </span>
              )}
            </div>

            <p className="text-sm text-ink-muted mb-3 break-words">{dept.description || "Sem descrição."}</p>

            <div className="flex flex-wrap gap-2">
              {leaders.length > 0 && (
                <span className="badge badge-brand">
                  Líder: {(leaders as User[]).map((m) => m.name.split(" ")[0]).join(", ")}
                </span>
              )}
              {coLeaders.length > 0 && (
                <span className="badge badge-secondary">
                  Co-líder: {(coLeaders as User[]).map((m) => m.name.split(" ")[0]).join(", ")}
                </span>
              )}
              <span className="badge badge-secondary">{dms.length} membros</span>
              {dept.function_names?.length > 0 && (
                <span className="badge badge-secondary">{dept.function_names.length} funções</span>
              )}
            </div>

            {dept.function_names?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {dept.function_names.map((functionName) => (
                  <span key={functionName} className="badge badge-secondary">
                    {functionName}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 self-start lg:self-auto">
          {canDo("schedule.create", dept.id) && (
            <Link href={`/escalas/nova?departmentId=${dept.id}`} className="btn btn-secondary">
              + Nova escala
            </Link>
          )}
          {canDo("member.edit", dept.id) && (
            <button onClick={() => setShowAddMember(true)} className="btn btn-primary">
              + Adicionar membros
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_.8fr] gap-6">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Membros do ministério</h2>
          </div>

          {dms.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-ink-faint">
              Nenhum membro neste ministério.
            </div>
          ) : (
            dms.map((dm) => {
              const member = allMembers.find((m) => m.id === dm.user_id);
              if (!member) return null;

              return (
                <div
                  key={dm.id}
                  className="flex items-center gap-3.5 px-5 py-3 border-t border-border-soft first:border-t-0 hover:bg-brand-glow transition-colors group"
                >
                  <Link href={`/membros/${member.id}`} className="flex items-center gap-3.5 flex-1 min-w-0">
                    {member.photo_url ? (
                      <img
                        src={member.photo_url}
                        alt=""
                        className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ background: member.avatar_color }}
                      >
                        {getInitials(member.name)}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{member.name}</div>
                      <div className="text-[11px] text-ink-faint">
                        {dm.function_name || "Sem função"} · {member.email}
                      </div>
                    </div>
                  </Link>

                  {canDo("member.edit", dept.id) && (
                    <button
                      onClick={() => removeMemberFromDept(dm.id, member.name)}
                      className="btn btn-ghost btn-sm text-danger opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      &#10005;
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title break-words">Próximas escalas</h2>
          </div>

          {schedules.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-ink-faint">
              Nenhuma escala encontrada.
            </div>
          ) : (
            schedules.map((s) => {
              const event = events.find((e) => e.id === s.event_id);
              return (
                <Link
                  key={s.id}
                  href={`/escalas/${s.id}`}
                  className="block px-5 py-3 border-t border-border-soft first:border-t-0 hover:bg-brand-glow transition-colors"
                >
                  <div className="text-sm font-medium">{event?.name || "Evento"}</div>
                  <div className="text-[11px] text-ink-faint">
                    {s.date} · {s.time}
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>

      {showAddMember && (
        <AddMemberModal
          availableToAdd={availableToAdd}
          functionOptions={dept.function_names || []}
          onClose={() => setShowAddMember(false)}
          onSave={addMembersToDept}
        />
      )}
    </div>
  );
}

function AddMemberModal({
  availableToAdd,
  functionOptions,
  onClose,
  onSave,
}: {
  availableToAdd: User[];
  functionOptions: string[];
  onClose: () => void;
  onSave: (members: { userId: string; functionName: string }[]) => void;
}) {
  const [selectedUsers, setSelectedUsers] = useState<Record<string, string>>({});

  function toggleUser(userId: string) {
    setSelectedUsers((current) => {
      const next = { ...current };
      if (next[userId] !== undefined) {
        delete next[userId];
      } else {
        next[userId] = "";
      }
      return next;
    });
  }

  function updateFunction(userId: string, functionName: string) {
    setSelectedUsers((current) => ({
      ...current,
      [userId]: functionName,
    }));
  }

  const selectedIds = Object.keys(selectedUsers);

  return (
    <Modal
      title="Adicionar membros"
      close={onClose}
      width={680}
      footer={
        <>
          <button onClick={onClose} className="btn btn-secondary">
            Cancelar
          </button>
          <button
            onClick={() =>
              onSave(
                selectedIds.map((userId) => ({
                  userId,
                  functionName: selectedUsers[userId] || "",
                }))
              )
            }
            disabled={selectedIds.length === 0}
            className="btn btn-primary"
          >
            Adicionar selecionados
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-border-soft bg-surface-alt px-4 py-3 text-sm text-ink-muted">
          Selecione vários membros de uma vez e ajuste a função individual de cada um, se quiser.
        </div>

        <div className="space-y-3 max-h-[52vh] overflow-y-auto pr-1">
          {availableToAdd.length === 0 ? (
            <div className="text-sm text-ink-faint text-center py-8">
              Todos os membros ativos já estão neste ministério.
            </div>
          ) : (
            availableToAdd.map((member) => {
              const selected = selectedUsers[member.id] !== undefined;

              return (
                <div
                  key={member.id}
                  className={`rounded-2xl border p-4 transition-all ${
                    selected
                      ? "border-brand bg-brand-glow shadow-sm"
                      : "border-border-soft bg-white"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => toggleUser(member.id)}
                      className={`mt-1 w-5 h-5 rounded-md border-2 flex items-center justify-center text-[11px] font-bold transition-all ${
                        selected
                          ? "bg-brand border-brand text-white"
                          : "border-border bg-white text-transparent"
                      }`}
                    >
                      ✓
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold truncate">{member.name}</div>
                      <div className="text-[12px] text-ink-faint truncate">{member.email}</div>

                      {selected && (
                        <div className="mt-3">
                          <label className="input-label">Função no ministério</label>
                          <input
                            list={`department-functions-${member.id}`}
                            className="input-field"
                            value={selectedUsers[member.id]}
                            onChange={(e) => updateFunction(member.id, e.target.value)}
                            placeholder="Ex: Vocal, Camera, Recepcao..."
                          />
                          {functionOptions.length > 0 && (
                            <datalist id={`department-functions-${member.id}`}>
                              {functionOptions.map((functionName) => (
                                <option key={functionName} value={functionName} />
                              ))}
                            </datalist>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
}
