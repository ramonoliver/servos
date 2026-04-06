"use client";

import { useState, useRef, useEffect } from "react";
import { useApp } from "@/hooks/use-app";
import { supabase } from "@/lib/supabase/client";
import { suggestSubstitute } from "@/lib/ai/engine";
import { formatDate, getDayOfWeek, getInitials, getIconEmoji, genId } from "@/lib/utils/helpers";
import { Modal } from "@/components/ui";
import Link from "next/link";
import type {
  Schedule,
  ScheduleMember,
  Event,
  User,
  DepartmentMember,
  UnavailableDate,
} from "@/types";

type ScheduleChat = {
  id: string;
  schedule_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

function isChatInfrastructureError(errorMessage?: string | null) {
  if (!errorMessage) return false;
  const normalized = errorMessage.toLowerCase();
  return normalized.includes("schedule_chats") || normalized.includes("relation");
}

export default function EscalaDetailPage({ params }: { params: { id: string } }) {
  const { user, toast, canDo, departments } = useApp();

  const [showAddMember, setShowAddMember] = useState(false);
  const [activeTab, setActiveTab] = useState<"escalados" | "chat">("escalados");
  const [groupByFunction, setGroupByFunction] = useState(true);
  const [chatMsg, setChatMsg] = useState("");
  const [loading, setLoading] = useState(true);

  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [ev, setEv] = useState<Event | null>(null);
  const [sm, setSm] = useState<ScheduleMember[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [deptMembers, setDeptMembers] = useState<DepartmentMember[]>([]);
  const [allUD, setAllUD] = useState<UnavailableDate[]>([]);
  const [allSchedules, setAllSchedules] = useState<Schedule[]>([]);
  const [allSM, setAllSM] = useState<ScheduleMember[]>([]);
  const [chatMessages, setChatMessages] = useState<ScheduleChat[]>([]);
  const [chatAvailable, setChatAvailable] = useState(true);
  const [sendingChat, setSendingChat] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  async function loadData() {
    setLoading(true);

    const { data: scheduleData, error: scheduleError } = await supabase
      .from("schedules")
      .select("*")
      .eq("id", params.id)
      .maybeSingle();

    if (scheduleError || !scheduleData) {
      console.error("Erro ao carregar escala:", scheduleError);
      setLoading(false);
      return;
    }

    const [
      { data: eventData, error: eventError },
      { data: smData, error: smError },
      { data: usersData, error: usersError },
      { data: deptMembersData, error: deptMembersError },
      { data: unavailableData, error: unavailableError },
      { data: allSchedulesData, error: allSchedulesError },
      { data: allSMData, error: allSMError },
    ] = await Promise.all([
      supabase.from("events").select("*").eq("id", scheduleData.event_id).maybeSingle(),
      supabase.from("schedule_members").select("*").eq("schedule_id", scheduleData.id),
      supabase.from("users").select("*").eq("church_id", user.church_id).eq("active", true),
      supabase.from("department_members").select("*").eq("department_id", scheduleData.department_id),
      supabase.from("unavailable_dates").select("*"),
      supabase.from("schedules").select("*"),
      supabase.from("schedule_members").select("*"),
    ]);

    if (
      eventError ||
      smError ||
      usersError ||
      deptMembersError ||
      unavailableError ||
      allSchedulesError ||
      allSMError
    ) {
      console.error({
        eventError,
        smError,
        usersError,
        deptMembersError,
        unavailableError,
        allSchedulesError,
        allSMError,
      });
      toast("Erro ao carregar detalhes da escala.");
      setLoading(false);
      return;
    }

    setSchedule(scheduleData as Schedule);
    setEv((eventData || null) as Event | null);
    setSm((smData || []) as ScheduleMember[]);
    setMembers((usersData || []) as User[]);
    setDeptMembers((deptMembersData || []) as DepartmentMember[]);
    setAllUD((unavailableData || []) as UnavailableDate[]);
    setAllSchedules((allSchedulesData || []) as Schedule[]);
    setAllSM((allSMData || []) as ScheduleMember[]);
    try {
      const response = await fetch(
        `/api/schedule-chats?scheduleId=${encodeURIComponent(scheduleData.id)}&churchId=${encodeURIComponent(user.church_id)}`
      );
      const payload = (await response.json().catch(() => null)) as
        | { messages?: ScheduleChat[]; error?: string }
        | null;

      if (!response.ok) {
        console.error("Erro ao carregar chat da escala:", payload || response.statusText);
        setChatAvailable(false);
        setChatMessages([]);
        if (!isChatInfrastructureError(payload?.error)) {
          toast("Nao foi possivel carregar o chat desta escala.");
        }
      } else {
        setChatAvailable(true);
        setChatMessages(payload?.messages || []);
      }
    } catch (error) {
      console.error("Erro ao carregar chat da escala:", error);
      setChatAvailable(false);
      setChatMessages([]);
      toast("Nao foi possivel carregar o chat desta escala.");
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [params.id, user.church_id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, activeTab]);

  if (loading) {
    return <div className="py-20 text-center text-ink-faint">Carregando escala...</div>;
  }

  if (!schedule) {
    return <div className="py-20 text-center text-ink-faint">Escala nao encontrada.</div>;
  }

  const dept = departments.find((d) => d.id === schedule.department_id);

  const confirmed = sm.filter((m) => m.status === "confirmed").length;
  const pending = sm.filter((m) => m.status === "pending");
  const declined = sm.filter((m) => m.status === "declined");
  const allOk = confirmed === sm.length && sm.length > 0;
  const dow = getDayOfWeek(schedule.date);
  const avgSchedules = members.length
    ? members.reduce((a, m) => a + m.total_schedules, 0) / members.length
    : 0;

  const scheduledUserIds = sm.map((s) => s.user_id);

  const availableToAdd = deptMembers
    .filter((dm) => !scheduledUserIds.includes(dm.user_id))
    .map((dm) => {
      const m = members.find((u) => u.id === dm.user_id);
      return m ? { ...m, function_name: dm.function_name } : null;
    })
    .filter(Boolean) as (User & { function_name: string })[];

  const byFunction: Record<string, ScheduleMember[]> = {};
  sm.forEach((item) => {
    const fn = item.function_name || "Sem função";
    if (!byFunction[fn]) byFunction[fn] = [];
    byFunction[fn].push(item);
  });

  async function addMemberToSchedule(userId: string) {
    const dm = deptMembers.find((d) => d.user_id === userId);

    const { error } = await supabase.from("schedule_members").insert({
      id: genId(),
      schedule_id: schedule.id,
      user_id: userId,
      function_name: dm?.function_name || "",
      status: "pending",
      decline_reason: "",
      substitute_id: null,
      substitute_for: null,
      is_reserve: false,
      responded_at: null,
      notified_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Erro ao adicionar membro à escala:", error);
      toast("Erro ao adicionar membro.");
      return;
    }

    toast("Membro adicionado a escala!");
    setShowAddMember(false);
    await loadData();
  }

  async function removeMemberFromSchedule(smItem: ScheduleMember) {
    const m = members.find((u) => u.id === smItem.user_id);
    if (!confirm(`Remover ${m?.name || "este membro"} da escala?`)) return;

    const { error } = await supabase
      .from("schedule_members")
      .delete()
      .eq("id", smItem.id);

    if (error) {
      console.error("Erro ao remover membro:", error);
      toast("Erro ao remover membro da escala.");
      return;
    }

    toast((m?.name || "Membro") + " removido da escala.");
    await loadData();
  }

  async function acceptSubstitute(declinedSM: ScheduleMember, substituteId: string) {
    const sub = members.find((m) => m.id === substituteId);
    if (!sub) return;

    const dm = deptMembers.find((d) => d.user_id === substituteId);

    const { error: insertError } = await supabase.from("schedule_members").insert({
      id: genId(),
      schedule_id: schedule.id,
      user_id: substituteId,
      function_name: dm?.function_name || declinedSM.function_name,
      status: "pending",
      decline_reason: "",
      substitute_id: null,
      substitute_for: declinedSM.user_id,
      is_reserve: false,
      responded_at: null,
      notified_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error("Erro ao adicionar substituto:", insertError);
      toast("Erro ao adicionar substituto.");
      return;
    }

    const { error: updateError } = await supabase
      .from("schedule_members")
      .update({ substitute_id: substituteId })
      .eq("id", declinedSM.id);

    if (updateError) {
      console.error("Erro ao marcar substituição:", updateError);
      toast("Erro ao registrar substituição.");
      return;
    }

    toast(`${sub.name} adicionado como substituto!`);
    await loadData();
  }

  async function sendChat() {
    const text = chatMsg.trim();
    if (!text || !chatAvailable || sendingChat) return;

    setSendingChat(true);

    try {
      const response = await fetch("/api/schedule-chats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scheduleId: schedule.id,
          churchId: user.church_id,
          senderId: user.id,
          content: text,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        console.error("Erro ao enviar mensagem:", payload || response.statusText);
        if (isChatInfrastructureError(payload?.error)) {
          setChatAvailable(false);
          toast("O chat desta escala ainda nao foi habilitado no banco.");
        } else {
          toast("Erro ao enviar mensagem no chat.");
        }
        setSendingChat(false);
        return;
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      if (error instanceof Error && isChatInfrastructureError(error.message)) {
        setChatAvailable(false);
        toast("O chat desta escala ainda nao foi habilitado no banco.");
      } else {
        toast("Erro ao enviar mensagem no chat.");
      }
      setSendingChat(false);
      return;
    }

    setChatMsg("");
    setSendingChat(false);
    await loadData();
  }

  function MemberRow({ item, showFn = true }: { item: ScheduleMember; showFn?: boolean }) {
    const m = members.find((u) => u.id === item.user_id);
    if (!m) return null;

    const spouse = m.spouse_id ? members.find((u) => u.id === m.spouse_id) : null;
    const isDeclined = item.status === "declined";

    let substitute = null;

    if (isDeclined && !item.substitute_id && canDo("schedule.edit")) {
      substitute = suggestSubstitute(
        members,
        deptMembers,
        item.user_id,
        item.function_name,
        {
          date: schedule.date,
          dayOfWeek: dow,
          deptMemberIds: deptMembers.map((dm) => dm.user_id),
          unavailableDates: allUD,
          existingSchedules: allSchedules,
          existingScheduleMembers: allSM,
          avgSchedules,
        },
        scheduledUserIds
      );
    }

    return (
      <div>
        <div className="flex items-center gap-3.5 px-5 py-3 border-t border-border-soft group">
          {m.photo_url ? (
            <img src={m.photo_url} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ background: m.avatar_color }}
            >
              {getInitials(m.name)}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{m.name}</div>
            {showFn && !groupByFunction && (
              <div className="text-[11px] text-ink-faint">{item.function_name}</div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {spouse && (
              <span className="text-[9px] font-semibold text-brand bg-brand-light px-1.5 py-0.5 rounded-full hidden sm:inline">
                &#128145; {spouse.name.split(" ")[0]}
              </span>
            )}

            <span
              className={`badge ${
                item.status === "confirmed"
                  ? "badge-green"
                  : item.status === "pending"
                  ? "badge-amber"
                  : "badge-red"
              }`}
            >
              {item.status === "confirmed"
                ? "✓ Confirmou"
                : item.status === "pending"
                ? "⏳ Pendente"
                : "✕ Recusou"}
            </span>

            {canDo("schedule.edit") && (
              <button
                onClick={() => removeMemberFromSchedule(item)}
                className="btn btn-ghost btn-sm text-danger opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                title="Remover"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {isDeclined && item.decline_reason && (
          <div className="px-5 pb-2">
            <div className="text-xs text-ink-faint italic ml-[52px]">
              Motivo: &quot;{item.decline_reason}&quot;
            </div>
          </div>
        )}

        {substitute && (
          <div className="mx-5 mb-3 flex items-center gap-3 p-3 bg-brand-glow border border-brand-light rounded-[10px]">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
              style={{ background: substitute.user.avatar_color }}
            >
              {getInitials(substitute.user.name)}
            </div>

            <div className="flex-1">
              <div className="text-[10px] font-bold text-brand uppercase tracking-wider">
                🤖 Substituto sugerido
              </div>
              <div className="text-[13px] font-semibold">{substitute.user.name}</div>
              <div className="text-[10px] text-ink-muted">
                {substitute.user.total_schedules} escalas · {substitute.user.confirm_rate}% confirmação
              </div>
            </div>

            <button onClick={() => acceptSubstitute(item, substitute.user.id)} className="btn btn-brand btn-sm">
              Aceitar
            </button>
          </div>
        )}

        {isDeclined &&
          item.substitute_id &&
          (() => {
            const sub = members.find((u) => u.id === item.substitute_id);
            return sub ? (
              <div className="mx-5 mb-3 text-xs text-success font-medium ml-[52px]">
                Substituído por {sub.name}
              </div>
            ) : null;
          })()}
      </div>
    );
  }

  return (
    <div className="max-w-[720px] mx-auto">
      <Link href="/escalas" className="inline-flex items-center gap-1.5 text-[13px] text-brand font-medium mb-5 hover:underline">
        &larr; Escalas
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2">
            {ev && getIconEmoji(ev.icon)} {ev?.name || "Escala"}
          </h1>
          <p className="page-subtitle">
            {formatDate(schedule.date)} · {schedule.time} · {dept?.name}
          </p>

          {schedule.arrival_time && (
            <p className="text-xs text-ink-faint mt-1">Chegada: {schedule.arrival_time}</p>
          )}

          <div className="flex flex-wrap gap-2 mt-3">
            <span className="badge badge-green">{confirmed} confirmados</span>
            {pending.length > 0 && <span className="badge badge-amber">{pending.length} pendentes</span>}
            {declined.length > 0 && <span className="badge badge-red">{declined.length} recusaram</span>}
            {!schedule.published && <span className="badge badge-info">Rascunho</span>}
          </div>
        </div>

        {canDo("schedule.edit") && (
          <button onClick={() => setShowAddMember(true)} className="btn btn-primary btn-sm self-start">
            + Adicionar membro
          </button>
        )}
      </div>

      {allOk && (
        <div className="flex items-center gap-3 px-5 py-3.5 bg-success-light rounded-[14px] border border-success/10 mb-5">
          <span className="text-lg">🎉</span>
          <span className="text-[13px] text-success font-medium">Todos confirmados!</span>
        </div>
      )}

      {pending.length > 0 && canDo("schedule.edit") && (
        <div className="flex items-center gap-3 px-5 py-3.5 bg-amber-light rounded-[14px] border border-amber/10 mb-5">
          <span className="text-lg">🔔</span>
          <span className="text-[13px] text-ink-soft flex-1">
            <strong>{pending.length}</strong> pendentes.
          </span>
          <button
            onClick={async () => {
              try {
                const response = await fetch("/api/send-schedule-reminders", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ scheduleId: schedule.id }),
                });

                const data = await response.json().catch(() => null);

                if (!response.ok) {
                  console.error("Erro ao enviar lembretes:", data || response.statusText);
                  toast("Erro ao enviar lembrete.");
                  return;
                }

                const sentCount = data?.sentCount || 0;
                toast(
                  sentCount > 0
                    ? `Lembrete enviado para ${sentCount} membro(s)!`
                    : "Nenhum lembrete enviado."
                );
              } catch (error) {
                console.error("Erro ao enviar lembretes:", error);
                toast("Erro ao enviar lembrete.");
              }
            }}
            className="text-xs font-semibold text-brand hover:underline"
          >
            Lembrar &rarr;
          </button>
        </div>
      )}

      {schedule.instructions && (
        <div className="bg-surface-alt rounded-[14px] px-5 py-4 mb-5">
          <div className="text-xs font-bold text-ink-faint uppercase tracking-wider mb-1">Instruções</div>
          <div className="text-sm text-ink-soft">{schedule.instructions}</div>
        </div>
      )}

      <div className="flex gap-1 mb-4 bg-surface-alt rounded-[10px] p-0.5 w-fit">
        {(["escalados", "chat"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all capitalize ${
              activeTab === tab ? "bg-surface text-ink font-semibold shadow-sm" : "text-ink-muted"
            }`}
          >
            {tab === "escalados"
              ? `Escalados (${sm.length})`
              : `💬 Chat ${chatMessages.length > 0 ? `(${chatMessages.length})` : ""}`}
          </button>
        ))}

        {activeTab === "escalados" && (
          <button
            onClick={() => setGroupByFunction((g) => !g)}
            className="ml-2 px-3 py-1.5 rounded-lg text-[12px] font-medium text-ink-muted hover:text-ink transition-colors"
          >
            {groupByFunction ? "🔀 Lista" : "📋 Funções"}
          </button>
        )}
      </div>

      {activeTab === "escalados" && (
        <div className="card mb-5">
          {sm.length === 0 ? (
            <div className="px-5 py-16 text-center text-sm text-ink-faint">Nenhum membro escalado.</div>
          ) : groupByFunction ? (
            Object.entries(byFunction).map(([fn, items]) => (
              <div key={fn}>
                <div className="px-5 py-2 bg-surface-alt border-t border-border-soft first:border-t-0">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-ink-faint">{fn}</span>
                  <span className="text-[10px] text-ink-ghost ml-2">({items.length})</span>
                </div>
                {items.map((item) => (
                  <MemberRow key={item.id} item={item} showFn={false} />
                ))}
              </div>
            ))
          ) : (
            sm.map((item) => <MemberRow key={item.id} item={item} showFn={true} />)
          )}
        </div>
      )}

      {activeTab === "chat" && (
        <div className="card mb-5 flex flex-col" style={{ minHeight: 320 }}>
          <div className="px-5 pt-4 pb-3 border-b border-border-soft">
            <span className="font-display text-[15px]">Chat da escala</span>
            <p className="text-[11px] text-ink-faint mt-0.5">Visível apenas para escalados e líderes</p>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3" style={{ maxHeight: 360 }}>
            {!chatAvailable ? (
              <div className="text-center text-sm text-ink-faint py-8">
                O chat desta escala ainda nao esta habilitado neste ambiente. Aplique o script <code>sql/communications.sql</code> no Supabase.
              </div>
            ) : chatMessages.length === 0 ? (
              <div className="text-center text-sm text-ink-faint py-8">Nenhuma mensagem. Seja o primeiro!</div>
            ) : (
              chatMessages.map((msg) => {
                const sender = members.find((u) => u.id === msg.sender_id);
                const isMe = msg.sender_id === user.id;

                return (
                  <div key={msg.id} className={`flex gap-2.5 ${isMe ? "flex-row-reverse" : ""}`}>
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                      style={{ background: sender?.avatar_color || "#999" }}
                    >
                      {getInitials(sender?.name || "?")}
                    </div>

                    <div className={`max-w-[72%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                      {!isMe && <span className="text-[10px] text-ink-faint font-medium">{sender?.name?.split(" ")[0]}</span>}

                      <div
                        className={`text-[13px] px-3.5 py-2 rounded-[12px] leading-snug ${
                          isMe ? "bg-brand text-white rounded-tr-[4px]" : "bg-surface-alt text-ink rounded-tl-[4px]"
                        }`}
                      >
                        {msg.content}
                      </div>

                      <span className="text-[10px] text-ink-ghost">
                        {new Date(msg.created_at).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}

            <div ref={chatEndRef} />
          </div>

          <div className="px-4 py-3 border-t border-border-soft flex gap-2">
            <input
              value={chatMsg}
              onChange={(e) => setChatMsg(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendChat();
                }
              }}
              placeholder="Mensagem para a equipe..."
              className="input-field flex-1 py-2"
              maxLength={500}
              disabled={!chatAvailable || sendingChat}
            />

            <button
              onClick={sendChat}
              disabled={!chatMsg.trim() || !chatAvailable || sendingChat}
              className="btn btn-primary px-4 py-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {showAddMember && (
        <Modal title="Adicionar Membro a Escala" close={() => setShowAddMember(false)} width={460}>
          {availableToAdd.length === 0 ? (
            <div className="text-sm text-ink-faint text-center py-8">
              Todos os membros do ministério já estão escalados.
            </div>
          ) : (
            <div className="space-y-1.5">
              <p className="text-sm text-ink-muted mb-3">
                Selecione um membro do ministério {dept?.name}:
              </p>

              {availableToAdd.map((m) => (
                <button
                  key={m.id}
                  onClick={() => addMemberToSchedule(m.id)}
                  className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-[10px] border-[1.5px] border-border-soft hover:border-brand hover:bg-brand-glow transition-all text-left"
                >
                  {m.photo_url ? (
                    <img src={m.photo_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                      style={{ background: m.avatar_color }}
                    >
                      {getInitials(m.name)}
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="text-sm font-medium">{m.name}</div>
                    <div className="text-[11px] text-ink-faint">{m.function_name}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
