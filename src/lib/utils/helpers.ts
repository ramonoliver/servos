export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function genId(): string {
  return "id_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

export function formatShortDate(dateStr: string): string {
  if (!dateStr) return "";
  const [, m, d] = dateStr.split("-");
  return `${d}/${m}`;
}

export function getDayOfWeek(dateStr: string): number {
  const d = new Date(dateStr + "T12:00:00");
  return d.getDay() === 0 ? 6 : d.getDay() - 1; // Mon=0, Sun=6
}

export function getDayName(dateStr: string): string {
  const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
  const d = new Date(dateStr + "T12:00:00");
  return days[d.getDay()];
}

export function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export function getIconEmoji(icon: string): string {
  const map: Record<string, string> = {
    music: "\uD83C\uDFB5", camera: "\uD83D\uDCF7", heart: "\u2764\uFE0F",
    church: "\u26EA", cross: "\u271D\uFE0F", flower: "\uD83C\uDF38",
    flame: "\uD83D\uDD25", star: "\u2B50", book: "\uD83D\uDCD6",
    baby: "\uD83D\uDC76", pray: "\uD83D\uDE4F",
  };
  return map[icon] || "\u26EA";
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? `${count} ${singular}` : `${count} ${plural || singular + "s"}`;
}

export const DAY_LABELS: Record<number, string> = {
  0: "Seg",
  1: "Ter",
  2: "Qua",
  3: "Qui",
  4: "Sex",
  5: "Sáb",
  6: "Dom",
};