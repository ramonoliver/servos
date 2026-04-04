"use client";

import { useMemo, useState, useEffect } from "react";
import { useApp } from "@/hooks/use-app";
import { supabase } from "@/lib/supabase/client";
import { getInitials, getIconEmoji, genId } from "@/lib/utils/helpers";
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
      toast("Erro ao carregar dados do ministerio.");
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

  async function addMemberToDept(userId: string, funcName: string) {
    if (!dept) return;

    const { error } = await supabase.from("department_members").insert({
      id: genId(),
      department_id: dept.id,
      user_id: userId,
      function_name: funcName,
      joined_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Erro ao adicionar membro:", error);
      toast("Erro ao adicionar membro ao ministerio.");
      return;
    }

    toast("Membro adicionado ao ministerio!");
    setShowAddMember(false);
    await loadData();
  }

  async function removeMemberFromDept(dmId: string, memberName: string) {
    if (!confirm(`Remover ${memberName} deste ministerio?`)) return;

    const { error } = await supabase
      .from("department_members")
      .delete()
      .eq("id", dmId);

    if (error) {
      console.error("Erro ao remover membro:", error);
      toast("Erro ao remover membro do ministerio.");
      return;
    }

    toast(memberName + " removido do ministerio.");
    await loadData();
  }

  if (!dept) {
    return <div className="py-20 text-center text-ink-faint">Ministerio nao encontrado.</div>;
  }

  if (loading) {
    return <div className="py-20 text-center text-ink-faint">Carregando ministerio...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="card p-6 flex items-start justify-between gap-5">
        <div className="flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm"
            style={{ background: dept.color + "22", color: dept.color }}
          >
            {getIconEmoji(dept.icon)}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="page-title mb-0">{dept.name}</h1>
              {!dept.active && (
                <span className="text-[10px] font-semibold bg-danger-light text-danger px-2 py-0.5 rounded-full">
                  Inativo
                </span>
              )}
            </div>

            <p className="text-sm text-ink-muted mb-3">{dept.description || "Sem descricao."}</p>

            <div className="flex flex-wrap gap-2">
              {leaders.length > 0 && (
                <span className="badge badge-brand">
                  Lider: {(leaders as User[]).map((m) => m.name.split(" ")[0]).join(", ")}
                </span>
              )}
              {coLeaders.length > 0 && (
                <span className="badge badge-secondary">
                  Co-lider: {(coLeaders as User[]).map((m) => m.name.split(" ")[0]).join(", ")}
                </span>
              )}
              <span className="badge badge-secondary">{dms.length} membros</span>
            </div>
          </div>
        </div>

        {canDo("member.edit", dept.id) && (
          <button onClick={() => setShowAddMember(true)} className="btn btn-primary">
            + Adicionar membro
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-[1.2fr_.8fr] gap-6">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Membros do ministerio</h2>
          </div>

          {dms.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-ink-faint">
              Nenhum membro neste ministerio.
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
                        {dm.function_name || "Sem funcao"} · {member.email}
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
            <h2 className="card-title">Proximas escalas</h2>
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
          onClose={() => setShowAddMember(false)}
          onSave={addMemberToDept}
        />
      )}
    </div>
  );
}

function AddMemberModal({
  availableToAdd,
  onClose,
  onSave,
}: {
  availableToAdd: User[];
  onClose: () => void;
  onSave: (userId: string, funcName: string) => void;
}) {
  const [userId, setUserId] = useState("");
  const [funcName, setFuncName] = useState("");

  return (
    <Modal
      title="Adicionar membro"
      close={onClose}
      width={460}
      footer={
        <>
          <button onClick={onClose} className="btn btn-secondary">
            Cancelar
          </button>
          <button
            onClick={() => onSave(userId, funcName)}
            disabled={!userId}
            className="btn btn-primary"
          >
            Adicionar
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="input-label">Membro</label>
          <select className="input-field" value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">Selecione</option>
            {availableToAdd.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="input-label">Funcao</label>
          <input
            className="input-field"
            value={funcName}
            onChange={(e) => setFuncName(e.target.value)}
            placeholder="Ex: Vocal, Camera, Recepcao..."
          />
        </div>
      </div>
    </Modal>
  );
}