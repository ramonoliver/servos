"use client";
import { useState } from "react";
import { useApp } from "@/hooks/use-app";
import { getDB } from "@/lib/db/local-db";
import { getInitials } from "@/lib/utils/helpers";
import type { Message, User } from "@/types";

export default function MensagensPage() {
  const { user, toast, departments } = useApp();
  const db = getDB();
  const [selectedDept, setSelectedDept] = useState(departments[0]?.id || "");
  const [newMsg, setNewMsg] = useState("");
  const messages = db.getAll<Message>("messages").filter(m => m.department_id === selectedDept).sort((a, b) => (a.created_at || "").localeCompare(b.created_at || ""));
  const members = db.getWhere<User>("users", { church_id: user.church_id });
  function send() {
    if (!newMsg.trim()) return;
    db.insert("messages", { department_id: selectedDept, sender_id: user.id, content: newMsg.trim() });
    setNewMsg("");
    toast("Enviada!");
    location.href = "/mensagens";
  }
  return (
    <div>
      <div className="mb-6"><h1 className="page-title">Mensagens</h1><p className="page-subtitle">Chat por ministerio</p></div>
      <div className="flex gap-1 mb-5 bg-surface-alt rounded-[10px] p-0.5 w-fit">
        {departments.map(d => <button key={d.id} onClick={() => setSelectedDept(d.id)} className={`px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all ${selectedDept === d.id ? "bg-surface text-ink font-semibold shadow-sm" : "text-ink-muted"}`}>{d.name}</button>)}
      </div>
      <div className="card flex flex-col" style={{ minHeight: 440 }}>
        <div className="flex-1 p-5 space-y-3 overflow-y-auto">
          {messages.length === 0 && <div className="text-center py-16 text-ink-faint text-sm">Nenhuma mensagem.</div>}
          {messages.map(m => {
            const sender = members.find(u => u.id === m.sender_id);
            const isMe = m.sender_id === user.id;
            return (
              <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] flex gap-2 ${isMe ? "flex-row-reverse" : ""} items-end`}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0" style={{ background: sender?.avatar_color || "#999" }}>{getInitials(sender?.name || "?")}</div>
                  <div className={`px-3.5 py-2.5 rounded-2xl text-[13px] leading-snug ${isMe ? "bg-brand text-white rounded-br-sm" : "bg-surface-alt text-ink rounded-bl-sm"}`}>
                    {!isMe && <div className="text-[10px] font-semibold opacity-70 mb-0.5">{sender?.name?.split(" ")[0]}</div>}
                    {m.content}
                    <div className="text-[9px] opacity-50 mt-1 text-right">{new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="px-5 py-3 border-t border-border-soft flex gap-2">
          <input value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Digite sua mensagem..." className="input-field flex-1 !rounded-full" />
          <button onClick={send} className="btn btn-primary">Enviar</button>
        </div>
      </div>
    </div>
  );
}
