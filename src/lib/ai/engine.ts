import type { User, DepartmentMember, Schedule, ScheduleMember, UnavailableDate, MemberScore, ScoringReason } from "@/types";

const DAY_NAMES = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];

interface ScoreContext {
  date: string;
  dayOfWeek: number; // 0=Mon, 6=Sun
  deptMemberIds: string[];
  unavailableDates: UnavailableDate[];
  existingSchedules: Schedule[];
  existingScheduleMembers: ScheduleMember[];
  avgSchedules: number;
  currentScheduleId?: string;
  requiredFunction?: string;
}

export function scoreMember(
  member: User,
  deptMember: DepartmentMember | undefined,
  ctx: ScoreContext
): MemberScore {
  const reasons: ScoringReason[] = [];
  const alerts: string[] = [];
  let score = 50;

  // 1. Weekly availability
  const weekAvail = member.availability?.[ctx.dayOfWeek];
  if (!weekAvail) {
    return {
      member_id: member.id, score: -1, available: false,
      reasons: [{ factor: "availability", label: `Indisponivel (${DAY_NAMES[ctx.dayOfWeek]})`, impact: -100, type: "negative" }],
      alerts: [],
    };
  }
  reasons.push({ factor: "availability", label: `Disponivel (${DAY_NAMES[ctx.dayOfWeek]})`, impact: 10, type: "positive" });
  score += 10;

  // 2. Specific date unavailability
  const dateBlocked = ctx.unavailableDates.some(
    ud => ud.user_id === member.id && (ud.date === ctx.date || (ud.end_date && ud.date <= ctx.date && ud.end_date >= ctx.date))
  );
  if (dateBlocked) {
    return {
      member_id: member.id, score: -1, available: false,
      reasons: [{ factor: "date_blocked", label: "Data bloqueada pelo membro", impact: -100, type: "negative" }],
      alerts: ["Data marcada como indisponivel"],
    };
  }

  // 3. Member status
  if (member.status === "paused" || member.status === "vacation" || member.status === "inactive") {
    return {
      member_id: member.id, score: -1, available: false,
      reasons: [{ factor: "status", label: `Status: ${member.status}`, impact: -100, type: "negative" }],
      alerts: [`Membro em ${member.status}`],
    };
  }

  // 4. Fair rotation
  const diff = ctx.avgSchedules - (member.total_schedules || 0);
  const rotImpact = Math.round(diff * 2.5);
  score += rotImpact;
  reasons.push({
    factor: "rotation",
    label: diff > 0 ? `Serviu ${Math.abs(Math.round(diff))}x menos que a media` : diff < -2 ? `Serviu ${Math.abs(Math.round(diff))}x mais que a media` : "Rodizio equilibrado",
    impact: rotImpact,
    type: diff > 2 ? "positive" : diff < -2 ? "negative" : "neutral",
  });

  // 5. Confirmation rate
  const rate = member.confirm_rate || 100;
  const rateImpact = Math.round((rate - 80) * 0.4);
  score += rateImpact;
  reasons.push({
    factor: "confirm_rate",
    label: `${rate}% de confirmacao`,
    impact: rateImpact,
    type: rate >= 90 ? "positive" : rate >= 70 ? "neutral" : "negative",
  });
  if (rate < 70) alerts.push("Baixa taxa de confirmacao");

  // 6. Recent load
  const recentCount = ctx.existingScheduleMembers.filter(
    sm => sm.user_id === member.id && sm.status !== "declined"
  ).length;
  if (recentCount > 2) {
    const loadImpact = -(recentCount - 2) * 6;
    score += loadImpact;
    reasons.push({ factor: "recent_load", label: `${recentCount} escalas recentes`, impact: loadImpact, type: "negative" });
    if (recentCount > 3) alerts.push("Carga alta recentemente");
  }

  // 7. Couple bonus
  if (member.spouse_id && ctx.deptMemberIds.includes(member.spouse_id)) {
    score += 5;
    reasons.push({ factor: "couple", label: "Conjuge no ministerio", impact: 5, type: "positive" });
  }

  // 8. Function match
  if (
    ctx.requiredFunction &&
    (deptMember?.function_name === ctx.requiredFunction ||
      deptMember?.function_names?.includes(ctx.requiredFunction))
  ) {
    score += 15;
    reasons.push({ factor: "function", label: `Funcao: ${ctx.requiredFunction}`, impact: 15, type: "positive" });
  }

  // 9. Conflict with other schedules
  const conflicting = ctx.existingSchedules.filter(s =>
    s.id !== ctx.currentScheduleId &&
    s.date === ctx.date &&
    ctx.existingScheduleMembers.some(sm => sm.user_id === member.id && sm.schedule_id === s.id && sm.status !== "declined")
  );
  if (conflicting.length > 0) {
    score -= 20;
    reasons.push({ factor: "conflict", label: "Conflito com outra escala no mesmo dia", impact: -20, type: "negative" });
    alerts.push("Ja escalado em outro ministerio nesta data");
  }

  return { member_id: member.id, score: Math.round(score), available: true, reasons, alerts };
}

