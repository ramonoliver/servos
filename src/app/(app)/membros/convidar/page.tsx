"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/hooks/use-app";
import { formatPhoneInput } from "@/lib/invitations";
import { supabase } from "@/lib/supabase/client";
import { getIconEmoji } from "@/lib/utils/helpers";
import type { User } from "@/types";

type MemberRole = "member" | "leader" | "admin";

type SelectedDepartment = {
  department_id: string;
  function_name: string;
};

type InviteDeliveryResult = {
  trackingEnabled?: boolean;
  email?: {
    status: "sent" | "failed";
    error: string | null;
  };
  whatsapp?: {
    status: "sent" | "failed" | "skipped";
    error: string | null;
    preview?: string | null;
  };
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
  const [inviteDelivery, setInviteDelivery] = useState<InviteDeliveryResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const u = (k: string, v: string) =>
    setF((p) => ({ ...p, [k]: k === "phone" ? formatPhoneInput(v) : v }));

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
    if (submitting) return;

    if (!f.name.trim() || !f.email.trim()) {
      toast("Preencha nome e email.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch("/api/member-invitations/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          churchId: user.church_id,
          churchName: church?.name || "Sua Igreja",
          invitedByUserId: user.id,
          name: f.name.trim(),
          email: f.email.trim(),
          phone: f.phone.trim(),
          role: f.role,
          spouseId: f.spouseId,
          selectedDepartments,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            error?: string;
            tempPassword?: string;
            member?: { name: string; email: string };
            delivery?: InviteDeliveryResult;
          }
        | null;

      if (!response.ok) {
        console.error("Erro ao criar convite:", payload || response.statusText);
        toast(payload?.error || "Nao foi possivel criar o convite.");
      } else {
        const delivery = payload?.delivery || null;
        setInviteDelivery(delivery || null);
        setCreatedName(payload?.member?.name || f.name.trim());
        setCreatedEmail(payload?.member?.email || f.email.trim().toLowerCase());
        setTempPw(payload?.tempPassword || null);

        if (delivery?.whatsapp?.status === "failed") {
          toast("Convite enviado por email, mas o WhatsApp falhou.");
        } else if (delivery?.whatsapp?.status === "skipped") {
          toast("Email enviado. WhatsApp aguardando configuracao.");
        } else {
          toast("Convite enviado com sucesso.");
        }
      }
    } catch (err) {
      console.error("Erro ao criar convite:", err);
      toast("Nao foi possivel criar o convite.");
    } finally {
      setSubmitting(false);
    }
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

          <div className="bg-white border border-border-soft rounded-[14px] p-4 text-left mb-5 space-y-2">
            <div className="text-[10px] font-bold text-ink-faint uppercase tracking-wider">
              Resumo do envio
            </div>
            <div className="rounded-xl bg-surface-alt p-3">
              <div className="text-sm flex items-center justify-between gap-3">
                <span>Email</span>
                <strong className={inviteDelivery?.email?.status === "sent" ? "text-success" : "text-danger"}>
                  {inviteDelivery?.email?.status === "sent" ? "Enviado" : "Falhou"}
                </strong>
              </div>
              {inviteDelivery?.email?.error && (
                <div className="text-[11px] text-danger mt-1">{inviteDelivery.email.error}</div>
              )}
            </div>
            <div className="rounded-xl bg-surface-alt p-3">
              <div className="text-sm flex items-center justify-between gap-3">
                <span>WhatsApp</span>
                <strong
                  className={
                    inviteDelivery?.whatsapp?.status === "sent"
                      ? "text-success"
                      : inviteDelivery?.whatsapp?.status === "skipped"
                      ? "text-amber"
                      : "text-danger"
                  }
                >
                  {inviteDelivery?.whatsapp?.status === "sent"
                    ? "Enviado"
                    : inviteDelivery?.whatsapp?.status === "skipped"
                    ? "Nao configurado"
                    : "Falhou"}
                </strong>
              </div>
              {inviteDelivery?.whatsapp?.error && (
                <div className="text-[11px] text-ink-faint mt-1">{inviteDelivery.whatsapp.error}</div>
              )}
            </div>
            <div className="text-xs text-ink-faint">
              Tracking de abertura:{" "}
              <strong className="text-ink">
                {inviteDelivery?.trackingEnabled ? "ativo" : "indisponivel"}
              </strong>
            </div>
            {inviteDelivery?.whatsapp?.preview && (
              <div className="rounded-xl bg-surface-alt p-3 text-xs text-ink-muted whitespace-pre-line">
                {inviteDelivery.whatsapp.preview}
              </div>
            )}
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
          <button
            onClick={() => {
              setTempPw(null);
              setCreatedName("");
              setCreatedEmail("");
              setInviteDelivery(null);
              setF({
                name: "",
                email: "",
                phone: "",
                role: "member",
                spouseId: "",
              });
              setSelectedDepartments([]);
            }}
            className="btn btn-ghost w-full mt-2"
          >
            Convidar outro membro
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
              inputMode="numeric"
            />
            <div className="text-[11px] text-ink-faint mt-1">
              Usado para envio automatico por WhatsApp quando configurado.
            </div>
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

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-[12px] border border-border-soft bg-white px-4 py-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">Email</div>
            <div className="text-sm font-medium mt-1">Convite principal</div>
            <div className="text-[11px] text-ink-faint mt-1">HTML com tracking de abertura</div>
          </div>
          <div className="rounded-[12px] border border-border-soft bg-white px-4 py-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">WhatsApp</div>
            <div className="text-sm font-medium mt-1">Envio automatico</div>
            <div className="text-[11px] text-ink-faint mt-1">Usa telefone do cadastro</div>
          </div>
          <div className="rounded-[12px] border border-border-soft bg-white px-4 py-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">Reenvio</div>
            <div className="text-sm font-medium mt-1">Depois na ficha</div>
            <div className="text-[11px] text-ink-faint mt-1">Gera nova senha temporaria</div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={() => router.back()} className="btn btn-secondary flex-1">
            Cancelar
          </button>
          <button onClick={invite} disabled={submitting} className="btn btn-primary flex-1">
            {submitting ? "Criando..." : "Criar conta"}
          </button>
        </div>
      </div>
    </div>
  );
}
