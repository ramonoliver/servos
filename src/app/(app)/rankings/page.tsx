"use client";

import { useEffect, useMemo, useState } from "react";
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

function formatMonth(value: string) {
  if (!value) return "Este mês";
  const [year, month] = value.split("-").map(Number);
  if (!year || !month) return "Este mês";
  return new Date(year, month - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

function positionTone(rank: number) {
  if (rank === 1) return "border-brand/30 bg-brand-glow text-brand";
  if (rank === 2) return "border-info/20 bg-info-light text-info";
  if (rank === 3) return "border-amber/20 bg-amber-light text-amber";
  return "border-border-soft bg-surface-alt text-ink-muted";
}

function movementLabel(value: number | null) {
  if (value === null) return "Novo no ranking";
  if (value > 0) return `Subiu ${value}`;
  if (value < 0) return `Caiu ${Math.abs(value)}`;
  return "Estável";
}

function movementClass(value: number | null) {
  if (value === null) return "bg-info-light text-info";
  if (value > 0) return "bg-success-light text-success";
  if (value < 0) return "bg-danger-light text-danger";
  return "bg-surface-alt text-ink-muted";
}

export default function RankingPage() {
  const { user, toast } = useApp();
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [month, setMonth] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/ranking/monthly", {
        credentials: "include",
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) {
        const message = data?.error || "Não foi possível carregar o ranking.";
        setError(message);
        toast(message);
        return;
      }
      setRanking(data.ranking || []);
      setMonth(data.month || "");
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

  const topThree = ranking.slice(0, 3);
  const leader = topThree[0];
  const currentUserRank = useMemo(
    () => ranking.find((item) => item.user_id === user.id) || null,
    [ranking, user.id]
  );
  const totals = useMemo(
    () =>
      ranking.reduce(
        (acc, item) => ({
          points: acc.points + item.points,
          services: acc.services + item.services,
          absences: acc.absences + item.absences,
        }),
        { points: 0, services: 0, absences: 0 }
      ),
    [ranking]
  );
  const averagePoints = ranking.length ? Math.round(totals.points / ranking.length) : 0;

  return (
    <div className="mx-auto max-w-[1180px]">
      <div className="mb-6 rounded-[24px] border border-border-soft bg-[linear-gradient(135deg,rgba(244,83,42,0.10),rgba(255,255,255,0.96)_46%,rgba(234,243,237,0.72))] p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand">
              {formatMonth(month)}
            </div>
            <h1 className="page-title mb-2">Ranking Mensal</h1>
            <p className="page-subtitle">
              Reconhecimento por constância, confirmação e participação nas escalas da igreja.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => void load()} disabled={loading}>
              {loading ? "Atualizando..." : "Atualizar"}
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.8fr)]">
        <section className="card p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
                Pódio
              </div>
              <h2 className="font-display text-[20px] font-semibold text-ink">Top 3 do mês</h2>
            </div>
            {!loading && leader && (
              <span className="badge badge-brand">{leader.points} pts no topo</span>
            )}
          </div>

          {loading ? (
            <div className="grid gap-3 md:grid-cols-3 md:items-end">
              <Skeleton className="h-[156px] rounded-[18px] md:order-2 md:h-[190px]" />
              <Skeleton className="h-[144px] rounded-[18px] md:order-1" />
              <Skeleton className="h-[132px] rounded-[18px] md:order-3" />
            </div>
          ) : topThree.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-3 md:items-end">
              {topThree.map((item) => (
                <div
                  key={item.user_id}
                  className={`relative rounded-[18px] border p-4 ${
                    item.rank === 1
                      ? "md:order-2 border-brand/25 bg-[linear-gradient(180deg,rgba(255,240,236,0.86),rgba(255,255,255,0.98))] md:min-h-[196px]"
                      : item.rank === 2
                      ? "md:order-1 border-info/20 bg-info-light/65 md:min-h-[166px]"
                      : "md:order-3 border-amber/20 bg-amber-light/70 md:min-h-[150px]"
                  }`}
                >
                  <div className={`mb-4 inline-flex h-8 min-w-8 items-center justify-center rounded-full border px-2 text-xs font-bold ${positionTone(item.rank)}`}>
                    #{item.rank}
                  </div>
                  <div className="flex items-center gap-3 md:flex-col md:items-start">
                    <Avatar name={item.name} color={item.avatar_color} photoUrl={item.photo_url} size={item.rank === 1 ? 64 : 52} />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-ink">{item.name}</div>
                      <div className="mt-1 text-[12px] font-semibold text-brand">{item.points} pontos</div>
                      <div className="mt-1 text-[11px] text-ink-faint">
                        {item.services} serviços · {item.absences} faltas
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[18px] border border-dashed border-border bg-surface-alt/50 p-8 text-center text-sm text-ink-faint">
              Nenhum dado de ranking disponível ainda.
            </div>
          )}
        </section>

        <aside className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <div className="card p-5">
            <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
              Sua posição
            </div>
            {loading ? (
              <Skeleton className="h-[128px] rounded-[16px]" />
            ) : currentUserRank ? (
              <div className="rounded-[18px] border border-brand/15 bg-brand-glow p-4">
                <div className="flex items-center gap-3">
                  <Avatar
                    name={currentUserRank.name}
                    color={currentUserRank.avatar_color}
                    photoUrl={currentUserRank.photo_url}
                    size={52}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{currentUserRank.name}</div>
                    <div className="text-[12px] text-ink-faint">
                      #{currentUserRank.rank} de {ranking.length}
                    </div>
                  </div>
                  <div className="font-display text-[28px] font-bold text-brand">{currentUserRank.points}</div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-[12px] bg-white/75 px-2 py-2">
                    <div className="text-sm font-bold">{currentUserRank.services}</div>
                    <div className="text-[10px] text-ink-faint">Serviços</div>
                  </div>
                  <div className="rounded-[12px] bg-white/75 px-2 py-2">
                    <div className="text-sm font-bold">{currentUserRank.absences}</div>
                    <div className="text-[10px] text-ink-faint">Faltas</div>
                  </div>
                  <div className="rounded-[12px] bg-white/75 px-2 py-2">
                    <div className="text-sm font-bold">{movementLabel(currentUserRank.movement)}</div>
                    <div className="text-[10px] text-ink-faint">Movimento</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-[16px] border border-border-soft bg-surface-alt/60 p-4 text-sm text-ink-muted">
                Você ainda não entrou no ranking deste mês.
              </div>
            )}
          </div>

          <div className="card p-5">
            <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
              Panorama
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Metric label="Pessoas" value={ranking.length} loading={loading} />
              <Metric label="Serviços" value={totals.services} loading={loading} />
              <Metric label="Média pts" value={averagePoints} loading={loading} />
            </div>
            <div className="mt-4 rounded-[14px] border border-border-soft bg-surface-alt/60 px-4 py-3 text-xs leading-relaxed text-ink-muted">
              Pontos priorizam confirmação, presença e apoio ao time. Desempates consideram mais serviços e menos faltas.
            </div>
          </div>
        </aside>
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-border-soft bg-surface-alt/45 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
              Classificação completa
            </div>
            <div className="mt-1 text-sm text-ink-muted">
              {ranking.length ? `${ranking.length} participantes neste mês` : "Aguardando pontuação"}
            </div>
          </div>
        </div>

        <div className="hidden grid-cols-[72px_minmax(0,1fr)_112px_96px_96px_112px] gap-4 border-b border-border-soft px-4 py-3 text-[11px] uppercase tracking-[0.18em] text-ink-faint md:grid">
          <div>#</div>
          <div>Nome</div>
          <div>Pontos</div>
          <div>Serviços</div>
          <div>Faltas</div>
          <div>Movimento</div>
        </div>

        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-[70px] rounded-[14px]" />
            ))}
          </div>
        ) : error ? (
          <div className="p-6 text-center text-ink-faint">
            <p className="mb-3">{error}</p>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => void load()}>
              Tentar novamente
            </button>
          </div>
        ) : ranking.length === 0 ? (
          <div className="p-8 text-center text-sm text-ink-faint">Nenhum ranking disponível para este mês.</div>
        ) : (
          ranking.map((item) => (
            <div
              key={item.user_id}
              className={`border-b border-border-soft last:border-b-0 transition-colors hover:bg-surface-alt/70 ${
                item.user_id === user.id ? "bg-brand-glow/70" : ""
              }`}
            >
              <div className="hidden grid-cols-[72px_minmax(0,1fr)_112px_96px_96px_112px] items-center gap-4 px-4 py-4 md:grid">
                <div>
                  <span className={`inline-flex h-8 min-w-8 items-center justify-center rounded-full border px-2 text-xs font-bold ${positionTone(item.rank)}`}>
                    #{item.rank}
                  </span>
                </div>
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={item.name} color={item.avatar_color} photoUrl={item.photo_url} size={38} />
                  <div className="min-w-0">
                    <div className="truncate font-medium">{item.name}</div>
                    {item.user_id === user.id && <div className="text-[11px] font-semibold text-brand">Você</div>}
                  </div>
                </div>
                <div className="font-semibold text-ink">{item.points}</div>
                <div className="text-sm text-ink-muted">{item.services}</div>
                <div className="text-sm text-ink-muted">{item.absences}</div>
                <div>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${movementClass(item.movement)}`}>
                    {movementLabel(item.movement)}
                  </span>
                </div>
              </div>

              <div className="p-4 md:hidden">
                <div className="flex items-start gap-3">
                  <span className={`inline-flex h-8 min-w-8 items-center justify-center rounded-full border px-2 text-xs font-bold ${positionTone(item.rank)}`}>
                    #{item.rank}
                  </span>
                  <Avatar name={item.name} color={item.avatar_color} photoUrl={item.photo_url} size={42} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{item.name}</div>
                    <div className="mt-1 text-[12px] text-ink-faint">
                      {item.points} pontos · {item.services} serviços · {item.absences} faltas
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {item.user_id === user.id && <span className="badge badge-brand">Você</span>}
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${movementClass(item.movement)}`}>
                        {movementLabel(item.movement)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Metric({ label, value, loading }: { label: string; value: number; loading: boolean }) {
  return (
    <div className="rounded-[14px] border border-border-soft bg-white px-3 py-3 text-center">
      {loading ? (
        <Skeleton className="mx-auto h-7 w-12" />
      ) : (
        <div className="font-display text-[24px] font-semibold leading-none text-ink">{value}</div>
      )}
      <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-faint">{label}</div>
    </div>
  );
}
