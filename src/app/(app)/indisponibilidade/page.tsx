"use client";
import { useState } from "react";
import { useApp } from "@/hooks/use-app";
import { getDB } from "@/lib/db/local-db";
import { formatDate, getInitials } from "@/lib/utils/helpers";
import type { UnavailableDate, User } from "@/types";

// ────────────────────────────────────────────────────────────────
// Indisponibilidade — membros marcam quando não podem ser escalados
// Admin/líderes veem todas as indisponibilidades da igreja
// ────────────────────────────────────────────────────────────────

export default function IndisponibilidadePage() {
  const { user, toast, canDo } = useApp();
  const db = getDB();
  const isMember = user.role === "member";

  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<"single" | "range" | "vacation">("single");
  const [date, setDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [filterUser, setFilterUser] = useState("all");

  const members = db.getWhere<User>("users", { church_id: user.church_id }).filter(u => u.active);
  const allUD = db.getAll<UnavailableDate>("unavailable_dates");

  // Membros veem só as próprias; admins/líderes veem todas
  const myUD = isMember
    ? allUD.filter(u => u.user_id === user.id)
    : allUD.filter(u => {
        const m = members.find(mem => mem.id === u.user_id);
        return m?.church_id === user.church_id;
      });

  const filtered = filterUser === "all" ? myUD : myUD.filter(u => u.user_id === filterUser);
  const sorted = [...filtered].sort((a, b) => a.date.localeCompare(b.date));

  // Próximas (hoje em diante)
  const today = new Date().toISOString().split("T")[0];
  const upcoming = sorted.filter(u => u.date >= today);
  const past = sorted.filter(u => u.date < today);

  function save() {
    if (!date) { toast("Selecione a data."); return; }
    if (type === "range" && !endDate) { toast("Selecione a data final."); return; }
    if (type === "range" && endDate < date) { toast("Data final deve ser após a inicial."); return; }

    db.insert<UnavailableDate>("unavailable_dates", {
      user_id: user.id,
      date,
      end_date: type !== "single" ? endDate : null,
      reason,
      type,
    });
    toast("Indisponibilidade registrada!");
    setShowForm(false);
    setDate(""); setEndDate(""); setReason(""); setType("single");
    window.dispatchEvent(new Event("servos:refresh"));
    location.reload();
  }

  function remove(id: string) {
    if (!confirm("Remover esta indisponibilidade?")) return;
    db.delete("unavailable_dates", id);
    toast("Removida.");
    location.reload();
  }

  const typeLabel = (t: string) =>
    t === "single" ? "Data única" : t === "range" ? "Período" : "Férias";
  const typeColor = (t: string) =>
    t === "single" ? "badge-amber" : t === "range" ? "badge-brand" : "badge-red";

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="page-title">Indisponibilidade</h1>
          <p className="page-subtitle">
            {isMember
              ? "Informe quando não poderá ser escalado"
              : "Veja quando os membros estão indisponíveis"}
          </p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary btn-sm self-start sm:self-auto">
          + Registrar
        </button>
      </div>

      {/* Filter por membro (admin/leader) */}
      {!isMember && (
        <div className="mb-5">
          <select
            value={filterUser}
            onChange={e => setFilterUser(e.target.value)}
            className="input-field max-w-xs"
          >
            <option value="all">Todos os membros</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Formulário inline */}
      {showForm && (
        <div className="card mb-6">
          <div className="px-5 pt-4 pb-3 border-b border-border-soft">
            <span className="font-display text-[17px]">Nova indisponibilidade</span>
          </div>
          <div className="px-5 py-4 space-y-4">
            {/* Tipo */}
            <div>
              <label className="input-label">Tipo</label>
              <div className="flex gap-2 flex-wrap">
                {(["single", "range", "vacation"] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
                      type === t
                        ? "bg-brand text-white border-brand"
                        : "border-border text-ink-muted hover:border-ink-ghost"
                    }`}
                  >
                    {typeLabel(t)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="input-label">{type === "single" ? "Data" : "Data inicial"}</label>
                <input
                  type="date"
                  value={date}
                  min={today}
                  onChange={e => setDate(e.target.value)}
                  className="input-field"
                />
              </div>
              {type !== "single" && (
                <div>
                  <label className="input-label">Data final</label>
                  <input
                    type="date"
                    value={endDate}
                    min={date || today}
                    onChange={e => setEndDate(e.target.value)}
                    className="input-field"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="input-label">
                Motivo <span className="text-ink-ghost font-normal">(opcional — visível apenas para líderes)</span>
              </label>
              <input
                type="text"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="ex: Viagem, consulta médica..."
                className="input-field"
                maxLength={100}
              />
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button onClick={() => setShowForm(false)} className="btn btn-ghost">Cancelar</button>
              <button onClick={save} className="btn btn-primary">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Próximas */}
      <div className="card mb-5">
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-border-soft">
          <span className="font-display text-[17px]">Próximas</span>
          <span className="badge badge-amber">{upcoming.length}</span>
        </div>
        {upcoming.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-ink-faint">
            Nenhuma indisponibilidade registrada.
          </div>
        ) : (
          upcoming.map(ud => {
            const m = members.find(u => u.id === ud.user_id);
            const canRemove = ud.user_id === user.id || canDo("member.edit");
            return (
              <div key={ud.id} className="flex items-center gap-3.5 px-5 py-3.5 border-b border-border-soft last:border-b-0">
                {!isMember && m && (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                    style={{ background: m.avatar_color }}
                  >
                    {getInitials(m.name)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  {!isMember && m && (
                    <div className="text-sm font-semibold truncate">{m.name}</div>
                  )}
                  <div className="text-[13px] text-ink-soft">
                    {formatDate(ud.date)}
                    {ud.end_date && ` → ${formatDate(ud.end_date)}`}
                  </div>
                  {ud.reason && !isMember && (
                    <div className="text-[11px] text-ink-faint mt-0.5">{ud.reason}</div>
                  )}
                </div>
                <span className={`badge ${typeColor(ud.type)}`}>{typeLabel(ud.type)}</span>
                {canRemove && (
                  <button
                    onClick={() => remove(ud.id)}
                    className="text-ink-ghost hover:text-danger transition-colors ml-1 p-1"
                    title="Remover"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                    </svg>
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Passadas (colapsável) */}
      {past.length > 0 && (
        <details className="card">
          <summary className="px-5 py-3 cursor-pointer text-sm font-medium text-ink-muted hover:text-ink transition-colors list-none flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
            Histórico ({past.length} registros)
          </summary>
          {past.slice(-20).reverse().map(ud => {
            const m = members.find(u => u.id === ud.user_id);
            return (
              <div key={ud.id} className="flex items-center gap-3 px-5 py-3 border-t border-border-soft opacity-50">
                {!isMember && m && (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0" style={{ background: m.avatar_color }}>
                    {getInitials(m.name)}
                  </div>
                )}
                <div className="flex-1 min-w-0 text-[12px] text-ink-muted">
                  {!isMember && m && <span className="font-medium">{m.name} · </span>}
                  {formatDate(ud.date)}{ud.end_date && ` → ${formatDate(ud.end_date)}`}
                </div>
                <span className={`badge ${typeColor(ud.type)} opacity-60`}>{typeLabel(ud.type)}</span>
              </div>
            );
          })}
        </details>
      )}
    </div>
  );
}
