"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/hooks/use-app";
import { supabase } from "@/lib/supabase/client";
import { generateTempPassword, hashPassword } from "@/lib/auth/password";
import { genId, getIconEmoji } from "@/lib/utils/helpers";
import type { User } from "@/types";

type MemberRole = "member" | "leader" | "admin";

type SelectedDepartment = {
  department_id: string;
  function_name: string;
};

export default function ConvidarMembroPage() {
  const { user, toast, departments, church } = useApp();
  const router = useRouter();

  const [members, setMembers] = useState<User[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  const [f, setF] = useState({
    name: "",
    email: "",
    phone: "",
    role: "member" as MemberRole,
    spouseId: "",
  });

  const [selectedDepartments, setSelectedDepartments] = useState<SelectedDepartment[]>([]);
  const [tempPw, setTempPw] = useState<string | null>(null);
  const [createdName, setCreatedName] = useState("");
  const [createdEmail, setCreatedEmail] = useState("");

  const u = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    async function loadMembers() {
      setLoadingMembers(true);

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("church_id", user.church_id)
        .eq("active", true);

      if (error) {
        console.error("Erro ao carregar membros:", error);
        toast("Erro ao carregar membros.");
        setLoadingMembers(false);
        return;
      }

      setMembers((data || []) as User[]);
      setLoadingMembers(false);
    }

    loadMembers();
  }, [user.church_id, toast]);

  const availableSpouses = useMemo(
    () => members.filter((m) => !m.spouse_id),
    [members]
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

  async function invite() {
    if (!f.name.trim() || !f.email.trim()) {
      toast("Preencha nome e email.");
      return;
    }

    const normalizedEmail = f.email.trim().toLowerCase();

    const { data: existingUser, error: existingUserError } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existingUserError) {
      console.error("Erro ao verificar email:", existingUserError);
      toast("Erro ao verificar email.");
      return;
    }

    if (existingUser) {
      toast("Email ja cadastrado.");
      return;
    }

    const pw = generateTempPassword();
    const pwHash = hashPassword(pw);
    const now = new Date().toISOString();
    const newUserId = genId();

    const { data: newUser, error: newUserError } = await supabase
      .from("users")
      .insert({
        id: newUserId,
        church_id: user.church_id,
        email: normalizedEmail,
        password_hash: pwHash,
        name: f.name.trim(),
        phone: f.phone.trim(),
        role: f.role,
        status: "active",
        avatar_color: `hsl(${Math.floor(Math.random() * 360)}, 40%, 55%)`,
        photo_url: null,
        spouse_id: f.spouseId || null,
        availability: [true, true, true, true, true, true, true],
        total_schedules: 0,
        confirm_rate: 100,
        must_change_password: true,
        last_served_at: null,
        notes: "",
        active: true,
        joined_at: now,
        created_at: now,
      })
      .select()
      .single();

    if (newUserError || !newUser) {
      console.error("Erro ao criar usuário:", newUserError);
      toast("Erro ao criar conta.");
      return;
    }

    if (selectedDepartments.length > 0) {
      const payload = selectedDepartments.map((dept) => ({
        id: genId(),
        department_id: dept.department_id,
        user_id: newUser.id,
        function_name: dept.function_name.trim(),
        joined_at: now,
      }));

      const { error: deptMemberError } = await supabase
        .from("department_members")
        .insert(payload);

      if (deptMemberError) {
        console.error("Erro ao vincular ministérios:", deptMemberError);
        toast("Usuário criado, mas houve erro ao vincular aos ministerios.");
        return;
      }
    }

    if (f.spouseId) {
      const { error: spouseUpdateError } = await supabase
        .from("users")
        .update({ spouse_id: newUser.id })
        .eq("id", f.spouseId);

      if (spouseUpdateError) {
        console.error("Erro ao atualizar cônjuge:", spouseUpdateError);
      }
    }

    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        id: genId(),
        user_id: newUser.id,
        church_id: user.church_id,
        title: "Bem-vindo ao Servos!",
        body: "Configure sua disponibilidade e comece a servir.",
        icon: "wave",
        type: "welcome",
        read: false,
        action_url: "/perfil",
        created_at: now,
      });

    if (notificationError) {
      console.error("Erro ao criar notificação:", notificationError);
    }

    try {
      const response = await fetch("/api/send-welcome-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: normalizedEmail,
          memberName: f.name.trim(),
          churchName: church?.name || "Sua Igreja",
          tempPassword: pw,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("Erro ao enviar email de boas-vindas:", errorData || response.statusText);
      }
    } catch (err) {
      console.error("Erro ao enviar email de boas-vindas:", err);
    }

    setCreatedName(f.name.trim());
    setCreatedEmail(normalizedEmail);
    setTempPw(pw);
  }

  if (tempPw) {
    return (
      <div className="max-w-[440px] mx-auto text-center">
        <div className="card p-8">
          <div className="text-4xl mb-3">&#9989;</div>
          <h2 className="font-display text-2xl mb-2">{createdName}</h2>
          <p className="text-sm text-ink-muted mb-6">Conta criada. Envie as credenciais abaixo.</p>

          <div className="bg-surface-alt rounded-[14px] p-5 text-left mb-5">
            <div className="text-[10px] font-bold text-ink-faint uppercase tracking-wider mb-2">
              Credenciais
            </div>
            <div className="text-sm mb-1">
              <span className="text-ink-muted">Email:</span> <strong>{createdEmail}</strong>
            </div>
            <div className="text-sm">
              <span className="text-ink-muted">Senha temporaria:</span>{" "}
              <strong className="text-brand font-mono text-base">{tempPw}</strong>
            </div>
          </div>

          <div className="bg-amber-light rounded-[10px] p-3 text-xs text-amber border border-amber/10 mb-5">
            O membro devera alterar a senha no primeiro acesso.
          </div>

          <button
            onClick={() => {
              navigator.clipboard?.writeText(`Email: ${createdEmail}\nSenha: ${tempPw}`);
              toast("Copiado!");
            }}
            className="btn btn-secondary w-full mb-2"
          >
            Copiar credenciais
          </button>

          <button onClick={() => router.push("/membros")} className="btn btn-primary w-full">
            Concluir
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[760px] mx-auto">
      <div className="mb-6">
        <h1 className="page-title">Convidar Membro</h1>
        <p className="page-subtitle">Adicione um novo voluntario com acesso ao app.</p>
      </div>

      <div className="card p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="input-label">Nome completo</label>
            <input
              className="input-field"
              value={f.name}
              onChange={(e) => u("name", e.target.value)}
              placeholder="Nome do voluntario"
            />
          </div>

          <div>
            <label className="input-label">Email (sera o login)</label>
            <input
              type="email"
              className="input-field"
              value={f.email}
              onChange={(e) => u("email", e.target.value)}
              placeholder="email@exemplo.com"
            />
          </div>

          <div>
            <label className="input-label">Telefone</label>
            <input
              className="input-field"
              value={f.phone}
              onChange={(e) => u("phone", e.target.value)}
              placeholder="(00) 00000-0000"
            />
          </div>

          <div>
            <label className="input-label">Perfil de acesso</label>
            <select
              className="input-field"
              value={f.role}
              onChange={(e) => u("role", e.target.value as MemberRole)}
            >
              <option value="member">Membro</option>
              <option value="leader">Lider</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <div className="col-span-2">
            <label className="input-label">Vincular como casal (opcional)</label>
            <select
              className="input-field"
              value={f.spouseId}
              onChange={(e) => u("spouseId", e.target.value)}
              disabled={loadingMembers}
            >
              <option value="">Nenhum</option>
              {availableSpouses.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
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

        <div className="bg-surface-alt rounded-[10px] px-4 py-3">
          <div className="text-xs font-semibold text-ink-soft mb-1">&#128274; Sobre a senha</div>
          <div className="text-xs text-ink-muted">
            Uma senha temporaria sera gerada. Voce recebera as credenciais para enviar ao membro.
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={() => router.back()} className="btn btn-secondary flex-1">
            Cancelar
          </button>
          <button onClick={invite} className="btn btn-primary flex-1">
            Criar conta
          </button>
        </div>
      </div>
    </div>
  );
}