"use client";

import { useMemo, useState, useEffect } from "react";
import { useApp } from "@/hooks/use-app";
import { supabase } from "@/lib/supabase/client";
import { getInitials, getIconEmoji } from "@/lib/utils/helpers";
import { Modal } from "@/components/ui";
import Link from "next/link";
import type { Department, User, DepartmentMember, Schedule, Event } from "@/types";

const ICONS = ["music", "camera", "heart", "church", "cross", "flower", "flame", "star", "book", "baby", "pray"];

export default function MinisterioDetailPage({ params }: { params: { id: string } }) {
  const { user, departments, canDo, toast, refresh } = useApp();
  const [showAddMember, setShowAddMember] = useState(false);
  const [showEditDept, setShowEditDept] = useState(false);

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

  async function addMembersToDept(selectedMembers: { userId: string; functionName: string; functionNames: string[] }[]) {
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

            <p className="text-[12px] text-ink-faint mt-3 break-words">
              Ajuste nome, líderes, cor e funções por aqui sempre que precisar.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 self-start lg:self-auto">
          {canDo("department.edit", dept.id) && (
            <button onClick={() => setShowEditDept(true)} className="btn btn-secondary">
              ✎ Editar ministério
            </button>
          )}
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
                        {(dm.function_names?.length ? dm.function_names : dm.function_name ? [dm.function_name] : ["Sem função"]).join(", ")} · {member.email}
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

      {showEditDept && (
        <DepartmentFormModal
          dept={dept}
          members={allMembers}
          userId={user.id}
          toast={toast}
          onClose={() => setShowEditDept(false)}
          onSaved={async () => {
            setShowEditDept(false);
            await refresh();
            await loadData();
          }}
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
  onSave: (members: { userId: string; functionName: string; functionNames: string[] }[]) => void;
}) {
  const [selectedUsers, setSelectedUsers] = useState<Record<string, string[]>>({});

  function toggleUser(userId: string) {
    setSelectedUsers((current) => {
      const next = { ...current };
      if (next[userId] !== undefined) {
        delete next[userId];
      } else {
        next[userId] = [];
      }
      return next;
    });
  }

  function toggleFunction(userId: string, functionName: string) {
    setSelectedUsers((current) => ({
      ...current,
      [userId]: current[userId]?.includes(functionName)
        ? current[userId].filter((item) => item !== functionName)
        : [...(current[userId] || []), functionName],
    }));
  }

  function updateCustomFunctions(userId: string, rawValue: string) {
    setSelectedUsers((current) => ({
      ...current,
      [userId]: rawValue
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
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
                  functionName: selectedUsers[userId]?.[0] || "",
                  functionNames: selectedUsers[userId] || [],
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
                          <label className="input-label">Funções no ministério</label>
                          {functionOptions.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {functionOptions.map((functionName) => {
                                const active = selectedUsers[member.id]?.includes(functionName);
                                return (
                                  <button
                                    key={functionName}
                                    type="button"
                                    onClick={() => toggleFunction(member.id, functionName)}
                                    className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${
                                      active ? "bg-brand text-white" : "bg-surface-alt text-ink-muted"
                                    }`}
                                  >
                                    {functionName}
                                  </button>
                                );
                              })}
                            </div>
                          ) : null}

                          <input
                            className="input-field mt-2"
                            value={(selectedUsers[member.id] || []).join(", ")}
                            onChange={(e) => updateCustomFunctions(member.id, e.target.value)}
                            placeholder="Ex: Vocal, Câmera, Recepção"
                          />
                          <div className="text-[11px] text-ink-faint mt-1">
                            Você pode selecionar várias funções e também editar manualmente separando por vírgula.
                          </div>
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

function DepartmentFormModal({
  dept,
  members,
  userId,
  toast,
  onClose,
  onSaved,
}: {
  dept: Department;
  members: User[];
  userId: string;
  toast: (msg: string) => void;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const [name, setName] = useState(dept.name || "");
  const [desc, setDesc] = useState(dept.description || "");
  const [icon, setIcon] = useState(dept.icon || "church");
  const [color, setColor] = useState(dept.color || "#7B9E87");
  const [functionNames, setFunctionNames] = useState<string[]>(dept.function_names || []);
  const [newFunctionName, setNewFunctionName] = useState("");
  const [leaderIds, setLeaderIds] = useState<string[]>(dept.leader_ids || [userId]);
  const [coLeaderIds, setCoLeaderIds] = useState<string[]>(dept.co_leader_ids || []);

  function toggleList(list: string[], setList: (v: string[]) => void, id: string) {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  function addFunctionName() {
    const normalized = newFunctionName.trim();
    if (!normalized) return;
    if (functionNames.some((item) => item.toLowerCase() === normalized.toLowerCase())) {
      setNewFunctionName("");
      return;
    }
    setFunctionNames((current) => [...current, normalized]);
    setNewFunctionName("");
  }

  function removeFunctionName(functionName: string) {
    setFunctionNames((current) => current.filter((item) => item !== functionName));
  }

  async function save() {
    if (!name.trim()) {
      toast("Informe o nome.");
      return;
    }

    try {
      const response = await fetch("/api/departments/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "update",
          departmentId: dept.id,
          data: {
            name,
            description: desc,
            icon,
            color,
            function_names: functionNames,
            leader_ids: leaderIds,
            co_leader_ids: coLeaderIds,
          },
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        console.error("Erro ao salvar ministério:", payload);
        toast(payload?.error || "Erro ao salvar ministério.");
        return;
      }

      toast("Ministério atualizado!");
      await onSaved();
    } catch (error) {
      console.error("Erro ao salvar ministério:", error);
      toast("Erro ao salvar ministério.");
    }
  }

  const eligibleLeaders = members.filter((m) => m.role === "admin" || m.role === "leader");

  return (
    <Modal
      title="Editar ministério"
      close={onClose}
      width={520}
      footer={
        <>
          <button onClick={onClose} className="btn btn-secondary">
            Cancelar
          </button>
          <button onClick={save} className="btn btn-primary">
            Salvar
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="input-label">Nome</label>
          <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div>
          <label className="input-label">Descrição</label>
          <textarea className="input-field min-h-[60px]" value={desc} onChange={(e) => setDesc(e.target.value)} />
        </div>

        <div>
          <label className="input-label">Ícone</label>
          <div className="flex flex-wrap gap-2">
            {ICONS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setIcon(item)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg border-2 transition-all ${
                  icon === item ? "border-brand bg-brand-light" : "border-border-soft"
                }`}
              >
                {getIconEmoji(item)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="input-label">Cor</label>
          <input type="color" className="input-field h-10 p-1 cursor-pointer" value={color} onChange={(e) => setColor(e.target.value)} />
        </div>

        <div>
          <label className="input-label">Funções do ministério</label>
          <div className="rounded-[14px] border border-border-soft bg-surface-alt/50 p-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                className="input-field flex-1"
                value={newFunctionName}
                onChange={(e) => setNewFunctionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addFunctionName();
                  }
                }}
                placeholder="Ex: Câmera, Fotografia, Projeção..."
              />
              <button type="button" onClick={addFunctionName} className="btn btn-secondary sm:self-start">
                Adicionar função
              </button>
            </div>

            {functionNames.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {functionNames.map((functionName) => (
                  <button
                    key={functionName}
                    type="button"
                    onClick={() => removeFunctionName(functionName)}
                    className="badge badge-secondary"
                    title="Remover função"
                  >
                    {functionName} ×
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-3 text-xs text-ink-faint">
                Cadastre as funções principais deste ministério para reaproveitar depois nos membros e nas escalas.
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="input-label">Líderes</label>
          <div className="space-y-1.5">
            {eligibleLeaders.map((member) => (
              <label
                key={member.id}
                className={`flex items-center gap-3 px-3 py-2 rounded-[10px] cursor-pointer transition-all border-[1.5px] ${
                  leaderIds.includes(member.id)
                    ? "border-brand bg-brand-light"
                    : "border-border-soft hover:border-ink-ghost"
                }`}
              >
                <input
                  type="checkbox"
                  checked={leaderIds.includes(member.id)}
                  onChange={() => toggleList(leaderIds, setLeaderIds, member.id)}
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center text-[10px] font-bold ${
                    leaderIds.includes(member.id) ? "bg-brand border-brand text-white" : "border-border"
                  }`}
                >
                  {leaderIds.includes(member.id) ? "\u2713" : ""}
                </div>
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0"
                  style={{ background: member.avatar_color }}
                >
                  {getInitials(member.name)}
                </div>
                <span className="text-sm font-medium">{member.name}</span>
                <span className="text-[10px] text-ink-faint ml-auto">
                  {member.role === "admin" ? "Admin" : "Líder"}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="input-label">Co-líderes (opcional)</label>
          <div className="space-y-1.5">
            {members
              .filter((member) => !leaderIds.includes(member.id))
              .map((member) => (
                <label
                  key={member.id}
                  className={`flex items-center gap-3 px-3 py-2 rounded-[10px] cursor-pointer transition-all border-[1.5px] ${
                    coLeaderIds.includes(member.id)
                      ? "border-info bg-info-light"
                      : "border-border-soft hover:border-ink-ghost"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={coLeaderIds.includes(member.id)}
                    onChange={() => toggleList(coLeaderIds, setCoLeaderIds, member.id)}
                    className="sr-only"
                  />
                  <div
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center text-[10px] font-bold ${
                      coLeaderIds.includes(member.id) ? "bg-info border-info text-white" : "border-border"
                    }`}
                  >
                    {coLeaderIds.includes(member.id) ? "\u2713" : ""}
                  </div>
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0"
                    style={{ background: member.avatar_color }}
                  >
                    {getInitials(member.name)}
                  </div>
                  <span className="text-sm font-medium">{member.name}</span>
                </label>
              ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
