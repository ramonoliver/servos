"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { getSession } from "@/lib/auth/session";
import { getIconEmoji, genId } from "@/lib/utils/helpers";
import type { Church, User, Department, Event } from "@/types";

type OnboardingProgress = {
  id: string;
  church_id: string;
  completed_steps: string[];
  completed: boolean;
  created_at: string;
};

const STEPS = [
  { id: "welcome", title: "Bem-vindo ao Servos!", subtitle: "Vamos configurar sua igreja em poucos passos." },
  { id: "church", title: "Sua Igreja", subtitle: "Complete as informações da sua igreja." },
  { id: "department", title: "Primeiro Ministério", subtitle: "Crie o primeiro ministério da sua igreja." },
  { id: "invite", title: "Convide Alguem", subtitle: "Traga um lider ou membro para servir com voce." },
  { id: "event", title: "Primeiro Evento", subtitle: "Configure o culto principal da sua igreja." },
  { id: "done", title: "Tudo pronto!", subtitle: "Seu ministério está organizado. Vamos servir." },
] as const;

const DEPT_ICONS = [
  { value: "music", label: "Louvor" },
  { value: "camera", label: "Midia" },
  { value: "heart", label: "Recepcao" },
  { value: "baby", label: "Infantil" },
  { value: "pray", label: "Intercessao" },
  { value: "church", label: "Outro" },
] as const;