export function suggestMembers(
  members: User[],
  deptMembers: DepartmentMember[],
  ctx: ScoreContext
): (MemberScore & { user: User; dept_member?: DepartmentMember })[] {
  return deptMembers
    .map(dm => {
      const user = members.find(m => m.id === dm.user_id);
      if (!user || !user.active) return null;
      const score = scoreMember(user, dm, ctx);
      return { ...score, user, dept_member: dm };
    })
    .filter(Boolean)
    .sort((a, b) => b!.score - a!.score) as any[];
}

export function autoSelectWithCouples(
  scored: ReturnType<typeof suggestMembers>,
  maxMembers: number = 8
): string[] {
  const selected: string[] = [];
  for (const item of scored) {
    if (selected.length >= maxMembers) break;
    if (item.score < 0 || selected.includes(item.user.id)) continue;
    selected.push(item.user.id);
    // Auto-include spouse
    if (item.user.spouse_id) {
      const spouse = scored.find(s => s.user.id === item.user.spouse_id);
      if (spouse && spouse.score >= 0 && !selected.includes(spouse.user.id) && selected.length < maxMembers) {
        selected.push(spouse.user.id);
      }
    }
  }
  return selected;
}

export function suggestSubstitute(
  members: User[],
  deptMembers: DepartmentMember[],
  declinedUserId: string,
  declinedFunction: string,
  ctx: ScoreContext,
  alreadyInSchedule: string[]
): (MemberScore & { user: User }) | null {
  const candidates = deptMembers.filter(dm =>
    dm.user_id !== declinedUserId && !alreadyInSchedule.includes(dm.user_id)
  );
  const scored = candidates
    .map(dm => {
      const user = members.find(m => m.id === dm.user_id);
      if (!user || !user.active) return null;
      const s = scoreMember(user, dm, { ...ctx, requiredFunction: declinedFunction });
      return { ...s, user };
    })
    .filter(Boolean)
    .filter(s => s!.available && s!.score > 0)
    .sort((a, b) => b!.score - a!.score) as any[];

  return scored[0] || null;
}

// Verse of the day
const VERSES = [
  { text: "Sirvam uns aos outros mediante o amor.", ref: "Galatas 5:13" },
  { text: "Cada um exerca o dom que recebeu para servir os outros.", ref: "1 Pedro 4:10" },
  { text: "O maior entre voces sera aquele que serve.", ref: "Mateus 23:11" },
  { text: "Tudo o que fizerem, facam de todo o coracao, como para o Senhor.", ref: "Colossenses 3:23" },
  { text: "Nao nos cansemos de fazer o bem.", ref: "Galatas 6:9" },
  { text: "O Senhor e o meu pastor; nada me faltara.", ref: "Salmo 23:1" },
  { text: "Onde estiverem dois ou tres reunidos em meu nome, ali estou no meio deles.", ref: "Mateus 18:20" },
];

export function getVerseOfDay() {
  return VERSES[Math.floor(Date.now() / 86400000) % VERSES.length];
}

export const DAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];
