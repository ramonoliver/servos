"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/hooks/use-app";
import { formatInviteDate, formatInviteOpenedAt } from "@/lib/invitations";
import { supabase } from "@/lib/supabase/client";
import { getInitials, formatShortDate } from "@/lib/utils/helpers";
import { MemberEditModal } from "@/components/shared/member-edit-modal";
import { AvailabilityGrid } from "@/components/ui";
import Link from "next/link";
import type {
  User,
  DepartmentMember,
  Schedule,
  ScheduleMember,
  Event,
  MemberInvitation,
} from "@/types";

type SelectedDepartment = {
  department_id: string;
  function_name: string;
};

export default function MembroDetailPage({ params }: { params: { id: string } }) {
  const { user, church, departments, canDo, toast } = useApp();
  const router = useRouter();

  const [showEdit, setShowEdit] = useState(false);
  const [member, setMember] = useState<User | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [dms, setDms] = useState<DepartmentMember[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [allSM, setAllSM] = useState<ScheduleMember[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [latestInvite, setLatestInvite] = useState<MemberInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [resendingInvite, setResendingInvite] = useState(false);

  async function loadData() {
    setLoading(true);

    const [
      { data: memberData, error: memberError },
      { data: membersData, error: membersError },
      { data: dmsData, error: dmsError },
      { data: schedulesData, error: schedulesError },
      { data: smData, error: smError },
      { data: eventsData, error: eventsError },
      { data: inviteData, error: inviteError },
    ] = await Promise.all([
      supabase.from("users").select("*").eq("id", params.id).maybeSingle(),
      supabase.from("users").select("*").eq("church_id", user.church_id),
      supabase.from("department_members").select("*").eq("user_id", params.id),
      supabase.from("schedules").select("*").eq("church_id", user.church_id),
      supabase.from("schedule_members").select("*").eq("user_id", params.id),
      supabase.from("events").select("*").eq("church_id", user.church_id),
      supabase
        .from("member_invitations")
        .select("*")
        .eq("user_id", params.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (memberError || membersError || dmsError || schedulesError || smError || eventsError) {
      console.error({
        memberError,
        membersError,
        dmsError,
        schedulesError,
        smError,
        eventsError,
        inviteError,
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
    setLatestInvite((inviteData || null) as MemberInvitation | null);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [params.id, user.church_id]);

  if (loading) {
    return <div className="py-20 text-center text-ink-faint">Carregando membro...</div>;
  }

  if (!member) {
    return <div className="py-20 text-center text-ink-faint">Membro não encontrado.</div>;
  }

  const spouse = member.spouse_id ? members.find((m) => m.id === member.spouse_id) : null;
  const roleCls =
    member.role === "admin"
      ? "bg-purple-50 text-purple-600"
      : member.role === "leader"
      ? "bg-brand-light text-brand"
      : "bg-success-light text-success";

  const inviteTimeline = latestInvite
    ? [
        {
          label: "Convite enviado",
          value: formatInviteDate(latestInvite.sent_at || latestInvite.created_at),
          tone: "text-ink",
        },
        {
          label: "Email",
          value:
            latestInvite.email_status === "sent"
              ? "Entregue"
              : latestInvite.email_status === "failed"
              ? "Falhou"
              : "Pendente",
          tone:
            latestInvite.email_status === "sent"
              ? "text-success"
              : latestInvite.email_status === "failed"
              ? "text-danger"
              : "text-amber",
        },
        {
          label: "WhatsApp",
          value:
            latestInvite.whatsapp_status === "sent"
              ? "Entregue"
              : latestInvite.whatsapp_status === "failed"
              ? "Falhou"
              : latestInvite.whatsapp_status === "skipped"
              ? "Não configurado"
              : "Pendente",
          tone:
            latestInvite.whatsapp_status === "sent"
              ? "text-success"
              : latestInvite.whatsapp_status === "failed"
              ? "text-danger"
              : latestInvite.whatsapp_status === "skipped"
              ? "text-amber"
              : "text-ink",
        },
        {
          label: "Abertura do email",
          value: latestInvite.opened_at
            ? `${formatInviteOpenedAt(latestInvite.opened_at)} (${latestInvite.open_count}x)`
            : "Ainda não abriu",
          tone: latestInvite.opened_at ? "text-success" : "text-ink",
        },
      ]
    : [];

  async function resendInvite() {
    setResendingInvite(true);

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

      toast(`Convite reenviado para ${member.name}.`);
      await loadData();
    } catch (error) {
      console.error("Erro ao reenviar convite:", error);
      toast("Não foi possível reenviar o convite.");
    } finally {
      setResendingInvite(false);
    }
  }

  async function removeMember() {
    if (!member || !canDo("member.remove") || member.id === user.id) return;
    const confirmed = window.confirm(
      user.role === "admin"
        ? `Excluir ${member.name} permanentemente e apagar os dados relacionados?`
        : `Remover ${member.name} da igreja?`
    );
    if (!confirmed) return;

    try {
      const response = await fetch("/api/members/deactivate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: member.id,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        toast(data?.error || "Não foi possível remover este membro.");
        return;
      }

      toast(user.role === "admin" ? "Usuario excluido com sucesso." : "Membro removido com sucesso.");
      router.push("/membros");
    } catch (error) {
      console.error("Erro ao remover membro:", error);
      toast("Não foi possível remover este membro.");
    }
  }

  return (
    <div>
      <Link href="/membros" className="inline-flex items-center gap-1.5 text-[13px] text-brand font-medium mb-5 hover:underline">
        &larr; Membros
      </Link>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 mb-2">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold"
              style={{ background: member.avatar_color }}
            >
              {getInitials(member.name)}
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="page-title break-words">{member.name}</h1>
              <p className="page-subtitle break-all">{member.email}</p>

              <div className="flex gap-2 mt-2 flex-wrap">
                <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${roleCls}`}>
                  {member.role === "admin" ? "Administrador" : member.role === "leader" ? "Líder" : "Membro"}
                </span>

                {spouse && (
                  <span className="text-[10px] font-semibold text-brand bg-brand-light px-2 py-0.5 rounded-full">
                    &#128145; {spouse.name}
                  </span>
                )}

                {member.must_change_password && <span className="badge badge-amber">Senha temporária</span>}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:ml-auto sm:self-start">
              {canDo("member.edit") && (
                <button onClick={() => setShowEdit(true)} className="btn btn-secondary btn-sm">
                  &#9998; Editar
                </button>
              )}
              {canDo("member.remove") && member.id !== user.id && (
                <button onClick={removeMember} className="btn btn-danger btn-sm">
                  Excluir usuario
                </button>
              )}
            </div>
          </div>

          <div className="card p-5">
            <div className="font-display text-lg mb-3">Disponibilidade</div>
            <AvailabilityGrid availability={member.availability || []} />
          </div>

          <div className="card">
            <div className="px-5 pt-4 pb-3">
              <span className="font-display text-[17px]">Histórico de Escalas</span>
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
            <div className="font-display text-lg mb-3">Informações</div>

            <div className="space-y-2 text-sm">
              {[
                ["Telefone", member.phone || "-"],
                ["Escalas", String(member.total_schedules)],
                ["Confirmação", member.confirm_rate + "%"],
                ["Status", member.status],
                ["Desde", member.joined_at?.split("T")[0] || "-"],
              ].map(([l, v], i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-4 py-1.5 border-t border-border-soft first:border-t-0">
                  <span className="text-ink-muted">{l}</span>
                  <span className="font-medium text-right break-words">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {member.must_change_password && (
            <div className="card p-5">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-3">
                <div>
                  <div className="font-display text-lg">Acesso e convite</div>
                  <p className="text-sm text-ink-muted">
                    Acompanhe o último envio e o progresso de abertura.
                  </p>
                </div>

                {canDo("member.invite") && (
                  <button
                    onClick={resendInvite}
                    disabled={resendingInvite}
                    className="btn btn-secondary btn-sm"
                  >
                    {resendingInvite ? "Reenviando..." : "Reenviar convite"}
                  </button>
                )}
              </div>

              {latestInvite ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-xl bg-surface-alt px-4 py-3">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">
                        Último envio
                      </div>
                      <div className="text-sm font-medium mt-1">
                        {formatInviteDate(latestInvite.sent_at || latestInvite.created_at)}
                      </div>
                    </div>
                    <div className="rounded-xl bg-surface-alt px-4 py-3">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">
                        Aberturas
                      </div>
                      <div className="text-sm font-medium mt-1">
                        {latestInvite.open_count} {latestInvite.open_count === 1 ? "abertura" : "aberturas"}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {inviteTimeline.map((item) => (
                      <div key={item.label} className="flex gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-brand mt-1.5 shrink-0" />
                        <div className="flex-1 border-b border-border-soft pb-3 last:border-b-0 last:pb-0">
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                            {item.label}
                          </div>
                          <div className={`text-sm font-medium mt-0.5 break-words ${item.tone}`}>{item.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {(latestInvite.email_error || latestInvite.whatsapp_error) && (
                  <div className="rounded-xl border border-amber/20 bg-amber-light px-4 py-3 text-xs text-amber break-words">
                      {latestInvite.email_error && <div>Email: {latestInvite.email_error}</div>}
                      {latestInvite.whatsapp_error && <div>WhatsApp: {latestInvite.whatsapp_error}</div>}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-ink-faint">
                  Nenhum histórico de convite encontrado.
                </div>
              )}
            </div>
          )}

          <div className="card p-5">
            <div className="font-display text-lg mb-3">Ministérios</div>

            {dms.length === 0 ? (
              <p className="text-sm text-ink-faint">Nenhum ministério.</p>
            ) : (
              dms.map((dm) => {
                const d = departments.find((dep) => dep.id === dm.department_id);
                return d ? (
                  <div key={dm.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-3 py-1.5">
                    <span className="text-sm font-medium break-words">{d.name}</span>
                    <span className="text-xs text-ink-faint text-left sm:text-right break-words">{dm.function_name}</span>
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
            try {
              const response = await fetch("/api/members/update", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  memberId: member.id,
                  updates,
                  selectedDepartments,
                  spouseId,
                }),
              });

              const data = await response.json().catch(() => null);

              if (!response.ok) {
                console.error("Erro ao atualizar membro:", data);
                toast(data?.error || "Erro ao atualizar membro.");
                return;
              }

              toast("Membro atualizado!");
              setShowEdit(false);
              await loadData();
            } catch (error) {
              console.error("Erro ao atualizar membro:", error);
              toast("Erro ao atualizar membro.");
            }
          }}
        />
      )}
    </div>
  );
}
