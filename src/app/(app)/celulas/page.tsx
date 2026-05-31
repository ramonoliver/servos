"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useApp } from "@/hooks/use-app";
import { supabase } from "@/lib/supabase/client";
import { getInitials } from "@/lib/utils/helpers";
import { Avatar, ConfirmDialog, PageShell, PageHeader } from "@/components/ui";
import { CellForm } from "@/components/shared/cell-form";
import { fetchCells, saveCell } from "@/lib/cells/client";
import { cellHealthAverage, type Cell, type CellMemberRow, type CellNetwork } from "@/lib/cells/types";
import type { User } from "@/types";

type ModalState = null | { type: "form"; cell?: Cell } | { type: "delete"; cell: Cell };

export default function CelulasPage() {
  const { user, toast } = useApp();
  const canCreate =
    user.role === "admin" || user.cell_role === "pastor" || user.cell_role === "coordenacao";

  const [cells, setCells] = useState<Cell[]>([]);
  const [cellMembers, setCellMembers] = useState<CellMemberRow[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [networks, setNetworks] = useState<CellNetwork[]>([]);
  const [manageableIds, setManageableIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [healthFilter, setHealthFilter] = useState("all");
  const [modal, setModal] = useState<ModalState>(null);
  const manageable = useMemo(() => new Set(manageableIds), [manageableIds]);

  async function loadData() {
    setLoading(true);
    try {
      const [{ data: usersData }, cellsData] = await Promise.all([
        supabase.from("users").select("*").eq("church_id", user.church_id).eq("active", true),
        fetchCells(),
      ]);
      setMembers((usersData || []) as User[]);
      setCells(cellsData.cells);
      setCellMembers(cellsData.cellMembers);
      setNetworks(cellsData.networks);
      setManageableIds(cellsData.manageableIds);
    } catch (error) {
      console.warn("Falha ao carregar células:", error);
      setCells([]);
      setCellMembers([]);
      setManageableIds([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [user.church_id]);

  const memberById = useMemo(() => {
    const map = new Map<string, User>();
    members.forEach((m) => map.set(m.id, m));
    return map;
  }, [members]);

  function countMembers(cellId: string) {
    return cellMembers.filter((cm) => cm.cell_id === cellId).length;
  }

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return cells.filter((cell) => {
      const leader = cell.leader_ids?.[0] ? memberById.get(cell.leader_ids[0]) : null;
      const average = cellHealthAverage(cell.health);
      const matchesSearch =
        !term ||
        cell.name.toLowerCase().includes(term) ||
        cell.audience.toLowerCase().includes(term) ||
        leader?.name.toLowerCase().includes(term);
      const matchesHealth =
        healthFilter === "all" ||
        (healthFilter === "healthy" && average >= 75) ||
        (healthFilter === "care" && average < 75);
      return matchesSearch && matchesHealth;
    });
  }, [cells, search, healthFilter, memberById]);

  const totalHealthy = cells.filter((c) => cellHealthAverage(c.health) >= 75).length;
  const totalCare = cells.filter((c) => cellHealthAverage(c.health) < 75).length;
  const hasFilters = search || healthFilter !== "all";

  async function deleteCell(cell: Cell) {
    try {
      await saveCell({ mode: "delete", cellId: cell.id });
      toast(`${cell.name} excluída.`);
      setModal(null);
      await loadData();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Erro ao excluir célula.");
    }
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Pessoas & Cuidado"
        title="Células"
        subtitle="Acompanhe líderes, membros, reuniões e saúde de cada célula."
        actions={
          canCreate && (
            <div className="flex gap-2">
              <Link href="/celulas/redes" className="btn btn-secondary btn-sm">Redes</Link>
              <button onClick={() => setModal({ type: "form" })} className="btn btn-primary btn-sm">
                + Nova célula
              </button>
            </div>
          )
        }
      />

      <div className="flex flex-wrap gap-3">
        <StatChip value={cells.length} label="células" />
        <StatChip value={totalHealthy} label="saudáveis" color="success" />
        {totalCare > 0 && <StatChip value={totalCare} label="precisam atenção" color="amber" />}
      </div>

      <div className="card p-3">
        <div className="grid gap-2 sm:grid-cols-[1fr_190px]">
          <input
            className="input-field"
            placeholder="Buscar célula, líder ou público..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="input-field" value={healthFilter} onChange={(e) => setHealthFilter(e.target.value)}>
            <option value="all">Todas as saúdes</option>
            <option value="healthy">Saudáveis</option>
            <option value="care">Precisam atenção</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold text-ink-faint">
          {loading ? "Carregando..." : `${filtered.length} células encontradas`}
        </span>
        {hasFilters && (
          <button className="btn btn-ghost btn-sm text-ink-faint" onClick={() => { setSearch(""); setHealthFilter("all"); }}>
            Limpar filtros
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-ink-faint">Carregando células...</div>
      ) : filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((cell) => {
            const leader = cell.leader_ids?.[0] ? memberById.get(cell.leader_ids[0]) : null;
            const extraLeaders = Math.max((cell.leader_ids?.length || 0) - 1, 0);
            const canManageThis = manageable.has(cell.id);
            const average = cellHealthAverage(cell.health);
            const healthBar = average >= 75 ? "bg-success" : average >= 50 ? "bg-amber" : "bg-danger";
            const healthChip =
              average >= 75 ? "text-success bg-success-light" : average >= 50 ? "text-amber bg-amber-light" : "text-danger bg-danger-light";
            return (
              <div key={cell.id} className="group rounded-[18px] border border-border-soft bg-white/70 p-4 shadow-soft backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-lift">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/celulas/${cell.id}`} className="font-display text-[16px] font-bold text-ink truncate hover:text-brand-deep transition-colors block">
                      {cell.name}
                    </Link>
                    <p className="mt-0.5 text-[12px] text-ink-muted">
                      {[cell.week_day, cell.time, cell.audience].filter(Boolean).join(" · ") || "Sem horário definido"}
                    </p>
                  </div>
                  <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${healthChip}`}>{average}%</span>
                </div>

                {cell.description && <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-ink-muted">{cell.description}</p>}

                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-alt">
                  <div className={`h-1.5 rounded-full ${healthBar}`} style={{ width: `${average}%` }} />
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                  {leader ? (
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar name={leader.name} color={leader.avatar_color} photoUrl={leader.photo_url} size={30} />
                      <div className="min-w-0">
                        <div className="text-[12px] font-semibold text-ink truncate">
                          {leader.name.split(" ")[0]}{extraLeaders > 0 ? ` +${extraLeaders}` : ""}
                        </div>
                        <div className="text-[10px] text-ink-faint">{cell.leader_ids.length > 1 ? "Líderes" : "Líder"}</div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-ink-faint">Sem líder</span>
                  )}
                  <span className="text-[11px] font-semibold text-ink-faint">{countMembers(cell.id)}/{cell.max_members} membros</span>
                </div>

                <div className="mt-3 flex gap-2 border-t border-border-soft pt-3">
                  <Link href={`/celulas/${cell.id}`} className="btn btn-primary btn-sm flex-1">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9}><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" /><circle cx="12" cy="12" r="3" /></svg>
                    Visualizar
                  </Link>
                  {canManageThis && (
                    <button onClick={() => setModal({ type: "form", cell })} className="btn btn-secondary btn-sm">Editar</button>
                  )}
                  {canCreate && (
                    <button onClick={() => setModal({ type: "delete", cell })} className="btn btn-danger btn-sm">Excluir</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[18px] border border-border-soft bg-white/70 px-6 py-12 text-center backdrop-blur">
          <p className="text-sm font-semibold text-ink">Nenhuma célula {hasFilters ? "encontrada" : "cadastrada"}</p>
          <p className="mt-1 text-sm text-ink-muted">
            {hasFilters ? "Tente ajustar os filtros de busca." : "Crie a primeira célula da sua igreja."}
          </p>
          {!hasFilters && canCreate && (
            <button onClick={() => setModal({ type: "form" })} className="mt-4 btn btn-primary btn-sm">+ Nova célula</button>
          )}
          {hasFilters && (
            <button className="mt-4 btn btn-secondary btn-sm" onClick={() => { setSearch(""); setHealthFilter("all"); }}>Limpar filtros</button>
          )}
        </div>
      )}

      {modal?.type === "form" && (
        <CellForm
          cell={modal.cell}
          members={members}
          cellMembers={cellMembers}
          networks={networks}
          toast={toast}
          close={() => setModal(null)}
          onSaved={async () => { setModal(null); await loadData(); }}
        />
      )}

      {modal?.type === "delete" && (
        <ConfirmDialog
          title="Excluir célula"
          message={`Você está prestes a excluir <strong>${modal.cell.name}</strong>.`}
          confirmLabel="Excluir"
          onCancel={() => setModal(null)}
          onConfirm={() => void deleteCell(modal.cell)}
        />
      )}
    </PageShell>
  );
}

function StatChip({ value, label, color }: { value: number; label: string; color?: "success" | "amber" }) {
  const cls = color === "success" ? "bg-success-light text-success" : color === "amber" ? "bg-amber-light text-amber" : "bg-surface-alt text-ink-muted";
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold ${cls}`}>
      <span className="font-display text-[15px] font-bold">{value}</span>
      {label}
    </div>
  );
}
