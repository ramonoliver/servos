"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/hooks/use-app";
import { getDB } from "@/lib/db/local-db";
import { generateTempPassword, hashPassword } from "@/lib/auth/password";
import { sendWelcomeEmail } from "@/lib/email/send";
import type { User } from "@/types";

export default function ConvidarMembroPage() {
  const { user, toast, departments } = useApp();
  const db = getDB();
  const router = useRouter();
  const members = db.getWhere<User>("users", { church_id: user.church_id }).filter(u => u.active);

  const [f, setF] = useState({ name: "", email: "", phone: "", dept: departments[0]?.id || "", func: "", role: "member" as string, spouseId: "" });
  const [tempPw, setTempPw] = useState<string | null>(null);
  const [createdName, setCreatedName] = useState("");
  const [createdEmail, setCreatedEmail] = useState("");
  const u = (k: string, v: string) => setF(p => ({ ...p, [k]: v }));

  async function invite() {
    if (!f.name || !f.email) { toast("Preencha nome e email."); return; }
    if (db.getUserByEmail(f.email)) { toast("Email ja cadastrado."); return; }
    const pw = generateTempPassword();
    const pwHash = hashPassword(pw);
    const newUser = db.insert("users", {
      church_id: user.church_id, email: f.email.toLowerCase(), password_hash: pwHash, name: f.name, phone: f.phone,
      role: f.role, status: "active", avatar_color: `hsl(${Math.floor(Math.random() * 360)},40%,55%)`,
      photo_url: null, spouse_id: f.spouseId || null, availability: [true,true,true,true,true,true,true],
      total_schedules: 0, confirm_rate: 100, must_change_password: true, last_served_at: null, notes: "",
      active: true, joined_at: new Date().toISOString(),
    });
    if (f.dept) db.insert("department_members", { department_id: f.dept, user_id: newUser.id, function_name: f.func, joined_at: new Date().toISOString() });
    if (f.spouseId) db.update("users", f.spouseId, { spouse_id: newUser.id });
    db.insert("notifications", { user_id: newUser.id, church_id: user.church_id, title: "Bem-vindo ao Servos!", body: "Configure sua disponibilidade e comece a servir.", icon: "wave", type: "welcome", read: false, action_url: "/perfil" });

    // Send welcome email
    const church = db.getById("churches", user.church_id);
    sendWelcomeEmail({
      to: f.email.toLowerCase(),
      memberName: f.name,
      churchName: church?.name || "Sua Igreja",
      tempPassword: pw,
    });

    setCreatedName(f.name);
    setCreatedEmail(f.email);
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
            <div className="text-[10px] font-bold text-ink-faint uppercase tracking-wider mb-2">Credenciais</div>
            <div className="text-sm mb-1"><span className="text-ink-muted">Email:</span> <strong>{createdEmail}</strong></div>
            <div className="text-sm"><span className="text-ink-muted">Senha temporaria:</span> <strong className="text-brand font-mono text-base">{tempPw}</strong></div>
          </div>
          <div className="bg-amber-light rounded-[10px] p-3 text-xs text-amber border border-amber/10 mb-5">O membro devera alterar a senha no primeiro acesso.</div>
          <button onClick={() => { navigator.clipboard?.writeText(`Email: ${createdEmail}\nSenha: ${tempPw}`); toast("Copiado!"); }} className="btn btn-secondary w-full mb-2">Copiar credenciais</button>
          <button onClick={() => router.push("/membros")} className="btn btn-primary w-full">Concluir</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[500px] mx-auto">
      <div className="mb-6"><h1 className="page-title">Convidar Membro</h1><p className="page-subtitle">Adicione um novo voluntario.</p></div>
      <div className="card p-6 space-y-4">
        <div><label className="input-label">Nome completo</label><input className="input-field" value={f.name} onChange={e => u("name", e.target.value)} placeholder="Nome do voluntario" /></div>
        <div><label className="input-label">Email (sera o login)</label><input type="email" className="input-field" value={f.email} onChange={e => u("email", e.target.value)} placeholder="email@exemplo.com" /></div>
        <div><label className="input-label">Telefone</label><input className="input-field" value={f.phone} onChange={e => u("phone", e.target.value)} placeholder="(00) 00000-0000" /></div>
        <div><label className="input-label">Ministerio</label><select className="input-field" value={f.dept} onChange={e => u("dept", e.target.value)}><option value="">Nenhum</option>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
        <div><label className="input-label">Funcao</label><input className="input-field" value={f.func} onChange={e => u("func", e.target.value)} placeholder="Ex: Vocal, Guitarra..." /></div>
        <div><label className="input-label">Perfil de acesso</label><select className="input-field" value={f.role} onChange={e => u("role", e.target.value)}><option value="member">Membro</option><option value="leader">Lider</option><option value="admin">Administrador</option></select></div>
        <div><label className="input-label">Vincular como casal (opcional)</label><select className="input-field" value={f.spouseId} onChange={e => u("spouseId", e.target.value)}><option value="">Nenhum</option>{members.filter(m => !m.spouse_id).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
        <div className="bg-surface-alt rounded-[10px] px-4 py-3"><div className="text-xs font-semibold text-ink-soft mb-1">&#128274; Sobre a senha</div><div className="text-xs text-ink-muted">Uma senha temporaria sera gerada. Voce recebera as credenciais para enviar ao membro.</div></div>
        <div className="flex gap-3 pt-2">
          <button onClick={() => router.back()} className="btn btn-secondary flex-1">Cancelar</button>
          <button onClick={invite} className="btn btn-primary flex-1">Criar conta</button>
        </div>
      </div>
    </div>
  );
}
