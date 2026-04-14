"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/hooks/use-app";
import { Avatar, Skeleton } from "@/components/ui";

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

export default function RankingPage() {
  const { toast } = useApp();
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const authToken = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("servos_session") || "null")?.token : null;
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
    } catch (error) {
      console.error("Erro ao carregar ranking:", error);
      setError("Erro ao carregar ranking.");
      toast("Erro ao carregar ranking.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="max-w-[1000px] mx-auto">
      <div className="mb-6">
        <h1 className="page-title">Ranking Mensal</h1>
        <p className="page-subtitle">Reconhecimento por progresso e compromisso. Veja o seu lugar na igreja e no ministério.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <div className="card p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-faint mb-2">Top 3</div>
          <div className="space-y-3">
            {loading ? (
              <>
                <Skeleton className="h-[72px] rounded-[14px]" />
                <Skeleton className="h-[72px] rounded-[14px]" />
                <Skeleton className="h-[72px] rounded-[14px]" />
              </>
            ) : (
              ranking.slice(0, 3).map((item) => (
              <div key={item.user_id} className="flex items-center gap-3 p-3 rounded-[14px] bg-surface-alt border border-border-soft">
                <Avatar name={item.name} color={item.avatar_color} photoUrl={item.photo_url} size={48} className="rounded-2xl" />
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{item.name}</div>
                  <div className="text-[11px] text-ink-faint">#{item.rank} • {item.points} pts</div>
                </div>
                <span className="text-[13px] font-bold text-brand">{item.rank === 1 ? "🥇" : item.rank === 2 ? "🥈" : "🥉"}</span>
              </div>
              ))
            )}
          </div>
        </div>

        <div className="card p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-faint mb-2">Destaque da semana</div>
          {loading ? (
            <Skeleton className="h-[120px] rounded-[14px]" />
          ) : ranking.length > 0 ? (
            <div className="rounded-[14px] border border-ink-faint/10 p-5 bg-white">
              <div className="text-sm font-semibold">{ranking[0].name}</div>
              <div className="mt-1 text-sm text-ink-faint">{ranking[0].points} pontos</div>
              <div className="mt-3 text-xs text-ink-faint">Posição atual #{ranking[0].rank}</div>
            </div>
          ) : (
            <div className="text-sm text-ink-faint">Nenhum dado de ranking disponível ainda.</div>
          )}
        </div>

        <div className="card p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-faint mb-2">Engajamento</div>
          <div className="space-y-3 text-sm text-ink-soft">
            <p>Os pontos vêm de presença, confirmação e apoio ao time.</p>
            <p>Desempates são por mais serviços e menos faltas.</p>
            <p>O ranking é reiniciado a cada mês — todo esforço conta.</p>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="grid grid-cols-[64px_minmax(0,1fr)_120px_96px_96px] gap-4 p-4 text-[11px] uppercase tracking-[0.18em] text-ink-faint border-b border-border-soft">
          <div>#</div>
          <div>Nome</div>
          <div>Pontos</div>
          <div>Serviços</div>
          <div>Faltas</div>
        </div>
        {loading ? (
          <div className="p-6 text-center text-ink-faint">Carregando ranking...</div>
        ) : error ? (
          <div className="p-6 text-center text-ink-faint">
            <p className="mb-3">{error}</p>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => void load()}>
              Tentar novamente
            </button>
          </div>
        ) : ranking.length === 0 ? (
          <div className="p-6 text-center text-ink-faint">Nenhum ranking disponível para este mês.</div>
        ) : (
          ranking.map((item) => (
            <div key={item.user_id} className="grid grid-cols-[64px_minmax(0,1fr)_120px_96px_96px] gap-4 items-center px-4 py-4 border-b border-border-soft last:border-b-0 hover:bg-surface-alt transition-colors">
              <div className="font-display text-sm text-ink">#{item.rank}</div>
              <div className="flex items-center gap-3 min-w-0">
                <Avatar name={item.name} color={item.avatar_color} photoUrl={item.photo_url} size={36} />
                <div className="min-w-0">
                  <div className="font-medium truncate">{item.name}</div>
                  {item.movement !== null && (
                    <div className="text-[11px] text-ink-faint">{item.movement > 0 ? `+${item.movement} posições` : item.movement < 0 ? `${item.movement} posições` : "sem mudança"}</div>
                  )}
                </div>
              </div>
              <div className="text-sm font-semibold text-ink">{item.points}</div>
              <div className="text-sm text-ink-faint">{item.services}</div>
              <div className="text-sm text-ink-faint">{item.absences}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
