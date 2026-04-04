"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/hooks/use-app";
import { supabase } from "@/lib/supabase/client";
import { getInitials, genId } from "@/lib/utils/helpers";
import type { Message, User } from "@/types";

export default function MensagensPage() {
  const { user, toast, departments } = useApp();

  const [selectedDept, setSelectedDept] = useState(departments[0]?.id || "");
  const [newMsg, setNewMsg] = useState("");
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  async function loadData() {
    setLoading(true);

    const [
      { data: messagesData, error: messagesError },
      { data: usersData, error: usersError },
    ] = await Promise.all([
      supabase.from("messages").select("*").order("created_at", { ascending: true }),
      supabase.from("users").select("*").eq("church_id", user.church_id),
    ]);

    if (messagesError || usersError) {
      console.error({ messagesError, usersError });
      toast("Erro ao carregar mensagens.");
      setLoading(false);
      return;
    }

    setAllMessages((messagesData || []) as Message[]);
    setMembers((usersData || []) as User[]);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [user.church_id]);

  useEffect(() => {
    if (!selectedDept && departments.length > 0) {
      setSelectedDept(departments[0].id);
    }
  }, [departments, selectedDept]);

  const messages = useMemo(() => {
    return allMessages.filter((m) => m.department_id === selectedDept);
  }, [allMessages, selectedDept]);

  async function send() {
    if (!newMsg.trim() || !selectedDept) return;

    setSending(true);

    const { error } = await supabase.from("messages").insert({
      id: genId(),
      department_id: selectedDept,
      sender_id: user.id,
      content: newMsg.trim(),
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Erro ao enviar mensagem:", error);
      toast("Erro ao enviar mensagem.");
      setSending(false);
      return;
    }

    setNewMsg("");
    toast("Enviada!");
    setSending(false);
    await loadData();
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="page-title">Mensagens</h1>
        <p className="page-subtitle">Chat por ministerio</p>
      </div>

      <div className="flex gap-1 mb-5 bg-surface-alt rounded-[10px] p-0.5 w-fit flex-wrap">
        {departments.map((d) => (
          <button
            key={d.id}
            onClick={() => setSelectedDept(d.id)}
            className={`px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
              selectedDept === d.id
                ? "bg-surface text-ink font-semibold shadow-sm"
                : "text-ink-muted"
            }`}
          >
            {d.name}
          </button>
        ))}
      </div>

      <div className="card flex flex-col" style={{ minHeight: 440 }}>
        <div className="flex-1 p-5 space-y-3 overflow-y-auto">
          {loading ? (
            <div className="text-center py-16 text-ink-faint text-sm">Carregando mensagens...</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-16 text-ink-faint text-sm">Nenhuma mensagem.</div>
          ) : (
            messages.map((m) => {
              const sender = members.find((u) => u.id === m.sender_id);
              const isMe = m.sender_id === user.id;

              return (
                <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[70%] flex gap-2 ${isMe ? "flex-row-reverse" : ""} items-end`}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                      style={{ background: sender?.avatar_color || "#999" }}
                    >
                      {getInitials(sender?.name || "?")}
                    </div>

                    <div
                      className={`px-3.5 py-2.5 rounded-2xl text-[13px] leading-snug ${
                        isMe
                          ? "bg-brand text-white rounded-br-sm"
                          : "bg-surface-alt text-ink rounded-bl-sm"
                      }`}
                    >
                      {!isMe && (
                        <div className="text-[10px] font-semibold opacity-70 mb-0.5">
                          {sender?.name?.split(" ")[0]}
                        </div>
                      )}

                      {m.content}

                      <div className="text-[9px] opacity-50 mt-1 text-right">
                        {new Date(m.created_at).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="px-5 py-3 border-t border-border-soft flex gap-2">
          <input
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Digite sua mensagem..."
            className="input-field flex-1 !rounded-full"
          />
          <button onClick={send} disabled={sending || !selectedDept} className="btn btn-primary">
            {sending ? "..." : "Enviar"}
          </button>
        </div>
      </div>
    </div>
  );
}