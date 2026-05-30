"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/hooks/use-app";
import { Avatar, Skeleton, PageHeader } from "@/components/ui";

type RankingItem = {
  rank: number;
  user_id: string;
  name: string;
  avatar_color: string;
  photo_url: string | null;
  points: number;
  services: number;
  absences: number;
  movement: number | null;
};

const MEDAL = ["🥇", "🥈", "🥉"];

const PODIUM_STYLES = [
  // #2 — silver, left
  { border: "border-slate-200", bg: "bg-slate-50", text: "text-slate-500", pad: "pt-6 pb-5" },
  // #1 — gold, center (taller)
  { border: "border-amber-200", bg: "bg-amber-50", text: "text-amber-500", pad: "pt-8 pb-6" },
  // #3 — bronze, right
  { border: "border-orange-200", bg: "bg-orange-50", text: "text-orange-400", pad: "pt-6 pb-5" },
];

// Podium order: 2nd, 1st, 3rd
const PODIUM_ORDER = [1, 0, 2];

function MovementBadge({ movement }: { movement: number | null }) {
  if (movement === null) return null;
  if (movement === 0) return <span className="text-[10px] text-ink-ghost">—</span>;
  const up = movement > 0;
  return (
    <span className={`text-[10px] font-semibold ${up ? "text-success" : "text-danger"}`}>
      {up ? "▲" : "▼"} {Math.abs(movement)}
    </span>
  );
}

export default function RankingPage() {
  const { toast } = useApp();
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const authToken = typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("servos_session") || "null")?.token
        : null;
      const response = await fetch("/api/ranking/monthly", {
        credentials: "include",
        headers: authToken ? { "x-servos-auth": authToken } : undefined,
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) {
        const message = data?.error || "Não foi possível carregar o ranking.";
        setError(message);
        toast(message);
        return;
      }
      setRanking(data.ranking || []);
    } catch (err) {
      console.error("Erro ao carregar ranking:", err);
      setError("Erro ao carregar ranking.");
      toast("Erro ao carregar ranking.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const top3 = ranking.slice(0, 3);
  const rest = ranking.slice(3);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <PageHeader
        eyebrow="Comunidade"
        title="Ranking do Mês"
        subtitle="Presença, confirmação e apoio ao time geram pontos. Ranking reinicia todo mês."
      />

      {/* Podium */}
      <div className="flex items-end gap-3">
        {loading ? (
          <>
            <Skeleton className="flex-1 h-36 rounded-2xl" />
            <Skeleton className="flex-1 h-44 rounded-2xl" />
            <Skeleton className="flex-1 h-36 rounded-2xl" />
          </>
        ) : top3.length === 0 ? null : (
          PODIUM_ORDER.map((idx) => {
            const item = top3[idx];
            if (!item) return <div key={idx} className="flex-1" />;
            const style = PODIUM_STYLES[idx];
            return (
              <div
                key={item.user_id}
                className={`flex-1 flex flex-col items-center text-center rounded-2xl border ${style.border} ${style.bg} ${style.pad} px-3 transition-all`}
              >
                <div className="text-2xl mb-2">{MEDAL[item.rank - 1]}</div>
                <Avatar
                  name={item.name}
                  color={item.avatar_color}
                  photoUrl={item.photo_url}
                  size={idx === 0 ? 52 : 44}
                  className="mb-2"
                />
                <div className="text-[13px] font-semibold text-ink leading-tight truncate w-full">
                  {item.name.split(" ")[0]}
                </div>
                <div className={`text-[12px] font-bold mt-1 ${style.text}`}>
                  {item.points} pts
                </div>
                <div className="text-[10px] text-ink-ghost mt-0.5">
                  {item.services} serv · {item.absences} faltas
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Full table */}
      {!loading && !error && ranking.length > 0 && (
        <div className="bg-white border border-border-soft rounded-2xl overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[40px_1fr_72px_56px_56px] gap-2 px-4 py-2.5 border-b border-border-soft bg-surface-alt">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-ghost">#</div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-ghost">Nome</div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-ghost text-right">Pontos</div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-ghost text-center">Serv.</div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-ghost text-center">Falt.</div>
          </div>

          {/* Rows */}
          {ranking.map((item) => {
            const isTop3 = item.rank <= 3;
            return (
              <div
                key={item.user_id}
                className={`grid grid-cols-[40px_1fr_72px_56px_56px] gap-2 items-center px-4 py-3 border-b border-border-soft last:border-b-0 transition-colors hover:bg-surface-alt/60 ${
                  isTop3 ? "bg-surface-alt/30" : ""
                }`}
              >
                {/* Rank */}
                <div className="flex flex-col items-start gap-0.5">
                  <span className={`text-[13px] font-bold leading-none ${
                    item.rank === 1 ? "text-amber-500" :
                    item.rank === 2 ? "text-slate-400" :
                    item.rank === 3 ? "text-orange-400" :
                    "text-ink-faint"
                  }`}>
                    {item.rank <= 3 ? MEDAL[item.rank - 1] : `#${item.rank}`}
                  </span>
                  <MovementBadge movement={item.movement} />
                </div>

                {/* Name + avatar */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar
                    name={item.name}
                    color={item.avatar_color}
                    photoUrl={item.photo_url}
                    size={32}
                  />
                  <span className="text-[13px] font-medium text-ink truncate">{item.name}</span>
                </div>

                {/* Points */}
                <div className="text-[13px] font-bold text-ink text-right">{item.points}</div>

                {/* Services */}
                <div className="text-[12px] text-ink-faint text-center">{item.services}</div>

                {/* Absences */}
                <div className={`text-[12px] text-center font-medium ${item.absences > 0 ? "text-danger" : "text-ink-ghost"}`}>
                  {item.absences}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Loading state for table */}
      {loading && (
        <div className="bg-white border border-border-soft rounded-2xl overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="px-4 py-3 border-b border-border-soft last:border-b-0">
              <Skeleton className="h-8 rounded-lg" />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="bg-white border border-border-soft rounded-2xl p-8 text-center">
          <p className="text-sm text-ink-faint mb-3">{error}</p>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => void load()}>
            Tentar novamente
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && ranking.length === 0 && (
        <div className="bg-white border border-border-soft rounded-2xl p-10 text-center">
          <p className="text-2xl mb-2 opacity-30">🏆</p>
          <p className="text-sm text-ink-faint">Nenhum dado de ranking disponível este mês.</p>
        </div>
      )}
    </div>
  );
}
