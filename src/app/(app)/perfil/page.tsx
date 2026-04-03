"use client";
import { useState, useRef } from "react";
import { useApp } from "@/hooks/use-app";
import { getDB } from "@/lib/db/local-db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { updateSession } from "@/lib/auth/session";
import { DAY_LABELS } from "@/lib/ai/engine";
import { getInitials } from "@/lib/utils/helpers";
import { AvailabilityEditor } from "@/components/ui";

export default function PerfilPage() {
  const { user, toast } = useApp();
  const db = getDB();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"perfil" | "senha">(user.must_change_password ? "senha" : "perfil");

  // Profile
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || "");
  const [photoUrl, setPhotoUrl] = useState(user.photo_url || "");
  const [avail, setAvail] = useState([...(user.availability || [true,true,true,true,true,true,true])]);

  // Password
  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast("Imagem muito grande (max 2MB)."); return; }
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

  function saveProfile() {
    db.update("users", user.id, {
      name, phone, availability: avail,
      photo_url: photoUrl || null,
    });
    updateSession({ name });
    toast("Perfil atualizado!");
    location.href = "/perfil";
  }

  function changePassword() {
    if (!curPw || !newPw) { toast("Preencha todos os campos."); return; }
    if (newPw.length < 6) { toast("Minimo 6 caracteres."); return; }
    if (newPw !== confirmPw) { toast("As senhas nao coincidem."); return; }
    if (!verifyPassword(curPw, user.password_hash)) { toast("Senha atual incorreta."); return; }
    const hash = hashPassword(newPw);
    db.update("users", user.id, { password_hash: hash, must_change_password: false });
    setCurPw(""); setNewPw(""); setConfirmPw("");
    toast("Senha alterada com sucesso!");
  }

  return (
    <div className="max-w-[600px]">
      <div className="mb-6"><h1 className="page-title">Meu Perfil</h1></div>

      {user.must_change_password && (
        <div className="bg-amber-light text-amber text-sm px-4 py-3 rounded-[14px] border border-amber/10 mb-5 flex items-center gap-2">
          &#9888; Voce esta usando uma senha temporaria.
          <button onClick={() => setTab("senha")} className="font-bold underline">Altere agora</button>.
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-surface-alt rounded-[10px] p-0.5 w-fit">
        <button onClick={() => setTab("perfil")} className={`px-4 py-1.5 rounded-lg text-[13px] font-medium ${tab === "perfil" ? "bg-surface text-ink font-semibold shadow-sm" : "text-ink-muted"}`}>Perfil</button>
        <button onClick={() => setTab("senha")} className={`px-4 py-1.5 rounded-lg text-[13px] font-medium ${tab === "senha" ? "bg-surface text-ink font-semibold shadow-sm" : "text-ink-muted"}`}>Senha</button>
      </div>

      {tab === "perfil" && (
        <div className="card p-6 space-y-5">
          {/* Photo upload */}
          <div className="flex items-center gap-5">
            <div className="relative group">
              {photoUrl ? (
                <img src={photoUrl} alt="Foto" className="w-20 h-20 rounded-full object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold" style={{ background: user.avatar_color }}>
                  {getInitials(user.name)}
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
                {user.role === "admin" ? "Administrador" : user.role === "leader" ? "Lider" : "Membro"}
              </div>
              <div className="flex gap-2">
                <button onClick={() => fileInputRef.current?.click()} className="btn btn-secondary btn-sm">
                  {photoUrl ? "Trocar foto" : "Adicionar foto"}
                </button>
                {photoUrl && (
                  <button onClick={removePhoto} className="btn btn-ghost btn-sm text-danger">Remover</button>
                )}
              </div>
            </div>
          </div>

          <div><label className="input-label">Nome</label><input className="input-field" value={name} onChange={e => setName(e.target.value)} /></div>
          <div><label className="input-label">Telefone</label><input className="input-field" value={phone} onChange={e => setPhone(e.target.value)} /></div>

          <div>
            <label className="input-label">Disponibilidade semanal</label>
            <AvailabilityEditor availability={avail} onChange={setAvail} />
          </div>

          <button onClick={saveProfile} className="btn btn-primary">Salvar perfil</button>
        </div>
      )}

      {tab === "senha" && (
        <div className="card p-6 space-y-4">
          <div><label className="input-label">Senha atual</label><input type="password" className="input-field" value={curPw} onChange={e => setCurPw(e.target.value)} /></div>
          <div><label className="input-label">Nova senha (min. 6 caracteres)</label><input type="password" className="input-field" value={newPw} onChange={e => setNewPw(e.target.value)} /></div>
          <div><label className="input-label">Confirmar nova senha</label><input type="password" className="input-field" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} /></div>
          <button onClick={changePassword} className="btn btn-primary">Alterar senha</button>
        </div>
      )}
    </div>
  );
}
