"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/hooks/use-app";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";
import type { Notification } from "@/types";

export default function NotificaçõesPage() {
  const { user, toast } = useApp();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  async function loadData() {
    setLoading(true);

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar notificações:", error);
      toast("Erro ao carregar notificações.");
      setLoading(false);
      return;
    }

    setNotifications((data || []) as Notification[]);
    setLoading(false);
  }

  useEffect(() => {
    loadData();

    const interval = setInterval(() => {
      void loadData();
    }, 12000);

    return () => clearInterval(interval);
  }, [user.id]);

  const hasUnread = useMemo(
    () => notifications.some((n) => !n.read),
    [notifications]
  );
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  async function markAllRead() {
    if (!hasUnread) return;

    setMarkingAll(true);

    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);

    if (unreadIds.length === 0) {
      setMarkingAll(false);
      return;
    }

    try {
      const response = await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notificationIds: unreadIds,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        console.error("Erro ao marcar todas como lidas:", data);
        toast(data?.error || "Erro ao marcar notificações.");
        setMarkingAll(false);
        return;
      }

      toast("Marcadas como lidas.");
      setMarkingAll(false);
      await loadData();
    } catch (error) {
      console.error("Erro ao marcar todas como lidas:", error);
      toast("Erro ao marcar notificações.");
      setMarkingAll(false);
    }
  }

  async function markRead(id: string, alreadyRead: boolean) {
    if (alreadyRead) return;

    try {
      const response = await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notificationIds: [id],
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        console.error("Erro ao marcar notificação como lida:", data);
        return;
      }

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <h1 className="page-title">Notificações</h1>
          {unreadCount > 0 && <span className="badge badge-red">{unreadCount}</span>}
        </div>

        {hasUnread && (
          <button
            onClick={markAllRead}
            disabled={markingAll}
            className="btn btn-secondary btn-sm self-start sm:self-auto"
          >
            {markingAll ? "Marcando..." : "Marcar todas como lidas"}
          </button>
        )}
      </div>

      {loading ? (
        <div className="card px-5 py-16 text-center">
          <div className="text-4xl mb-3 opacity-40">&#128276;</div>
          <p className="text-sm text-ink-muted">Carregando notificações...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="card px-5 py-16 text-center">
          <div className="text-4xl mb-3 opacity-40">&#128276;</div>
          <p className="text-sm text-ink-muted">Nenhuma notificacao.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Link
              key={n.id}
              href={n.action_url || "#"}
              onClick={() => markRead(n.id, n.read)}
              className={`block card p-4 transition-colors ${
                !n.read ? "border-brand/20 bg-brand-glow" : ""
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-4 h-4 rounded bg-gradient-to-br from-brand to-brand-deep flex-shrink-0" />
                <span className="text-[10px] font-bold text-ink-faint uppercase tracking-wide">
                  Servos
                </span>
                {!n.read && <span className="w-2 h-2 rounded-full bg-brand" />}
                <span className="text-[10px] text-ink-faint ml-auto text-right shrink-0">
                  {new Date(n.created_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <div className="text-[13px] font-semibold mb-0.5 break-words">{n.title}</div>
              <div className="text-xs text-ink-muted leading-relaxed break-words">{n.body}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
