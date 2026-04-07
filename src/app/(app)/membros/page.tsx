"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "@/hooks/use-app";
import { supabase } from "@/lib/supabase/client";
import { getSession } from "@/lib/auth/session";
import { formatInviteOpenedAt } from "@/lib/invitations";
import { getInitials } from "@/lib/utils/helpers";
import Link from "next/link";
import type { User, DepartmentMember, MemberInvitation } from "@/types";

function getLatestInvitesMap(invites: MemberInvitation[]) {
  return invites.reduce<Record<string, MemberInvitation>>((acc, invite) => {
    if (!acc[invite.user_id]) {
      acc[invite.user_id] = invite;
    }
    return acc;
  }, {});
}

function getInviteBadge(invite?: MemberInvitation) {
  if (!invite) {
    return null;
  }

  if (invite.opened_at) {
    return {
      label: `Email aberto ${formatInviteOpenedAt(invite.opened_at)}`,
      cls: "bg-success-light text-success",
    };
  }

  if (invite.email_status === "failed") {
    return {
      label: "Email falhou",
      cls: "bg-danger-light text-danger",
    };
  }

  return {
    label: "Email enviado",
    cls: "bg-amber-light text-amber",
  };
}

function parseResponsePayload(raw: string) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return { error: raw };
  }
}