export default function OnboardingPage() {
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);

  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [sessionChurchId, setSessionChurchId] = useState<string | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [church, setChurch] = useState<Church | null>(null);
  const [onboarding, setOnboarding] = useState<OnboardingProgress | null>(null);

  const [existingDepartments, setExistingDepartments] = useState<Department[]>([]);
  const [existingEvents, setExistingEvents] = useState<Event[]>([]);

  const [churchCity, setChurchCity] = useState("");

  const [deptName, setDeptName] = useState("Louvor");
  const [deptIcon, setDeptIcon] = useState("music");

  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [tempPw, setTempPw] = useState<string | null>(null);

  const [eventName, setEventName] = useState("Culto de Domingo");
  const [eventTime, setEventTime] = useState("18:00");

  async function loadData() {
    const session = getSession();

    if (!session) {
      router.replace("/login");
      return;
    }

    setSessionUserId(session.user_id);
    setSessionChurchId(session.church_id);

    const [
      { data: userData, error: userError },
      { data: churchData, error: churchError },
      { data: onboardingData, error: onboardingError },
      { data: departmentsData, error: departmentsError },
      { data: eventsData, error: eventsError },
    ] = await Promise.all([
      supabase.from("users").select("*").eq("id", session.user_id).maybeSingle(),
      supabase.from("churches").select("*").eq("id", session.church_id).maybeSingle(),
      supabase.from("onboarding_progress").select("*").eq("church_id", session.church_id).maybeSingle(),
      supabase.from("departments").select("*").eq("church_id", session.church_id),
      supabase.from("events").select("*").eq("church_id", session.church_id),
    ]);

    if (userError || churchError || onboardingError || departmentsError || eventsError) {
      console.error({
        userError,
        churchError,
        onboardingError,
        departmentsError,
        eventsError,
      });
      router.replace("/login");
      return;
    }

    if (!userData || !churchData) {
      router.replace("/login");
      return;
    }

    setUser(userData as User);
    setChurch(churchData as Church);
    setChurchCity((churchData as Church).city || "");
    setOnboarding((onboardingData || null) as OnboardingProgress | null);
    setExistingDepartments((departmentsData || []) as Department[]);
    setExistingEvents((eventsData || []) as Event[]);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function next() {
    if (!user || !church) return;

    const current = STEPS[step].id;

    if (current === "church") {
      const { error } = await supabase
        .from("churches")
        .update({ city: churchCity })
        .eq("id", church.id);

      if (error) {
        console.error("Erro ao atualizar igreja:", error);
        return;
      }
    }

    if (current === "department" && deptName.trim()) {
      const alreadyExists = existingDepartments.some((d) => d.name === deptName);

      if (!alreadyExists) {
        const deptId = genId();

        const { error: deptError } = await supabase
          .from("departments")
          .insert({
            id: deptId,
            church_id: church.id,
            name: deptName.trim(),
            description: "",
            icon: deptIcon,
            color: "#D4A574",
            leader_ids: [user.id],
            co_leader_ids: [],
            active: true,
            created_at: new Date().toISOString(),
          });

        if (deptError) {
          console.error("Erro ao criar ministério:", deptError);
          return;
        }

        const { error: dmError } = await supabase
          .from("department_members")
          .insert({
            id: genId(),
            department_id: deptId,
            user_id: user.id,
            function_name: "Líder",
            function_names: ["Líder"],
            joined_at: new Date().toISOString(),
          });

        if (dmError) {
          console.error("Erro ao vincular líder ao ministério:", dmError);
          return;
        }
      }
    }

    if (current === "invite" && inviteName.trim() && inviteEmail.trim()) {
      const normalizedEmail = inviteEmail.trim().toLowerCase();

      const { data: existingUser, error: existingUserError } = await supabase
        .from("users")
        .select("id")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (existingUserError) {
        console.error("Erro ao verificar usuário convidado:", existingUserError);
        return;
      }

      if (!existingUser) {
        try {
          const response = await fetch("/api/member-invitations/create", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: inviteName.trim(),
              email: normalizedEmail,
              phone: "",
              role: "member",
              spouseId: "",
              selectedDepartments: [],
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            console.error("Erro ao convidar usuario:", errorData || response.statusText);
            return;
          }

          const payload = (await response.json().catch(() => null)) as
            | { tempPassword?: string }
            | null;
          setTempPw(payload?.tempPassword || null);
        } catch (error) {
          console.error("Erro ao convidar usuario:", error);
          return;
        }
      }
    }

    if (current === "event" && eventName.trim()) {
      const alreadyExists = existingEvents.some((e) => e.name === eventName);

      if (!alreadyExists) {
        const { error } = await supabase
          .from("events")
          .insert({
            id: genId(),
            church_id: church.id,
            name: eventName.trim(),
            description: "",
            type: "recurring",
            icon: "church",
            location: "",
            base_time: eventTime,
            instructions: "",
            recurrence: "weekly",
            active: true,
            created_at: new Date().toISOString(),
          });

        if (error) {
          console.error("Erro ao criar evento:", error);
          return;
        }
      }
    }

    if (current === "done") {
      if (onboarding) {
        const { error } = await supabase
          .from("onboarding_progress")
          .update({
            completed: true,
            completed_steps: STEPS.map((s) => s.id),
          })
          .eq("id", onboarding.id);

        if (error) {
          console.error("Erro ao concluir onboarding:", error);
          return;
        }
      } else if (sessionChurchId) {
        const { error } = await supabase
          .from("onboarding_progress")
          .insert({
            id: genId(),
            church_id: sessionChurchId,
            completed: true,
            completed_steps: STEPS.map((s) => s.id),
            created_at: new Date().toISOString(),
          });

        if (error) {
          console.error("Erro ao criar progresso do onboarding:", error);
          return;
        }
      }

      router.push("/dashboard");
      return;
    }

    await loadData();
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function skip() {
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  if (loading || !user || !church || !sessionUserId) {
    return null;
  }

  const current = STEPS[step];
  const progress = (step / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-[480px]">
        <div className="mb-8">
          <div className="h-1 bg-border-soft rounded-full overflow-hidden">
            <div
              className="h-full bg-brand rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[10px] text-ink-faint">
              Passo {step + 1} de {STEPS.length}
            </span>
            {step > 0 && step < STEPS.length - 1 && (
              <button
                onClick={skip}
                className="text-[10px] text-ink-faint hover:text-brand transition-colors"
              >
                Pular
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border-soft shadow-lg p-8">
          <div className="text-center mb-8">
            {step === 0 && (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand to-brand-deep flex items-center justify-center shadow-lg shadow-brand/30 mx-auto mb-5">
                <svg viewBox="0 0 24 24" fill="none" width="32" height="32">
                  <path
                    d="M12 3C8 3 5 7.5 5 12C5 16.5 8 21 12 24C16 21 19 16.5 19 12C19 7.5 16 3 12 3Z"
                    fill="rgba(255,255,255,.3)"
                  />
                  <circle cx="12" cy="12.5" r="2.5" fill="white" />
                </svg>
              </div>
            )}

            {step === STEPS.length - 1 && <div className="text-5xl mb-4">&#127881;</div>}

            <h2 className="font-display text-2xl mb-1">{current.title}</h2>
            <p className="text-sm text-ink-muted">{current.subtitle}</p>
          </div>

          {current.id === "welcome" && (
            <div className="space-y-3 mb-6">
              {[
                "Criar ministérios",
                "Montar escalas inteligentes",
                "Confirmar presença com 1 toque",
                "Manter tudo organizado",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <div className="w-6 h-6 rounded-full bg-success-light flex items-center justify-center text-success text-xs font-bold">
                    {"\u2713"}
                  </div>
                  <span className="text-sm text-ink-soft">{item}</span>
                </div>
              ))}
            </div>
          )}

          {current.id === "church" && (
            <div className="space-y-4 mb-6">
              <div>
                <label className="input-label">Nome da igreja</label>
                <input className="input-field" value={church.name} disabled />
              </div>
              <div>
                <label className="input-label">Cidade</label>
                <input
                  className="input-field"
                  placeholder="Ex: Fortaleza, CE"
                  value={churchCity}
                  onChange={(e) => setChurchCity(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
          )}

          {current.id === "department" && (
            <div className="space-y-4 mb-6">
              <div>
                <label className="input-label">Nome do ministério</label>
                <input
                  className="input-field"
                  placeholder="Ex: Louvor"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className="input-label">Icone</label>
                <div className="flex flex-wrap gap-2">
                  {DEPT_ICONS.map((ic) => (
                    <button
                      key={ic.value}
                      type="button"
                      onClick={() => {
                        setDeptIcon(ic.value);
                        if (!deptName || DEPT_ICONS.some((x) => x.label === deptName)) {
                          setDeptName(ic.label);
                        }
                      }}
                      className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 border-2 transition-all ${
                        deptIcon === ic.value
                          ? "border-brand bg-brand-light font-semibold"
                          : "border-border-soft"
                      }`}
                    >
                      {getIconEmoji(ic.value)} {ic.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {current.id === "invite" && (
            <div className="space-y-4 mb-6">
              {tempPw ? (
                <div className="text-center">
                  <div className="text-3xl mb-3">&#9989;</div>
                  <p className="text-sm font-semibold mb-2">{inviteName} convidado!</p>
                  <div className="bg-surface-alt rounded-[14px] p-4 text-left text-sm mb-3">
                    <div className="text-ink-muted mb-1">
                      Email: <strong className="text-ink">{inviteEmail}</strong>
                    </div>
                    <div className="text-ink-muted">
                      Senha: <strong className="text-brand font-mono">{tempPw}</strong>
                    </div>
                  </div>
                  <p className="text-xs text-ink-faint">Envie essas credenciais para o membro.</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="input-label">Nome</label>
                    <input
                      className="input-field"
                      placeholder="Nome do membro"
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="input-label">Email</label>
                    <input
                      type="email"
                      className="input-field"
                      placeholder="email@exemplo.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {current.id === "event" && (
            <div className="space-y-4 mb-6">
              <div>
                <label className="input-label">Nome do evento</label>
                <input
                  className="input-field"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className="input-label">Horario</label>
                <input
                  type="time"
                  className="input-field"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                />
              </div>
            </div>
          )}

          {current.id === "done" && (
            <div className="space-y-3 mb-6">
              {[
                "Igreja configurada",
                "Ministério criado",
                inviteName ? `${inviteName} convidado` : "Membro pode ser convidado depois",
                `${eventName} criado`,
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-1.5">
                  <div className="w-5 h-5 rounded-full bg-success-light flex items-center justify-center text-success text-[10px] font-bold">
                    {"\u2713"}
                  </div>
                  <span className="text-sm text-ink-soft">{item}</span>
                </div>
              ))}
            </div>
          )}

          <button onClick={next} className="btn btn-primary w-full py-3 text-base">
            {current.id === "done"
              ? "Ir para o Dashboard"
              : current.id === "welcome"
              ? "Comecar"
              : "Continuar"}
          </button>
        </div>
      </div>
    </div>
  );
}
