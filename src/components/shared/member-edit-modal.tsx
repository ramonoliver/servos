"use client";
import { useState } from "react";
import { Modal, AvailabilityEditor } from "@/components/ui";
import type { User, Department, DepartmentMember } from "@/types";

interface Props {
  member: User;
  departments: Department[];
  allDeptMembers: DepartmentMember[];
  allMembers: User[];
  onSave: (updates: Partial<User>, deptId: string, funcName: string, spouseId: string) => void;
  onClose: () => void;
}

export function MemberEditModal({ member, departments, allDeptMembers, allMembers, onSave, onClose }: Props) {
  const mDept = allDeptMembers.find(dm => dm.user_id === member.id);
  const [name, setName] = useState(member.name);
  const [email, setEmail] = useState(member.email);
  const [phone, setPhone] = useState(member.phone || "");
  const [role, setRole] = useState(member.role);
  const [deptId, setDeptId] = useState(mDept?.department_id || "");
  const [funcName, setFuncName] = useState(mDept?.function_name || "");
  const [spouseId, setSpouseId] = useState(member.spouse_id || "");
  const [avail, setAvail] = useState([...(member.availability || [true,true,true,true,true,true,true])]);
  const [status, setStatus] = useState(member.status || "active");

  function save() {
    onSave({ name, email: email.toLowerCase(), phone, role: role as any, availability: avail, spouse_id: spouseId || null, status: status as any }, deptId, funcName, spouseId);
  }

  return (
    <Modal title="Editar Membro" close={onClose} width={500}
      footer={<><button onClick={onClose} className="btn btn-secondary">Cancelar</button><button onClick={save} className="btn btn-primary">Salvar</button></>}>
      <div className="space-y-4">
        <div><label className="input-label">Nome</label><input className="input-field" value={name} onChange={e => setName(e.target.value)} /></div>
        <div><label className="input-label">Email</label><input type="email" className="input-field" value={email} onChange={e => setEmail(e.target.value)} /></div>
        <div><label className="input-label">Telefone</label><input className="input-field" value={phone} onChange={e => setPhone(e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="input-label">Perfil</label>
            <select className="input-field" value={role} onChange={e => setRole(e.target.value)}>
              <option value="member">Membro</option><option value="leader">Lider</option><option value="admin">Administrador</option>
            </select>
          </div>
          <div><label className="input-label">Status</label>
            <select className="input-field" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="active">Ativo</option><option value="paused">Pausa</option><option value="vacation">Ferias</option><option value="inactive">Inativo</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="input-label">Ministerio</label>
            <select className="input-field" value={deptId} onChange={e => setDeptId(e.target.value)}>
              <option value="">Nenhum</option>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div><label className="input-label">Funcao</label><input className="input-field" value={funcName} onChange={e => setFuncName(e.target.value)} placeholder="Ex: Vocal" /></div>
        </div>
        <div><label className="input-label">Conjuge</label>
          <select className="input-field" value={spouseId} onChange={e => setSpouseId(e.target.value)}>
            <option value="">Nenhum</option>
            {allMembers.filter(m => m.id !== member.id).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div>
          <label className="input-label">Disponibilidade semanal</label>
          <AvailabilityEditor availability={avail} onChange={setAvail} />
        </div>
      </div>
    </Modal>
  );
}
