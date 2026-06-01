export interface CellHealth {
  frequency: number;
  communion: number;
  participation: number;
  growth: number;
  engagement: number;
  care: number;
}

export type CellStatus = "active" | "paused" | "multiplying";

export interface Cell {
  id: string;
  church_id: string;
  name: string;
  description: string;
  cover_color: string;
  leader_ids: string[];
  co_leader_ids: string[];
  network_id: string | null;
  /** @deprecated use leader_ids/co_leader_ids */
  leader_id?: string | null;
  /** @deprecated */
  co_leader_id?: string | null;
  supervisor_id?: string | null;
  address: string;
  week_day: string;
  time: string;
  max_members: number;
  audience: string;
  status: CellStatus;
  health: CellHealth;
  created_at: string;
}

export interface CellNetwork {
  id: string;
  church_id: string;
  name: string;
  description: string;
  supervisor_ids: string[];
  color: string;
  created_at: string;
}

export type CellRole = "pastor" | "coordenacao" | null;

export interface CellMemberRow {
  id: string;
  cell_id: string;
  user_id: string;
  status: string;
  joined_at: string;
}

export const WEEK_DAYS = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
] as const;

export const CELL_TYPES = [
  "Casados",
  "Solteiros",
  "Crianças",
  "Mulheres",
  "Homens",
  "Jovens",
  "Adolescentes",
  "Outros",
] as const;

export type CellType = (typeof CELL_TYPES)[number];

export type CellHealthStatus = "Saudável" | "Em crescimento" | "Atenção" | "Crítica" | "Nova";

export function cellHealthStatus(health: CellHealth, createdAt?: string): CellHealthStatus {
  // "Nova" if created within the last 30 days
  if (createdAt) {
    const days = (Date.now() - new Date(createdAt).getTime()) / 86_400_000;
    if (days <= 30) return "Nova";
  }
  const avg = cellHealthAverage(health);
  if (avg >= 80) return "Saudável";
  if (avg >= 60) return "Em crescimento";
  if (avg >= 40) return "Atenção";
  return "Crítica";
}

export const HEALTH_STATUS_STYLES: Record<CellHealthStatus, string> = {
  "Saudável": "text-success bg-success-light",
  "Em crescimento": "text-info bg-info-light",
  "Atenção": "text-amber bg-amber-light",
  "Crítica": "text-danger bg-danger-light",
  "Nova": "text-[#8B5BD6] bg-[#f4ecff]",
};

export const DEFAULT_HEALTH: CellHealth = {
  frequency: 70,
  communion: 70,
  participation: 70,
  growth: 70,
  engagement: 70,
  care: 70,
};

export function cellHealthAverage(health: CellHealth): number {
  const values = Object.values(health || DEFAULT_HEALTH);
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, v) => sum + (v || 0), 0) / values.length);
}

export interface CellMeeting {
  id: string;
  cell_id: string;
  church_id: string;
  date: string;
  time: string;
  theme: string;
  word: string;
  notes: string;
  feeling: string;
  feedback: string;
  created_at: string;
}

export interface CellAttendanceRow {
  id: string;
  meeting_id: string;
  cell_id: string;
  user_id: string;
  status: string;
}

export type AttendanceStatus = "present" | "absent" | "visitor" | "first_visit";

export function formatMeetingDate(date: string): string {
  if (!date) return "";
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return date;
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export const MEETING_FEELINGS: { value: string; label: string; emoji: string }[] = [
  { value: "muito_boa", label: "Muito boa", emoji: "🔥" },
  { value: "boa", label: "Boa", emoji: "😊" },
  { value: "normal", label: "Normal", emoji: "🙂" },
  { value: "dificil", label: "Difícil", emoji: "😕" },
];

export const ATTENDANCE_OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: "present", label: "Presente" },
  { value: "absent", label: "Ausente" },
  { value: "visitor", label: "Visitante" },
  { value: "first_visit", label: "1ª vez" },
];

// frequency = average over meetings of (attendees / marked) * 100
export function computeFrequency(
  meetings: { id: string }[],
  attendance: { meeting_id: string; status: string }[]
): number {
  if (!meetings.length) return 0;
  const rates: number[] = [];
  for (const m of meetings) {
    const rows = attendance.filter((a) => a.meeting_id === m.id);
    if (!rows.length) continue;
    const present = rows.filter((a) => a.status === "present" || a.status === "visitor" || a.status === "first_visit").length;
    rates.push(present / rows.length);
  }
  if (!rates.length) return 0;
  return Math.round((rates.reduce((s, r) => s + r, 0) / rates.length) * 100);
}