export default function MembrosPage() {
  const { user, church, toast, canDo, departments } = useApp();

  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive" | "all">("active");
  const [members, setMembers] = useState<User[]>([]);
  const [allDM, setAllDM] = useState<DepartmentMember[]>([]);
  const [latestInvites, setLatestInvites] = useState<Record<string, MemberInvitation>>({});
  const [loading, setLoading] = useState(true);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [openActionsFor, setOpenActionsFor] = useState<string | null>(null);
  const actionsMenuRef = useRef<HTMLDivElement | null>(null);

  async function loadData() {
    setLoading(true);

    const visibleDepartmentIds = departments.map((dept) => dept.id);

    const usersQuery = supabase
      .from("users")
      .select("*")
      .eq("church_id", user.church_id);

    if (user.role !== "admin") {
      usersQuery.eq("active", true);
    }

    const { data: usersData, error: usersError } = await usersQuery;

    const { data: dmData, error: dmError } = visibleDepartmentIds.length
      ? await supabase
          .from("department_members")
          .select("*")
          .in("department_id", visibleDepartmentIds)
      : { data: [], error: null };

    const { data: inviteData, error: inviteError } = await supabase
      .from("member_invitations")
      .select("*")
      .eq("church_id", user.church_id)
      .order("created_at", { ascending: false });

    if (usersError) {
      console.error("Erro ao buscar membros:", usersError);
      toast("Erro ao carregar membros.");
      setLoading(false);
      return;
    }

    if (dmError) {
      console.error("Erro ao buscar vínculos de departamentos:", dmError);
      toast("Erro ao carregar departamentos dos membros.");
      setLoading(false);
      return;
    }

    if (inviteError) {
      console.error("Erro ao buscar convites dos membros:", inviteError);
    }

    const departmentLinks = (dmData || []) as DepartmentMember[];
    const visibleUserIds =
      user.role === "admin"
        ? null
        : new Set([...departmentLinks.map((dm) => dm.user_id), user.id]);

    setMembers(
      ((usersData || []) as User[]).filter((member) =>
        visibleUserIds ? visibleUserIds.has(member.id) : true
      )
    );
    setAllDM(departmentLinks);
    setLatestInvites(getLatestInvitesMap((inviteData || []) as MemberInvitation[]));
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [user.church_id, departments.length]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!actionsMenuRef.current) return;
      if (!actionsMenuRef.current.contains(event.target as Node)) {
        setOpenActionsFor(null);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const filtered = useMemo(() => {
    let result = [...members];

    if (search) {
      const term = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(term) ||
          m.email.toLowerCase().includes(term)
      );
    }

    if (deptFilter !== "all") {
      const deptMemberIds = allDM
        .filter((dm) => dm.department_id === deptFilter)
        .map((dm) => dm.user_id);

      result = result.filter((m) => deptMemberIds.includes(m.id));
    }

    if (statusFilter !== "all") {
      result = result.filter((m) => (statusFilter === "active" ? m.active : !m.active));
    }

    return result;
  }, [members, allDM, search, deptFilter, statusFilter]);

  async function changeMemberState(
    m: User,
    action: "deactivate" | "reactivate" | "hard_delete"
  ) {
    const confirmationMessage =
      action === "reactivate"
        ? `Reativar ${m.name}?`
        : action === "hard_delete"
        ? `Excluir ${m.name} permanentemente e apagar os dados relacionados?`
        : `Desativar ${m.name}?`;

    if (!confirm(confirmationMessage)) return;

    try {
      const response = await fetch("/api/members/deactivate", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(getSession()?.token ? { "x-servos-auth": getSession()!.token! } : {}),
        },
        body: JSON.stringify({
          targetUserId: m.id,
          action,
        }),
      });

      const raw = await response.text();
      const data = parseResponsePayload(raw);

      if (!response.ok) {
        console.error("Erro ao atualizar membro:", data);
        if (
          (action === "reactivate" && data?.error === "Este membro ja esta ativo.") ||
          (action === "deactivate" && data?.error === "Este membro ja esta desativado.")
        ) {
          await loadData();
          setOpenActionsFor(null);
          toast(
            action === "reactivate"
              ? `${m.name} ja estava ativo. A lista foi sincronizada.`
              : `${m.name} ja estava desativado. A lista foi sincronizada.`
          );
          return;
        }
        toast(
          data?.error ||
            (action === "reactivate"
              ? "Erro ao reativar membro."
              : action === "hard_delete"
              ? "Erro ao excluir membro."
              : "Erro ao desativar membro.")
        );
        return;
      }

      toast(
        data?.warning ||
          (action === "reactivate"
            ? `${m.name} reativado.`
            : action === "hard_delete"
            ? `${m.name} excluido permanentemente.`
            : `${m.name} desativado.`)
      );
      setOpenActionsFor(null);
      await loadData();
    } catch (error) {
      console.error("Erro ao atualizar membro:", error);
      toast(
        action === "reactivate"
          ? "Erro ao reativar membro."
          : action === "hard_delete"
          ? "Erro ao excluir membro."
          : "Erro ao desativar membro."
      );
    }
  }

  async function resendInvite(member: User) {
    setResendingId(member.id);

    try {
      const response = await fetch("/api/member-invitations/resend", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(getSession()?.token ? { "x-servos-auth": getSession()!.token! } : {}),
        },
        body: JSON.stringify({
          userId: member.id,
        }),
      });

      const raw = await response.text();
      const data = parseResponsePayload(raw);

      if (!response.ok) {
        console.error("Erro ao reenviar convite:", data);
        toast("Não foi possível reenviar o convite.");
        return;
      }

      const emailSent = data?.email?.status === "sent";
      const smsSent = data?.sms?.status === "sent";

      if (emailSent || smsSent) {
        toast(`Convite reenviado para ${member.name}.`);
      } else {
        toast("O convite foi recriado, mas os envios falharam.");
      }

      setOpenActionsFor(null);
      await loadData();
    } catch (error) {
      console.error("Erro ao reenviar convite:", error);
      toast("Não foi possível reenviar o convite.");
    } finally {
      setResendingId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="page-title">Membros</h1>
          <p className="page-subtitle">{members.length} voluntarios</p>
        </div>

        {canDo("member.invite") && (
          <Link href="/membros/convidar" className="btn btn-primary self-start sm:self-auto">
            + Convidar
          </Link>
        )}
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-5">
        <input
          className="input-field w-full lg:max-w-[280px]"
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="input-field w-full lg:max-w-[220px]"
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
        >
          <option value="all">Todos os ministérios</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>

        {user.role === "admin" && (
          <select
            className="input-field w-full lg:max-w-[200px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "active" | "inactive" | "all")}
          >
            <option value="active">Somente ativos</option>
            <option value="inactive">Somente desativados</option>
            <option value="all">Todos</option>
          </select>
        )}

        {(search || deptFilter !== "all" || statusFilter !== "active") && (
          <button
            onClick={() => {
              setSearch("");
              setDeptFilter("all");
              setStatusFilter("active");
            }}
            className="btn btn-ghost btn-sm text-ink-faint"
          >
            Limpar filtros
          </button>
        )}
      </div>

      <div className="card overflow-visible">
        {loading ? (
          <div className="px-5 py-12 text-center text-sm text-ink-faint">
            Carregando membros...
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-ink-faint">
            Nenhum membro encontrado.
          </div>
        ) : (
          filtered.map((m) => {
            const mDepts = allDM.filter((dm) => dm.user_id === m.id);
            const deptNames = mDepts
              .map((dm) => departments.find((d) => d.id === dm.department_id)?.name)
              .filter(Boolean);

            const functionSummary = mDepts
              .flatMap((dm) => dm.function_names?.length ? dm.function_names : dm.function_name ? [dm.function_name] : [])
              .filter((value, index, array) => value && array.indexOf(value) === index)
              .join(", ");
            const spouse = m.spouse_id ? members.find((s) => s.id === m.spouse_id) : null;
            const latestInvite = latestInvites[m.id];
            const inviteBadge = getInviteBadge(latestInvite);

            const roleCls =
              m.role === "admin"
                ? "bg-purple-50 text-purple-600"
                : m.role === "leader"
                ? "bg-brand-light text-brand"
                : "bg-success-light text-success";
            const activityCls = m.active
              ? "bg-success-light text-success"
              : "bg-danger-light text-danger";

            return (
              <div
                key={m.id}
                className={`flex flex-col sm:flex-row sm:items-center gap-3.5 px-5 py-3 border-t border-border-soft first:border-t-0 transition-colors group ${
                  m.active ? "hover:bg-brand-glow" : "bg-slate-50/50"
                }`}
              >
                <Link href={`/membros/${m.id}`} className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                  {m.photo_url ? (
                    <img
                      src={m.photo_url}
                      alt=""
                      className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: m.avatar_color }}
                    >
                      {getInitials(m.name)}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium break-words sm:truncate">
                      {m.name}
                      {m.must_change_password ? " *" : ""}
                    </div>
                    <div className="text-[11px] text-ink-faint break-words leading-relaxed">
                      {functionSummary ? `${functionSummary} · ` : ""}
                      {deptNames.length ? deptNames.join(", ") + " · " : ""}
                      {m.email}
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-2">
                    <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${roleCls}`}>
                      {m.role === "admin" ? "Admin" : m.role === "leader" ? "Líder" : "Membro"}
                    </span>
                    <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${activityCls}`}>
                      {m.active ? "Ativo" : "Desativado"}
                    </span>

                    {spouse && (
                      <span className="text-[9px] font-semibold text-brand bg-brand-light px-1.5 py-0.5 rounded-full">
                        &#128145; {spouse.name.split(" ")[0]}
                      </span>
                    )}

                    {inviteBadge && (
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${inviteBadge.cls}`}>
                        {inviteBadge.label}
                      </span>
                    )}
                  </div>
                </Link>

                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <div className="flex sm:hidden flex-wrap items-center gap-2">
                    <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${roleCls}`}>
                      {m.role === "admin" ? "Admin" : m.role === "leader" ? "Líder" : "Membro"}
                    </span>
                    <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${activityCls}`}>
                      {m.active ? "Ativo" : "Desativado"}
                    </span>
                    {spouse && (
                      <span className="text-[9px] font-semibold text-brand bg-brand-light px-1.5 py-0.5 rounded-full">
                        &#128145; {spouse.name.split(" ")[0]}
                      </span>
                    )}
                    {inviteBadge && (
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${inviteBadge.cls}`}>
                        {inviteBadge.label}
                      </span>
                    )}
                  </div>

                  <div className="relative" ref={openActionsFor === m.id ? actionsMenuRef : null}>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setOpenActionsFor((current) => (current === m.id ? null : m.id));
                      }}
                      className="btn btn-ghost btn-sm"
                    >
                      Ações
                    </button>

                    {openActionsFor === m.id && (
                      <div className="absolute right-0 z-20 mt-2 min-w-[220px] rounded-2xl border border-border-soft bg-white shadow-lg p-2 flex flex-col gap-1">
                      {canDo("member.invite") && m.must_change_password && (
                        <button
                          onClick={() => resendInvite(m)}
                          disabled={resendingId === m.id}
                          className="w-full text-left rounded-xl px-3 py-2 text-sm hover:bg-brand-glow disabled:opacity-60"
                        >
                          {resendingId === m.id ? "Reenviando convite..." : "Reenviar convite"}
                        </button>
                      )}

                      {canDo("member.remove") && m.id !== user.id && m.active && (
                        <button
                          onClick={() => changeMemberState(m, "deactivate")}
                          className="w-full text-left rounded-xl px-3 py-2 text-sm text-amber-700 hover:bg-amber-light"
                        >
                          Desativar membro
                        </button>
                      )}

                      {canDo("member.remove") && m.id !== user.id && !m.active && (
                        <button
                          onClick={() => changeMemberState(m, "reactivate")}
                          className="w-full text-left rounded-xl px-3 py-2 text-sm text-success hover:bg-success-light"
                        >
                          Reativar membro
                        </button>
                      )}

                      {user.role === "admin" && canDo("member.remove") && m.id !== user.id && (
                        <button
                          onClick={() => changeMemberState(m, "hard_delete")}
                          className="w-full text-left rounded-xl px-3 py-2 text-sm text-danger hover:bg-danger-light"
                        >
                          Excluir permanentemente
                        </button>
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
  );
}
