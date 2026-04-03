"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getDB } from "@/lib/db/local-db";
import { getSession } from "@/lib/auth/session";
import { generateTempPassword, hashPassword } from "@/lib/auth/password";
import { getIconEmoji } from "@/lib/utils/helpers";

const STEPS = [
  { id: "welcome", title: "Bem-vindo ao Servos!", subtitle: "Vamos configurar sua igreja em poucos passos." },
  { id: "church", title: "Sua Igreja", subtitle: "Complete as informacoes da sua igreja." },
  { id: "department", title: "Primeiro Ministerio", subtitle: "Crie o primeiro ministerio da sua igreja." },
  { id: "invite", title: "Convide Alguem", subtitle: "Traga um lider ou membro para servir com voce." },
  { id: "event", title: "Primeiro Evento", subtitle: "Configure o culto principal da sua igreja." },
  { id: "done", title: "Tudo pronto!", subtitle: "Seu ministerio esta organizado. Vamos servir." },
];

const DEPT_ICONS = [
  { value: "music", label: "Louvor" },
  { value: "camera", label: "Midia" },
  { value: "heart", label: "Recepcao" },
  { value: "baby", label: "Infantil" },
  { value: "pray", label: "Intercessao" },
  { value: "church", label: "Outro" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const db = getDB();
  const session = getSession();
  const [step, setStep] = useState(0);

  // Church
  const [churchCity, setChurchCity] = useState("");

  // Department
  const [deptName, setDeptName] = useState("Louvor");
  const [deptIcon, setDeptIcon] = useState("music");

  // Invite
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [tempPw, setTempPw] = useState<string | null>(null);

  // Event
  const [eventName, setEventName] = useState("Culto de Domingo");
  const [eventTime, setEventTime] = useState("18:00");

  if (!session) { router.replace("/login"); return null; }
  const user = db.getById("users", session.user_id);
  const church = db.getById("churches", session.church_id);
  if (!user || !church) { router.replace("/login"); return null; }

  function next() {
    const current = STEPS[step].id;

    if (current === "church") {
      db.update("churches", church.id, { city: churchCity });
    }

    if (current === "department" && deptName) {
      const existing = db.getWhere("departments", { church_id: church.id });
      if (!existing.some((d: any) => d.name === deptName)) {
        const dept = db.insert("departments", {
          church_id: church.id, name: deptName, description: "", icon: deptIcon,
          color: "#D4A574", leader_ids: [user.id], co_leader_ids: [], active: true,
        });
        db.insert("department_members", {
          department_id: dept.id, user_id: user.id, function_name: "Lider",
          joined_at: new Date().toISOString(),
        });
      }
    }

    if (current === "invite" && inviteName && inviteEmail) {
      if (!db.getUserByEmail(inviteEmail)) {
        const pw = generateTempPassword();
        const pwHash = hashPassword(pw);
        db.insert("users", {
          church_id: church.id, email: inviteEmail.toLowerCase(),
          password_hash: pwHash,
          name: inviteName, phone: "", role: "member", status: "active",
          avatar_color: `hsl(${Math.floor(Math.random() * 360)},40%,55%)`,
          photo_url: null, spouse_id: null, availability: [true,true,true,true,true,true,true],
          total_schedules: 0, confirm_rate: 100, must_change_password: true,
          last_served_at: null, notes: "", active: true, joined_at: new Date().toISOString(),
        });
        setTempPw(pw);
      }
    }

    if (current === "event" && eventName) {
      const existing = db.getWhere("events", { church_id: church.id });
      if (!existing.some((e: any) => e.name === eventName)) {
        db.insert("events", {
          church_id: church.id, name: eventName, description: "", type: "recurring",
          icon: "church", location: "", base_time: eventTime, instructions: "",
          recurrence: "weekly", active: true,
        });
      }
    }

    if (current === "done") {
      const op = db.getWhere("onboarding_progress", { church_id: church.id });
      if (op.length > 0) {
        db.update("onboarding_progress", op[0].id, { completed: true, completed_steps: STEPS.map(s => s.id) });
      }
      router.push("/dashboard");
      return;
    }

    setStep(s => Math.min(s + 1, STEPS.length - 1));
  }

  function skip() { setStep(s => Math.min(s + 1, STEPS.length - 1)); }

  const current = STEPS[step];
  const progress = ((step) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-[480px]">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="h-1 bg-border-soft rounded-full overflow-hidden">
            <div className="h-full bg-brand rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[10px] text-ink-faint">Passo {step + 1} de {STEPS.length}</span>
            {step > 0 && step < STEPS.length - 1 && (
              <button onClick={skip} className="text-[10px] text-ink-faint hover:text-brand transition-colors">Pular</button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border-soft shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            {step === 0 && (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand to-brand-deep flex items-center justify-center shadow-lg shadow-brand/30 mx-auto mb-5">
                <svg viewBox="0 0 24 24" fill="none" width="32" height="32"><path d="M12 3C8 3 5 7.5 5 12C5 16.5 8 21 12 24C16 21 19 16.5 19 12C19 7.5 16 3 12 3Z" fill="rgba(255,255,255,.3)"/><circle cx="12" cy="12.5" r="2.5" fill="white"/></svg>
              </div>
            )}
            {step === STEPS.length - 1 && <div className="text-5xl mb-4">&#127881;</div>}
            <h2 className="font-display text-2xl mb-1">{current.title}</h2>
            <p className="text-sm text-ink-muted">{current.subtitle}</p>
          </div>

          {/* Welcome */}
          {current.id === "welcome" && (
            <div className="space-y-3 mb-6">
              {["Criar ministerios", "Montar escalas inteligentes", "Confirmar presenca com 1 toque", "Manter tudo organizado"].map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <div className="w-6 h-6 rounded-full bg-success-light flex items-center justify-center text-success text-xs font-bold">{"\u2713"}</div>
                  <span className="text-sm text-ink-soft">{item}</span>
                </div>
              ))}
            </div>
          )}

          {/* Church */}
          {current.id === "church" && (
            <div className="space-y-4 mb-6">
              <div>
                <label className="input-label">Nome da igreja</label>
                <input className="input-field" value={church.name} disabled />
              </div>
              <div>
                <label className="input-label">Cidade</label>
                <input className="input-field" placeholder="Ex: Fortaleza, CE" value={churchCity} onChange={e => setChurchCity(e.target.value)} autoFocus />
              </div>
            </div>
          )}

          {/* Department */}
          {current.id === "department" && (
            <div className="space-y-4 mb-6">
              <div>
                <label className="input-label">Nome do ministerio</label>
                <input className="input-field" placeholder="Ex: Louvor" value={deptName} onChange={e => setDeptName(e.target.value)} autoFocus />
              </div>
              <div>
                <label className="input-label">Icone</label>
                <div className="flex flex-wrap gap-2">
                  {DEPT_ICONS.map(ic => (
                    <button key={ic.value} type="button" onClick={() => { setDeptIcon(ic.value); if (!deptName || DEPT_ICONS.some(x => x.label === deptName)) setDeptName(ic.label); }}
                      className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 border-2 transition-all ${deptIcon === ic.value ? "border-brand bg-brand-light font-semibold" : "border-border-soft"}`}>
                      {getIconEmoji(ic.value)} {ic.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Invite */}
          {current.id === "invite" && (
            <div className="space-y-4 mb-6">
              {tempPw ? (
                <div className="text-center">
                  <div className="text-3xl mb-3">&#9989;</div>
                  <p className="text-sm font-semibold mb-2">{inviteName} convidado!</p>
                  <div className="bg-surface-alt rounded-[14px] p-4 text-left text-sm mb-3">
                    <div className="text-ink-muted mb-1">Email: <strong className="text-ink">{inviteEmail}</strong></div>
                    <div className="text-ink-muted">Senha: <strong className="text-brand font-mono">{tempPw}</strong></div>
                  </div>
                  <p className="text-xs text-ink-faint">Envie essas credenciais para o membro.</p>
                </div>
              ) : (
                <>
                  <div><label className="input-label">Nome</label><input className="input-field" placeholder="Nome do membro" value={inviteName} onChange={e => setInviteName(e.target.value)} autoFocus /></div>
                  <div><label className="input-label">Email</label><input type="email" className="input-field" placeholder="email@exemplo.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} /></div>
                </>
              )}
            </div>
          )}

          {/* Event */}
          {current.id === "event" && (
            <div className="space-y-4 mb-6">
              <div><label className="input-label">Nome do evento</label><input className="input-field" value={eventName} onChange={e => setEventName(e.target.value)} autoFocus /></div>
              <div><label className="input-label">Horario</label><input type="time" className="input-field" value={eventTime} onChange={e => setEventTime(e.target.value)} /></div>
            </div>
          )}

          {/* Done */}
          {current.id === "done" && (
            <div className="space-y-3 mb-6">
              {["Igreja configurada", "Ministerio criado", inviteName ? `${inviteName} convidado` : "Membro pode ser convidado depois", `${eventName} criado`].map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-1.5">
                  <div className="w-5 h-5 rounded-full bg-success-light flex items-center justify-center text-success text-[10px] font-bold">{"\u2713"}</div>
                  <span className="text-sm text-ink-soft">{item}</span>
                </div>
              ))}
            </div>
          )}

          {/* Action */}
          <button onClick={next} className="btn btn-primary w-full py-3 text-base">
            {current.id === "done" ? "Ir para o Dashboard" : current.id === "welcome" ? "Comecar" : "Continuar"}
          </button>
        </div>
      </div>
    </div>
  );
}
