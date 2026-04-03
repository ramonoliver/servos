"use client";
import { useApp } from "@/hooks/use-app";
import { getDB } from "@/lib/db/local-db";
import Link from "next/link";
import type { Notification } from "@/types";

export default function NotificacoesPage() {
  const { user, toast } = useApp();
  const db = getDB();
  const notifications = db.getWhere<Notification>("notifications", { user_id: user.id }).sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
  function markAllRead() { notifications.forEach(n => db.update("notifications", n.id, { read: true })); toast("Marcadas como lidas."); location.href = "/notificacoes"; }
  function markRead(id: string) { db.update("notifications", id, { read: true }); }
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title">Notificacoes</h1>
        {notifications.some(n => !n.read) && <button onClick={markAllRead} className="btn btn-secondary btn-sm">Marcar todas como lidas</button>}
      </div>
      {notifications.length === 0 ? <div className="card px-5 py-16 text-center"><div className="text-4xl mb-3 opacity-40">&#128276;</div><p className="text-sm text-ink-muted">Nenhuma notificacao.</p></div> : (
        <div className="space-y-2">
          {notifications.map(n => (
            <Link key={n.id} href={n.action_url || "#"} onClick={() => markRead(n.id)} className={`block card p-4 transition-colors ${!n.read ? "border-brand/20 bg-brand-glow" : ""}`}>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-4 h-4 rounded bg-gradient-to-br from-brand to-brand-deep flex-shrink-0" />
                <span className="text-[10px] font-bold text-ink-faint uppercase tracking-wide">Servos</span>
                {!n.read && <span className="w-2 h-2 rounded-full bg-brand" />}
                <span className="text-[10px] text-ink-faint ml-auto">{new Date(n.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <div className="text-[13px] font-semibold mb-0.5">{n.title}</div>
              <div className="text-xs text-ink-muted leading-relaxed">{n.body}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
