"use client";
import { useState } from "react";
import { useApp } from "@/hooks/use-app";
import { getDB } from "@/lib/db/local-db";
import { getInitials, getIconEmoji } from "@/lib/utils/helpers";
import { Modal } from "@/components/ui";
import Link from "next/link";
import type { User, DepartmentMember, Schedule, Event } from "@/types";

export default function MinisterioDetailPage({ params }: { params: { id: string } }) {
  const { user, departments, canDo, toast } = useApp();
  const db = getDB();
  const [showAddMember, setShowAddMember] = useState(false);
  const dept = departments.find(d => d.id === params.id);
  if (!dept) return <div className="py-20 text-center text-ink-faint">Ministerio nao encontrado.</div>;

  const allMembers = db.getWhere<User>("users", { church_id: user.church_id }).filter(u => u.active);
  const dms = db.getWhere<DepartmentMember>("department_members", { department_id: dept.id });
  const deptMemberIds = dms.map(dm => dm.user_id);
  const leaders = (dept.leader_ids || []).map(id => allMembers.find(m => m.id === id)).filter(Boolean);
  const coLeaders = (dept.co_leader_ids || []).map(id => allMembers.find(m => m.id === id)).filter(Boolean);
  const schedules = db.getWhere<Schedule>("schedules", { department_id: dept.id }).filter(s => s.status !== "cancelled").sort((a, b) => a.date.localeCompare(b.date));
  const events = db.getWhere<Event>("events", { church_id: user.church_id });
  const availableToAdd = allMembers.filter(m => !deptMemberIds.includes(m.id));

  function addMemberToDept(userId: string, funcName: string) {
    db.insert("department_members", { department_id: dept.id, user_id: userId, function_name: funcName, joined_at: new Date().toISOString() });
    toast("Membro adicionado ao ministerio!");
    setShowAddMember(false);
    location.href = `/ministerios/${dept.id}`;
  }

  function removeMemberFromDept(dmId: string, memberName: string) {
    if (!confirm(`Remover ${memberName} deste ministerio?`)) return;
    db.delete("department_members", dmId);
    toast(memberName + " removido do ministerio.");
    location.href = `/ministerios/${dept.id}`;
  }

  return (
    <div>
      <Link href="/ministerios" className="inline-flex items-center gap-1.5 text-[13px] text-brand font-medium mb-5 hover:underline">&larr; Ministerios</Link>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-[14px] flex items-center justify-center text-2xl" style={{ background: dept.color + "22" }}>{getIconEmoji(dept.icon)}</div>
        <div className="flex-1">
          <h1 className="page-title">{dept.name}</h1>
          <p className="page-subtitle">{dms.length} membros</p>
          {dept.description && <p className="text-xs text-ink-faint mt-1">{dept.description}</p>}
        </div>
        {canDo("member.invite", dept.id) && <button onClick={() => setShowAddMember(true)} className="btn btn-primary btn-sm">+ Adicionar membro</button>}
      </div>

      {/* Leaders & Co-leaders */}
      {(leaders.length > 0 || coLeaders.length > 0) && (
        <div className="flex flex-wrap gap-3 mb-6">
          {leaders.map(l => l && (
            <div key={l.id} className="flex items-center gap-2 bg-brand-light px-3 py-1.5 rounded-full">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[8px] font-bold" style={{ background: l.avatar_color }}>{getInitials(l.name)}</div>
              <span className="text-xs font-semibold text-brand">{l.name.split(" ")[0]}</span>
              <span className="text-[9px] text-brand-deep font-bold">Lider</span>
            </div>
          ))}
          {coLeaders.map(c => c && (
            <div key={c.id} className="flex items-center gap-2 bg-info-light px-3 py-1.5 rounded-full">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[8px] font-bold" style={{ background: c.avatar_color }}>{getInitials(c.name)}</div>
              <span className="text-xs font-semibold text-info">{c.name.split(" ")[0]}</span>
              <span className="text-[9px] text-info font-bold">Co-lider</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-[1fr_320px] gap-6 items-start">
        <div className="space-y-5">
          <div className="card">
            <div className="px-5 pt-4 pb-3 flex items-center justify-between">
              <span className="font-display text-[17px]">Membros ({dms.length})</span>
            </div>
            {dms.length === 0 ? (
              <div className="px-5 pb-6 text-sm text-ink-faint text-center py-8">Nenhum membro neste ministerio.</div>
            ) : dms.map(dm => {
              const m = allMembers.find(u => u.id === dm.user_id);
              if (!m) return null;
              const isLeader = (dept.leader_ids || []).includes(m.id);
              const isCoLeader = (dept.co_leader_ids || []).includes(m.id);
              return (
                <div key={dm.id} className="flex items-center gap-3 px-5 py-2.5 border-t border-border-soft hover:bg-brand-glow transition-colors group">
                  <Link href={`/membros/${m.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                    {m.photo_url ? (
                      <img src={m.photo_url} className="w-8 h-8 rounded-full object-cover flex-shrink-0" alt="" />
                    ) : (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ background: m.avatar_color }}>{getInitials(m.name)}</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{m.name}</div>
                      <div className="text-[11px] text-ink-faint">{dm.function_name || "-"}</div>
                    </div>
                  </Link>
                  {isLeader && <span className="badge badge-brand">Lider</span>}
                  {isCoLeader && <span className="badge badge-info">Co-lider</span>}
                  {canDo("member.remove", dept.id) && !isLeader && (
                    <button onClick={() => removeMemberFromDept(dm.id, m.name)} className="btn btn-ghost btn-sm text-danger opacity-0 group-hover:opacity-100 transition-opacity text-xs" title="Remover do ministerio">&#10005;</button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-5">
          <div className="card">
            <div className="px-5 pt-4 pb-3"><span className="font-display text-[17px]">Proximas Escalas</span></div>
            {schedules.slice(0, 5).map(s => {
              const ev = events.find(e => e.id === s.event_id);
              return (
                <Link key={s.id} href={`/escalas/${s.id}`} className="flex items-center gap-3 px-5 py-2.5 border-t border-border-soft hover:bg-brand-glow transition-colors">
                  <div className="text-sm font-medium flex-1">{ev?.name}</div>
                  <div className="text-xs text-ink-faint">{s.date.split("-")[2]}/{s.date.split("-")[1]}</div>
                </Link>
              );
            })}
            {schedules.length === 0 && <div className="px-5 py-6 text-sm text-ink-faint text-center">Nenhuma escala.</div>}
          </div>
        </div>
      </div>

      {/* Add member modal */}
      {showAddMember && (
        <AddMemberToDeptModal
          availableMembers={availableToAdd}
          close={() => setShowAddMember(false)}
          onAdd={addMemberToDept}
        />
      )}
    </div>
  );
}

function AddMemberToDeptModal({ availableMembers, close, onAdd }: { availableMembers: User[]; close: () => void; onAdd: (userId: string, func: string) => void }) {
  const [selectedId, setSelectedId] = useState("");
  const [funcName, setFuncName] = useState("");
  const [search, setSearch] = useState("");

  const filtered = search ? availableMembers.filter(m => m.name.toLowerCase().includes(search.toLowerCase())) : availableMembers;

  return (
    <Modal title="Adicionar Membro ao Ministerio" close={close} width={460}
      footer={<><button onClick={close} className="btn btn-secondary">Cancelar</button><button onClick={() => selectedId && onAdd(selectedId, funcName)} disabled={!selectedId} className="btn btn-primary disabled:opacity-40">Adicionar</button></>}>
      <div className="space-y-4">
        <input className="input-field" placeholder="Buscar membro..." value={search} onChange={e => setSearch(e.target.value)} />
        <div className="max-h-[240px] overflow-y-auto space-y-1">
          {filtered.length === 0 ? (
            <div className="text-sm text-ink-faint text-center py-6">Nenhum membro disponivel.</div>
          ) : filtered.map(m => (
            <label key={m.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] cursor-pointer transition-all border-[1.5px] ${selectedId === m.id ? "border-brand bg-brand-light" : "border-border-soft hover:border-ink-ghost"}`}>
              <input type="radio" name="member" value={m.id} checked={selectedId === m.id} onChange={() => setSelectedId(m.id)} className="sr-only" />
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-bold" style={{ background: m.avatar_color }}>{getInitials(m.name)}</div>
              <div className="flex-1"><div className="text-sm font-medium">{m.name}</div><div className="text-[11px] text-ink-faint">{m.email}</div></div>
            </label>
          ))}
        </div>
        {selectedId && (
          <div><label className="input-label">Funcao no ministerio</label><input className="input-field" value={funcName} onChange={e => setFuncName(e.target.value)} placeholder="Ex: Vocal, Guitarra..." /></div>
        )}
      </div>
    </Modal>
  );
}
