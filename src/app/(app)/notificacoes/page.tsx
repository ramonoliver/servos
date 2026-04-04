"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/hooks/use-app";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";
import type { Notification } from "@/types";

export default function NotificacoesPage() {
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
      toast("Erro ao carregar notificacoes.");
      setLoading(false);
      return;
    }

    setNotifications((data || []) as Notification[]);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [user.id]);

  const hasUnread = useMemo(
    () => notifications.some((n) => !n.read),
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

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .in("id", unreadIds);

    if (error) {
      console.error("Erro ao marcar todas como lidas:", error);
      toast("Erro ao marcar notificacoes.");
      setMarkingAll(false);
      return;
    }

    toast("Marcadas como lidas.");
    setMarkingAll(false);
    await loadData();
  }

  async function markRead(id: string, alreadyRead: boolean) {
    if (alreadyRead) return;

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id);

    if (error) {
      console.error("Erro ao marcar notificação como lida:", error);
      return;
    }

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title">Notificacoes</h1>

        {hasUnread && (
          <button
            onClick={markAllRead}
            disabled={markingAll}
            className="btn btn-secondary btn-sm"
          >
            {markingAll ? "Marcando..." : "Marcar todas como lidas"}
          </button>
        )}
      </div>

      {loading ? (
        <div className="card px-5 py-16 text-center">
          <div className="text-4xl mb-3 opacity-40">&#128276;</div>
          <p className="text-sm text-ink-muted">Carregando notificacoes...</p>
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
                <span className="text-[10px] text-ink-faint ml-auto">
                  {new Date(n.created_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
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