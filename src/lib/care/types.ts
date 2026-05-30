export interface PastoralNote {
  id: string;
  church_id: string;
  person_id: string;
  author_id: string | null;
  type: string;
  title: string;
  description: string;
  date: string;
  created_at: string;
}

export type CareTone = "brand" | "success" | "amber" | "info" | "lavender" | "rose";

export const CARE_TYPES: { value: string; label: string; tone: CareTone; short: string }[] = [
  { value: "visit", label: "Visita", tone: "brand", short: "V" },
  { value: "call", label: "Ligação / contato", tone: "info", short: "L" },
  { value: "prayer", label: "Oração", tone: "lavender", short: "O" },
  { value: "counseling", label: "Aconselhamento", tone: "rose", short: "A" },
  { value: "care", label: "Acompanhamento", tone: "success", short: "C" },
  { value: "note", label: "Anotação", tone: "amber", short: "N" },
];

export function careType(value: string) {
  return CARE_TYPES.find((t) => t.value === value) || CARE_TYPES[CARE_TYPES.length - 1];
}

export const CARE_TONE_CLASSES: Record<CareTone, string> = {
  brand: "bg-brand-light text-brand-deep",
  success: "bg-success-light text-success",
  amber: "bg-sun-light text-sun-deep",
  info: "bg-sky-light text-info",
  lavender: "bg-lavender-light text-lavender-deep",
  rose: "bg-rose-light text-rose-deep",
};

export function formatCareDate(date: string): string {
  if (!date) return "";
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return date;
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}
