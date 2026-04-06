"use client";

import { useState, useRef } from "react";
import { useApp } from "@/hooks/use-app";
import { updateSession } from "@/lib/auth/session";
import { getInitials } from "@/lib/utils/helpers";
import { AvailabilityEditor } from "@/components/ui";

export default function PerfilPage() {
  const { user, toast, refresh } = useApp();
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

  async function saveProfile() {
    if (!name.trim()) {
      toast("Informe seu nome.");
      return;
    }

    setSavingProfile(true);

    try {
      const response = await fetch("/api/profile/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
      toast("As senhas nao coincidem.");
      return;
    }

    setSavingPassword(true);

    try {
      const response = await fetch("/api/profile/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
    <div className="max-w-[600px]">
      <div className="mb-6">
        <h1 className="page-title">Meu Perfil</h1>
      </div>

      {user.must_change_password && (
        <div className="bg-amber-light text-amber text-sm px-4 py-3 rounded-[14px] border border-amber/10 mb-5 flex items-center gap-2">
          &#9888; Voce esta usando uma senha temporaria.
          <button onClick={() => setTab("senha")} className="font-bold underline">
            Altere agora
          </button>
          .
        </div>
      )}

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
                  ? "Lider"
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
