"use client";

import { useMemo, useRef, useState } from "react";
import { ActionDrawer } from "@/components/ui";
import { formatPhoneInput } from "@/lib/invitations";
import { getInitials, getIconEmoji } from "@/lib/utils/helpers";
import { fileToAvatarDataUrl } from "@/lib/utils/image";
import type { User, Department, DepartmentMember } from "@/types";

type MemberRole = "admin" | "leader" | "member";
type MemberStatus = "active" | "inactive" | "paused" | "vacation";

type SelectedDepartment = {
  department_id: string;
  function_name: string;
  function_names: string[];
};

interface MemberEditModalProps {
  member: User;
  departments: Department[];
  allDeptMembers: DepartmentMember[];
  allMembers: User[];
  onClose: () => void;
  canAssignCellRole?: boolean;
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
  canAssignCellRole = false,
  onSave,
}: MemberEditModalProps) {
  const [name, setName] = useState(member.name || "");
  const [email, setEmail] = useState(member.email || "");
  const [phone, setPhone] = useState(member.phone || "");
  const [role, setRole] = useState<MemberRole>((member.role as MemberRole) || "member");
  const [status, setStatus] = useState<MemberStatus>((member.status as MemberStatus) || "active");
  const [cellRole, setCellRole] = useState<string>(member.cell_role ?? "");
  const [spouseId, setSpouseId] = useState(member.spouse_id || "");
  const [photo, setPhoto] = useState<string | null>(member.photo_url ?? null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function handlePhoto(file: File | undefined) {
    if (!file) return;
    setPhotoBusy(true);
    try {
      setPhoto(await fileToAvatarDataUrl(file));
    } catch (error) {
      console.error("Erro ao processar a foto:", error);
    } finally {
      setPhotoBusy(false);
    }
  }

  const [selectedDepartments, setSelectedDepartments] = useState<SelectedDepartment[]>(
    allDeptMembers.map((dm) => ({
      department_id: dm.department_id,
      function_name: dm.function_name || "",
      function_names: dm.function_names || (dm.function_name ? [dm.function_name] : []),
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

      return [...prev, { department_id: departmentId, function_name: "", function_names: [] }];
    });
  }

  function toggleDepartmentFunction(departmentId: string, functionName: string) {
    setSelectedDepartments((prev) =>
      prev.map((d) =>
        d.department_id === departmentId
          ? {
              ...d,
              function_names: d.function_names.includes(functionName)
                ? d.function_names.filter((item) => item !== functionName)
                : [...d.function_names, functionName],
              function_name: d.function_names.includes(functionName)
                ? (d.function_names.filter((item) => item !== functionName)[0] || "")
                : d.function_name || functionName,
            }
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
        photo_url: photo,
        ...(canAssignCellRole ? { cell_role: (cellRole || null) as User["cell_role"] } : {}),
      },
      selectedDepartments,
      spouseId
    );
  }

  return (
    <ActionDrawer
      open={true}
      title="Editar membro"
      onClose={onClose}
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
            <div className="relative shrink-0">
              {photo ? (
                <img
                  src={photo}
                  alt={member.name}
                  className="h-16 w-16 rounded-full object-cover ring-2 ring-white"
                />
              ) : (
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-full text-base font-bold text-white"
                  style={{ background: member.avatar_color }}
                >
                  {getInitials(member.name)}
                </div>
              )}
              {photoBusy && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-white/60 text-[10px] font-semibold text-ink-muted">
                  …
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="font-display text-lg truncate">{member.name}</div>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="btn btn-secondary btn-sm"
                >
                  {photo ? "Trocar foto" : "Adicionar foto"}
                </button>
                {photo && (
                  <button
                    type="button"
                    onClick={() => setPhoto(null)}
                    className="text-xs font-semibold text-ink-faint transition hover:text-danger"
                  >
                    Remover
                  </button>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  void handlePhoto(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
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
              onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
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

        {canAssignCellRole && (
          <div>
            <label className="input-label">Papel em células (igreja)</label>
            <select className="input-field" value={cellRole} onChange={(e) => setCellRole(e.target.value)}>
              <option value="">Nenhum</option>
              <option value="pastor">Pastor — vê tudo</option>
              <option value="coordenacao">Coordenação — vê todas as células</option>
            </select>
            <p className="mt-1 text-[11px] text-ink-faint">Supervisão é definida nas Redes/Setores, não aqui.</p>
          </div>
        )}

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
                      <label className="input-label">Funções neste ministério</label>
                      {dept.function_names?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {dept.function_names.map((functionName) => {
                            const active = selectedDept?.function_names?.includes(functionName);
                            return (
                              <button
                                key={functionName}
                                type="button"
                                onClick={() => toggleDepartmentFunction(dept.id, functionName)}
                                className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${
                                  active ? "bg-brand text-white" : "bg-surface-alt text-ink-muted"
                                }`}
                              >
                                {functionName}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-border-soft bg-surface-alt px-3 py-2 text-[11px] text-ink-faint">
                          Este ministério ainda não tem funções cadastradas. Edite o ministério primeiro para liberar a seleção.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ActionDrawer>
  );
}
