"use client";
import { useState } from "react";
import { useApp } from "@/hooks/use-app";
import { getDB } from "@/lib/db/local-db";
import { getInitials, DAY_LABELS } from "@/lib/utils/helpers";
import Link from "next/link";
import type { User, DepartmentMember, Department } from "@/types";

export default function MembrosPage() {
  const { user, toast, canDo, departments } = useApp();
  const db = getDB();
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState<string>("all");

  const members = db.getWhere<User>("users", { church_id: user.church_id }).filter(u => u.active);
  const allDM = db.getAll<DepartmentMember>("department_members");

  // Apply filters
  let filtered = members;
  if (search) filtered = filtered.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase()));
  if (deptFilter !== "all") {
    const deptMemberIds = allDM.filter(dm => dm.department_id === deptFilter).map(dm => dm.user_id);
    filtered = filtered.filter(m => deptMemberIds.includes(m.id));
  }

  function removeMember(m: User) {
    if (!confirm(`Remover ${m.name}?`)) return;
    db.update("users", m.id, { active: false });
    if (m.spouse_id) db.update("users", m.spouse_id, { spouse_id: null });
    db.deleteWhere("department_members", { user_id: m.id });
    toast(m.name + " removido.");
    location.href = "/membros";
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="page-title">Membros</h1><p className="page-subtitle">{members.length} voluntarios</p></div>
        {canDo("member.invite") && <Link href="/membros/convidar" className="btn btn-primary">+ Convidar</Link>}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <input className="input-field max-w-[280px]" placeholder="Buscar por nome ou email..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="input-field max-w-[200px]" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
          <option value="all">Todos os ministerios</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        {(search || deptFilter !== "all") && (
          <button onClick={() => { setSearch(""); setDeptFilter("all"); }} className="btn btn-ghost btn-sm text-ink-faint">Limpar filtros</button>
        )}
      </div>

      <div className="card">
        {filtered.map(m => {
          const mDepts = allDM.filter(dm => dm.user_id === m.id);
          const deptNames = mDepts.map(dm => departments.find(d => d.id === dm.department_id)?.name).filter(Boolean);
          const func = mDepts[0]?.function_name || "";
          const spouse = m.spouse_id ? members.find(s => s.id === m.spouse_id) : null;
          const roleCls = m.role === "admin" ? "bg-purple-50 text-purple-600" : m.role === "leader" ? "bg-brand-light text-brand" : "bg-success-light text-success";
          return (
            <div key={m.id} className="flex items-center gap-3.5 px-5 py-3 border-t border-border-soft first:border-t-0 hover:bg-brand-glow transition-colors group">
              <Link href={`/membros/${m.id}`} className="flex items-center gap-3.5 flex-1 min-w-0">
                {m.photo_url ? (
                  <img src={m.photo_url} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: m.avatar_color }}>{getInitials(m.name)}</div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{m.name}{m.must_change_password ? " *" : ""}</div>
                  <div className="text-[11px] text-ink-faint">{func}{deptNames.length ? " \u00B7 " + deptNames.join(", ") : ""} \u00B7 {m.email}</div>
                </div>
                <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${roleCls}`}>{m.role === "admin" ? "Admin" : m.role === "leader" ? "Lider" : "Membro"}</span>
                {spouse && <span className="text-[9px] font-semibold text-brand bg-brand-light px-1.5 py-0.5 rounded-full">&#128145; {spouse.name.split(" ")[0]}</span>}
              </Link>
              {canDo("member.remove") && m.id !== user.id && <button onClick={() => removeMember(m)} className="btn btn-ghost btn-sm text-danger opacity-0 group-hover:opacity-100 transition-opacity">&#10005;</button>}
            </div>
          );
        })}
        {filtered.length === 0 && <div className="px-5 py-12 text-center text-sm text-ink-faint">Nenhum membro encontrado.</div>}
      </div>
    </div>
  );
}
