"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/hooks/use-app";
import { supabase } from "@/lib/supabase/client";
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

export default function MembrosPage() {
  const { user, church, toast, canDo, departments } = useApp();

  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [members, setMembers] = useState<User[]>([]);
  const [allDM, setAllDM] = useState<DepartmentMember[]>([]);
  const [latestInvites, setLatestInvites] = useState<Record<string, MemberInvitation>>({});
  const [loading, setLoading] = useState(true);
  const [resendingId, setResendingId] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);

    const visibleDepartmentIds = departments.map((dept) => dept.id);

    const { data: usersData, error: usersError } = await supabase
      .from("users")
      .select("*")
      .eq("church_id", user.church_id)
      .eq("active", true);

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

    return result;
  }, [members, allDM, search, deptFilter]);

  async function removeMember(m: User) {
    if (!confirm(`Remover ${m.name}?`)) return;

    try {
      const response = await fetch("/api/members/deactivate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetUserId: m.id,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        console.error("Erro ao remover membro:", data);
        toast(data?.error || "Erro ao remover membro.");
        return;
      }

      toast(m.name + " removido.");
      await loadData();
    } catch (error) {
      console.error("Erro ao remover membro:", error);
      toast("Erro ao remover membro.");
    }
  }

  async function resendInvite(member: User) {
    setResendingId(member.id);

    try {
      const response = await fetch("/api/member-invitations/resend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: member.id,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        console.error("Erro ao reenviar convite:", data);
        toast("Não foi possível reenviar o convite.");
        return;
      }

      const emailSent = data?.email?.status === "sent";
      const whatsappSent = data?.whatsapp?.status === "sent";

      if (emailSent || whatsappSent) {
        toast(`Convite reenviado para ${member.name}.`);
      } else {
        toast("O convite foi recriado, mas os envios falharam.");
      }

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

        {(search || deptFilter !== "all") && (
          <button
            onClick={() => {
              setSearch("");
              setDeptFilter("all");
            }}
            className="btn btn-ghost btn-sm text-ink-faint"
          >
            Limpar filtros
          </button>
        )}
      </div>

      <div className="card">
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

            const func = mDepts[0]?.function_name || "";
            const spouse = m.spouse_id ? members.find((s) => s.id === m.spouse_id) : null;
            const latestInvite = latestInvites[m.id];
            const inviteBadge = getInviteBadge(latestInvite);

            const roleCls =
              m.role === "admin"
                ? "bg-purple-50 text-purple-600"
                : m.role === "leader"
                ? "bg-brand-light text-brand"
                : "bg-success-light text-success";

            return (
              <div
                key={m.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3.5 px-5 py-3 border-t border-border-soft first:border-t-0 hover:bg-brand-glow transition-colors group"
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
                      {func}
                      {deptNames.length ? " · " + deptNames.join(", ") : ""}
                      {" · "}
                      {m.email}
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-2">
                    <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${roleCls}`}>
                      {m.role === "admin" ? "Admin" : m.role === "leader" ? "Líder" : "Membro"}
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

                  {canDo("member.invite") && m.must_change_password && (
                    <button
                      onClick={() => resendInvite(m)}
                      disabled={resendingId === m.id}
                      className="btn btn-secondary btn-sm"
                    >
                      {resendingId === m.id ? "Reenviando..." : "Reenviar convite"}
                    </button>
                  )}

                  {canDo("member.remove") && m.id !== user.id && (
                    <button
                      onClick={() => removeMember(m)}
                      className="btn btn-ghost btn-sm text-danger opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                    >
                      &#10005;
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
