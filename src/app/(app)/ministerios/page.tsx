"use client";
import { useState } from "react";
import { useApp } from "@/hooks/use-app";
import { getDB } from "@/lib/db/local-db";
import { getIconEmoji, getInitials } from "@/lib/utils/helpers";
import { Modal } from "@/components/ui";
import Link from "next/link";
import type { Department, User, DepartmentMember } from "@/types";

const ICONS = ["music","camera","heart","church","cross","flower","flame","star","book","baby","pray"];

export default function MinisteriosPage() {
  const { user, toast, canDo, departments } = useApp();
  const db = getDB();
  const [modal, setModal] = useState<null | { type: "form"; dept?: Department } | { type: "delete"; dept: Department }>(null);
  const members = db.getWhere<User>("users", { church_id: user.church_id }).filter(u => u.active);
  const allDM = db.getAll<DepartmentMember>("department_members");

  function deleteDept(d: Department) {
    db.deleteWhere("department_members", { department_id: d.id });
    db.delete("departments", d.id);
    toast(d.name + " excluido.");
    setModal(null);
    location.href = "/ministerios";
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="page-title">Ministerios</h1><p className="page-subtitle">{departments.length} departamentos</p></div>
        {canDo("department.create") && <button onClick={() => setModal({ type: "form" })} className="btn btn-primary">+ Novo</button>}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {departments.map(d => {
          const count = allDM.filter(dm => dm.department_id === d.id).length;
          const leaderNames = (d.leader_ids || []).map(id => members.find(m => m.id === id)?.name?.split(" ")[0]).filter(Boolean);
          return (
            <Link key={d.id} href={`/ministerios/${d.id}`} className="card group cursor-pointer hover:shadow-md transition-shadow">
              <div className="h-20 flex items-center justify-center text-3xl relative" style={{ background: d.color + "18" }}>
                {getIconEmoji(d.icon)}
                {canDo("department.delete") && <button onClick={e => { e.preventDefault(); e.stopPropagation(); setModal({ type: "delete", dept: d }); }} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 shadow-sm flex items-center justify-center text-xs text-danger opacity-0 group-hover:opacity-100 transition-opacity">&#10005;</button>}
              </div>
              <div className="p-4">
                <div className="font-display text-[17px] mb-0.5">{d.name}</div>
                <div className="text-xs text-ink-muted">{count} membros{leaderNames.length ? " \u00B7 " + leaderNames.join(", ") : ""}</div>
                {d.description && <div className="text-xs text-ink-faint mt-1 line-clamp-2">{d.description}</div>}
              </div>
            </Link>
          );
        })}
      </div>

      {modal?.type === "form" && <DeptForm dept={(modal as any).dept} members={members} db={db} user={user} toast={toast} close={() => setModal(null)} />}
      {modal?.type === "delete" && (
        <Modal title="Excluir Ministerio" close={() => setModal(null)} width={420}
          footer={<><button onClick={() => setModal(null)} className="btn btn-secondary">Cancelar</button><button onClick={() => deleteDept(modal.dept)} className="btn btn-danger">Excluir</button></>}>
          <div className="bg-danger-light text-danger text-sm px-4 py-3 rounded-[10px] border border-danger/10">Excluir <strong>{modal.dept.name}</strong>?</div>
        </Modal>
      )}
    </div>
  );
}

function DeptForm({ dept, members, db, user, toast, close }: any) {
  const isEdit = !!dept;
  const [name, setName] = useState(dept?.name || "");
  const [desc, setDesc] = useState(dept?.description || "");
  const [icon, setIcon] = useState(dept?.icon || "church");
  const [color, setColor] = useState(dept?.color || "#7B9E87");
  const [leaderIds, setLeaderIds] = useState<string[]>(dept?.leader_ids || [user.id]);
  const [coLeaderIds, setCoLeaderIds] = useState<string[]>(dept?.co_leader_ids || []);

  function toggleList(list: string[], setList: (v: string[]) => void, id: string) {
    setList(list.includes(id) ? list.filter(x => x !== id) : [...list, id]);
  }

  function save() {
    if (!name.trim()) { toast("Informe o nome."); return; }
    const data = { name, description: desc, icon, color, leader_ids: leaderIds, co_leader_ids: coLeaderIds };
    if (isEdit) { db.update("departments", dept.id, data); toast("Atualizado!"); }
    else { db.insert("departments", { church_id: user.church_id, ...data, active: true }); toast("Criado!"); }
    close(); location.href = "/ministerios";
  }

  const eligibleLeaders = members.filter((m: User) => m.role === "admin" || m.role === "leader");

  return (
    <Modal title={isEdit ? "Editar Ministerio" : "Novo Ministerio"} close={close} width={520}
      footer={<><button onClick={close} className="btn btn-secondary">Cancelar</button><button onClick={save} className="btn btn-primary">{isEdit ? "Salvar" : "Criar"}</button></>}>
      <div className="space-y-4">
        <div><label className="input-label">Nome</label><input className="input-field" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Louvor" /></div>
        <div><label className="input-label">Descricao</label><textarea className="input-field min-h-[60px]" value={desc} onChange={e => setDesc(e.target.value)} /></div>
        <div><label className="input-label">Icone</label><div className="flex flex-wrap gap-2">{ICONS.map(i => <button key={i} type="button" onClick={() => setIcon(i)} className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg border-2 transition-all ${icon === i ? "border-brand bg-brand-light" : "border-border-soft"}`}>{getIconEmoji(i)}</button>)}</div></div>
        <div><label className="input-label">Cor</label><input type="color" className="input-field h-10 p-1 cursor-pointer" value={color} onChange={e => setColor(e.target.value)} /></div>

        {/* Multiple leaders */}
        <div>
          <label className="input-label">Lideres</label>
          <div className="space-y-1.5">
            {eligibleLeaders.map((m: User) => (
              <label key={m.id} className={`flex items-center gap-3 px-3 py-2 rounded-[10px] cursor-pointer transition-all border-[1.5px] ${leaderIds.includes(m.id) ? "border-brand bg-brand-light" : "border-border-soft hover:border-ink-ghost"}`}>
                <input type="checkbox" checked={leaderIds.includes(m.id)} onChange={() => toggleList(leaderIds, setLeaderIds, m.id)} className="sr-only" />
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center text-[10px] font-bold ${leaderIds.includes(m.id) ? "bg-brand border-brand text-white" : "border-border"}`}>{leaderIds.includes(m.id) ? "\u2713" : ""}</div>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0" style={{ background: m.avatar_color }}>{getInitials(m.name)}</div>
                <span className="text-sm font-medium">{m.name}</span>
                <span className="text-[10px] text-ink-faint ml-auto">{m.role === "admin" ? "Admin" : "Lider"}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Multiple co-leaders */}
        <div>
          <label className="input-label">Co-lideres (opcional)</label>
          <div className="space-y-1.5">
            {members.filter((m: User) => !leaderIds.includes(m.id)).map((m: User) => (
              <label key={m.id} className={`flex items-center gap-3 px-3 py-2 rounded-[10px] cursor-pointer transition-all border-[1.5px] ${coLeaderIds.includes(m.id) ? "border-info bg-info-light" : "border-border-soft hover:border-ink-ghost"}`}>
                <input type="checkbox" checked={coLeaderIds.includes(m.id)} onChange={() => toggleList(coLeaderIds, setCoLeaderIds, m.id)} className="sr-only" />
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center text-[10px] font-bold ${coLeaderIds.includes(m.id) ? "bg-info border-info text-white" : "border-border"}`}>{coLeaderIds.includes(m.id) ? "\u2713" : ""}</div>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0" style={{ background: m.avatar_color }}>{getInitials(m.name)}</div>
                <span className="text-sm font-medium">{m.name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
