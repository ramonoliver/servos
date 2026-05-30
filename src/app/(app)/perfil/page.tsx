"use client";

import { useEffect, useRef, useState } from "react";
import { useApp } from "@/hooks/use-app";
import { updateSession } from "@/lib/auth/session";
import { getInitials } from "@/lib/utils/helpers";
import { AvailabilityEditor, Skeleton, PageHeader } from "@/components/ui";

export default function PerfilPage() {
  const { user, toast, refresh, pushPermission, pushEnabled, registeringPush, enablePushNotifications, retryPushNotifications } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"perfil" | "senha">(
    user.must_change_password ? "senha" : "perfil"
  );

  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || "");
  const [photoUrl, setPhotoUrl] = useState(user.photo_url || "");
  const [avail, setAvail] = useState([
    ...(user.availability || [true, true, true, true, true, true, true]),
  ]);

  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurPw, setShowCurPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileSummary, setProfileSummary] = useState<{
    monthPoints: number;
    badges: Array<{ id: string; name: string; description: string; icon: string; unlockedAt: string }>;
    pushEnabled: boolean;
  } | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState("");

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast("Imagem muito grande (max 2MB).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setPhotoUrl(result);
    };
    reader.readAsDataURL(file);
  }

  function removePhoto() {
    setPhotoUrl("");
  }

  useEffect(() => {
    async function loadProfileSummary() {
      setSummaryLoading(true);
      setSummaryError("");
      try {
        const authToken = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("servos_session") || "null")?.token : null;
        const response = await fetch("/api/profile/summary", {
          credentials: "include",
          headers: authToken ? { "x-servos-auth": authToken } : undefined,
        });
        const data = await response.json().catch(() => null);
        if (response.ok && data?.success) {
          setProfileSummary(data.profile);
        } else {
          setSummaryError("Não foi possível carregar seu resumo agora.");
        }
      } catch (error) {
        console.error("Erro ao carregar resumo do perfil:", error);
        setSummaryError("Não foi possível carregar seu resumo agora.");
      } finally {
        setSummaryLoading(false);
      }
    }

    void loadProfileSummary();
  }, []);

  async function saveProfile() {
    if (!name.trim()) {
      toast("Informe seu nome.");
      return;
    }

    setSavingProfile(true);
    try {
      const authToken = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("servos_session") || "null")?.token : null;
      const response = await fetch("/api/profile/update", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { "x-servos-auth": authToken } : {}),
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          availability: avail,
          photoUrl: photoUrl || null,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        console.error("Erro ao atualizar perfil:", data);
        toast("Erro ao atualizar perfil.");
        return;
      }

      updateSession({ name: name.trim() });
      await refresh();
      toast("Perfil atualizado!");
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      toast("Erro ao atualizar perfil.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword() {
    if (!curPw || !newPw || !confirmPw) {
      toast("Preencha todos os campos.");
      return;
    }

    if (newPw.length < 6) {
      toast("Minimo 6 caracteres.");
      return;
    }

    if (newPw !== confirmPw) {
      toast("As senhas não coincidem.");
      return;
    }

    setSavingPassword(true);
    try {
      const authToken = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("servos_session") || "null")?.token : null;
      const response = await fetch("/api/profile/change-password", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { "x-servos-auth": authToken } : {}),
        },
        body: JSON.stringify({
          currentPassword: curPw,
          newPassword: newPw,
          confirmPassword: confirmPw,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        toast(data?.error || "Erro ao alterar senha.");
        return;
      }

      setCurPw("");
      setNewPw("");
      setConfirmPw("");
      await refresh();
      toast("Senha alterada com sucesso!");
    } catch (error) {
      console.error("Erro ao alterar senha:", error);
      toast("Erro ao alterar senha.");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="w-full">
      <PageHeader className="mb-6" eyebrow="Conta" title="Meu Perfil" />

      {user.must_change_password && (
        <div className="bg-amber-light text-amber text-sm px-4 py-3 rounded-[14px] border border-amber/10 mb-5 flex items-center gap-2">
          &#9888; Você está usando uma senha temporária.
          <button onClick={() => setTab("senha")} className="font-bold underline">
            Altere agora
          </button>
          .
        </div>
      )}

      {summaryLoading ? (
        <div className="grid gap-3 mb-5 md:grid-cols-3">
          <Skeleton className="h-[140px] rounded-[18px]" />
          <Skeleton className="h-[140px] rounded-[18px] md:col-span-2" />
        </div>
      ) : summaryError ? (
        <div className="rounded-[14px] border border-amber/20 bg-amber-light px-4 py-3 mb-5 text-sm text-amber flex items-center justify-between gap-3">
          <span>{summaryError}</span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => window.location.reload()}
          >
            Tentar novamente
          </button>
        </div>
      ) : profileSummary && (
        <div className="grid gap-3 mb-5 md:grid-cols-3">
          <div className="rounded-[18px] border border-border-soft bg-white p-5 shadow-sm">
            <div className="text-[11px] uppercase tracking-[0.24em] text-ink-faint mb-2">Pontos este mês</div>
            <div className="text-3xl font-display text-brand">{profileSummary.monthPoints}</div>
            <div className="text-xs text-ink-muted mt-2">Ganhos por confirmação, presença e apoio ao time.</div>
          </div>
          <div className="rounded-[18px] border border-border-soft bg-white p-5 shadow-sm md:col-span-2">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="text-[11px] uppercase tracking-[0.24em] text-ink-faint">Conquistas</div>
              <div className="text-[11px] text-ink-muted">{profileSummary.badges.length} desbloqueada(s)</div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {profileSummary.badges.length > 0 ? (
                profileSummary.badges.map((badge) => (
                  <div key={badge.id} className="rounded-[14px] border border-border-soft bg-surface-alt p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-brand-light text-brand text-sm">{badge.icon}</span>
                      <div>
                        <div className="text-sm font-semibold">{badge.name}</div>
                        <div className="text-[11px] text-ink-faint">{new Date(badge.unlockedAt).toLocaleDateString("pt-BR")}</div>
                      </div>
                    </div>
                    <p className="text-[12px] text-ink-muted">{badge.description}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-ink-faint">Nenhuma conquista desbloqueada ainda. Confirme sua presença e ajude o time!</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-[14px] border border-border-soft bg-white px-4 py-3 mb-5">
        <div className="text-[11px] uppercase tracking-[0.2em] text-ink-faint mb-2">Notificações push</div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-ink-muted">
            {pushPermission === "granted"
              ? pushEnabled
                ? "Ativas neste dispositivo."
                : "Permissão concedida, finalize o registro do dispositivo."
              : pushPermission === "denied"
              ? "Bloqueadas no navegador. Reative nas configurações do site."
              : pushPermission === "default"
              ? "Desativadas. Ative para receber lembretes e avisos importantes."
              : "Este navegador não suporta notificações push."}
          </div>
          {pushPermission === "default" && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => void enablePushNotifications()}
              disabled={registeringPush}
            >
              {registeringPush ? "Ativando..." : "Ativar notificações"}
            </button>
          )}
          {pushPermission === "granted" && !pushEnabled && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => void retryPushNotifications()}
              disabled={registeringPush}
            >
              {registeringPush ? "Registrando..." : "Tentar novamente"}
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-1 mb-5 bg-surface-alt rounded-[10px] p-0.5 w-fit">
        <button
          onClick={() => setTab("perfil")}
          className={`px-4 py-1.5 rounded-lg text-[13px] font-medium ${
            tab === "perfil"
              ? "bg-surface text-ink font-semibold shadow-sm"
              : "text-ink-muted"
          }`}
        >
          Perfil
        </button>
        <button
          onClick={() => setTab("senha")}
          className={`px-4 py-1.5 rounded-lg text-[13px] font-medium ${
            tab === "senha"
              ? "bg-surface text-ink font-semibold shadow-sm"
              : "text-ink-muted"
          }`}
        >
          Senha
        </button>
      </div>

      {tab === "perfil" && (
        <div className="card p-6 space-y-5">
          <div className="flex items-center gap-5">
            <div className="relative group">
              {photoUrl ? (
                <img src={photoUrl} alt="Foto" className="w-20 h-20 rounded-full object-cover" />
              ) : (
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                  style={{ background: user.avatar_color }}
                >
                  {getInitials(name || user.name)}
                </div>
              )}

              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-ink/0 group-hover:bg-ink/40 flex items-center justify-center transition-all cursor-pointer"
              >
                <span className="text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  {photoUrl ? "Trocar" : "Adicionar"}
                </span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>

            <div>
              <div className="text-sm font-semibold">{user.email}</div>
              <div className="text-xs text-ink-faint capitalize mb-2">
                {user.role === "admin"
                  ? "Administrador"
                  : user.role === "leader"
                  ? "Líder"
                  : "Membro"}
              </div>

              <div className="flex gap-2">
                <button onClick={() => fileInputRef.current?.click()} className="btn btn-secondary btn-sm">
                  {photoUrl ? "Trocar foto" : "Adicionar foto"}
                </button>

                {photoUrl && (
                  <button onClick={removePhoto} className="btn btn-ghost btn-sm text-danger">
                    Remover
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="input-label">Nome</label>
            <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <label className="input-label">Telefone</label>
            <input className="input-field" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <div>
            <label className="input-label">Disponibilidade semanal</label>
            <AvailabilityEditor availability={avail} onChange={setAvail} />
          </div>

          <button onClick={saveProfile} disabled={savingProfile} className="btn btn-primary">
            {savingProfile ? "Salvando..." : "Salvar perfil"}
          </button>
        </div>
      )}

      {tab === "senha" && (
        <div className="card p-6 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="input-label mb-0">Senha atual</label>
              <button type="button" onClick={() => setShowCurPw((value) => !value)} className="text-xs font-semibold text-brand hover:underline">
                {showCurPw ? "Ocultar" : "Ver senha"}
              </button>
            </div>
            <input
              type={showCurPw ? "text" : "password"}
              className="input-field"
              value={curPw}
              onChange={(e) => setCurPw(e.target.value)}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="input-label mb-0">Nova senha (min. 6 caracteres)</label>
              <button type="button" onClick={() => setShowNewPw((value) => !value)} className="text-xs font-semibold text-brand hover:underline">
                {showNewPw ? "Ocultar" : "Ver senha"}
              </button>
            </div>
            <input
              type={showNewPw ? "text" : "password"}
              className="input-field"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="input-label mb-0">Confirmar nova senha</label>
              <button type="button" onClick={() => setShowConfirmPw((value) => !value)} className="text-xs font-semibold text-brand hover:underline">
                {showConfirmPw ? "Ocultar" : "Ver senha"}
              </button>
            </div>
            <input
              type={showConfirmPw ? "text" : "password"}
              className="input-field"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
            />
          </div>

          <button onClick={changePassword} disabled={savingPassword} className="btn btn-primary">
            {savingPassword ? "Alterando..." : "Alterar senha"}
          </button>
        </div>
      )}
    </div>
  );
}
