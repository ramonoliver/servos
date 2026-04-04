"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/components/ui";
import { getInitials, getIconEmoji } from "@/lib/utils/helpers";
import type { User, Department, DepartmentMember } from "@/types";

type MemberRole = "admin" | "leader" | "member";
type MemberStatus = "active" | "inactive" | "paused" | "vacation";

type SelectedDepartment = {
  department_id: string;
  function_name: string;
};

interface MemberEditModalProps {
  member: User;
  departments: Department[];
  allDeptMembers: DepartmentMember[];
  allMembers: User[];
  onClose: () => void;
  onSave: (
    updates: Partial<User>,
    selectedDepartments: SelectedDepartment[],
    spouseId: string
  ) => void;
}

export function MemberEditModal({
  member,
  departments,
  allDeptMembers,
  allMembers,
  onClose,
  onSave,
}: MemberEditModalProps) {
  const [name, setName] = useState(member.name || "");
  const [email, setEmail] = useState(member.email || "");
  const [phone, setPhone] = useState(member.phone || "");
  const [role, setRole] = useState<MemberRole>((member.role as MemberRole) || "member");
  const [status, setStatus] = useState<MemberStatus>((member.status as MemberStatus) || "active");
  const [spouseId, setSpouseId] = useState(member.spouse_id || "");

  const [selectedDepartments, setSelectedDepartments] = useState<SelectedDepartment[]>(
    allDeptMembers.map((dm) => ({
      department_id: dm.department_id,
      function_name: dm.function_name || "",
    }))
  );

  const availableSpouses = useMemo(
    () => allMembers.filter((m) => m.id !== member.id),
    [allMembers, member.id]
  );

  function isSelected(departmentId: string) {
    return selectedDepartments.some((d) => d.department_id === departmentId);
  }

  function toggleDepartment(departmentId: string) {
    setSelectedDepartments((prev) => {
      const exists = prev.some((d) => d.department_id === departmentId);

      if (exists) {
        return prev.filter((d) => d.department_id !== departmentId);
      }

      return [...prev, { department_id: departmentId, function_name: "" }];
    });
  }

  function updateDepartmentFunction(departmentId: string, functionName: string) {
    setSelectedDepartments((prev) =>
      prev.map((d) =>
        d.department_id === departmentId
          ? { ...d, function_name: functionName }
          : d
      )
    );
  }

  function handleSave() {
    if (!name.trim()) return;
    if (!email.trim()) return;

    onSave(
      {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        role,
        status,
        spouse_id: spouseId || null,
      },
      selectedDepartments,
      spouseId
    );
  }

  return (
    <Modal
      title="Editar membro"
      close={onClose}
      width={760}
      footer={
        <>
          <button onClick={onClose} className="btn btn-secondary">
            Cancelar
          </button>
          <button onClick={handleSave} className="btn btn-primary">
            Salvar alterações
          </button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-border-soft bg-surface-alt p-4">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
              style={{ background: member.avatar_color }}
            >
              {getInitials(member.name)}
            </div>

            <div className="min-w-0">
              <div className="font-display text-lg truncate">{member.name}</div>
              <div className="text-sm text-ink-muted truncate">{member.email}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="input-label">Nome completo</label>
            <input
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do membro"
            />
          </div>

          <div>
            <label className="input-label">Email</label>
            <input
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
            />
          </div>

          <div>
            <label className="input-label">Telefone</label>
            <input
              className="input-field"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(00) 00000-0000"
            />
          </div>

          <div>
            <label className="input-label">Casal (opcional)</label>
            <select
              className="input-field"
              value={spouseId}
              onChange={(e) => setSpouseId(e.target.value)}
            >
              <option value="">Nenhum</option>
              {availableSpouses.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="input-label">Perfil</label>
            <select
              className="input-field"
              value={role}
              onChange={(e) => setRole(e.target.value as MemberRole)}
            >
              <option value="member">Membro</option>
              <option value="leader">Lider</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <div>
            <label className="input-label">Status</label>
            <select
              className="input-field"
              value={status}
              onChange={(e) => setStatus(e.target.value as MemberStatus)}
            >
              <option value="active">Ativo</option>
              <option value="paused">Pausa</option>
              <option value="vacation">Ferias</option>
              <option value="inactive">Inativo</option>
            </select>
          </div>
        </div>

        <div>
          <div className="mb-2">
            <div className="font-display text-lg">Ministérios</div>
            <p className="text-sm text-ink-muted">
              Selecione um ou mais ministérios e defina a função em cada um.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {departments.map((dept) => {
              const selected = isSelected(dept.id);
              const selectedDept = selectedDepartments.find(
                (d) => d.department_id === dept.id
              );

              return (
                <div
                  key={dept.id}
                  className={`rounded-2xl border p-4 transition-all ${
                    selected
                      ? "border-brand bg-brand-glow shadow-sm"
                      : "border-border-soft bg-white hover:border-ink-ghost"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => toggleDepartment(dept.id)}
                      className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center text-[11px] font-bold transition-all ${
                        selected
                          ? "bg-brand border-brand text-white"
                          : "border-border bg-white text-transparent"
                      }`}
                    >
                      ✓
                    </button>

                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                      style={{ background: dept.color + "18", color: dept.color }}
                    >
                      {getIconEmoji(dept.icon)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm">{dept.name}</div>
                      <div className="text-[12px] text-ink-faint line-clamp-2">
                        {dept.description || "Sem descrição"}
                      </div>
                    </div>
                  </div>

                  {selected && (
                    <div className="mt-3 pl-8">
                      <label className="input-label">Função neste ministério</label>
                      <input
                        className="input-field"
                        value={selectedDept?.function_name || ""}
                        onChange={(e) =>
                          updateDepartmentFunction(dept.id, e.target.value)
                        }
                        placeholder="Ex: Vocal, Câmera, Recepção..."
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}