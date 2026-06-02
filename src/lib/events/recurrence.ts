import type { Event } from "@/types";

export const EVENT_WEEKDAYS = [
  { value: "0", label: "Domingo" },
  { value: "1", label: "Segunda" },
  { value: "2", label: "Terça" },
  { value: "3", label: "Quarta" },
  { value: "4", label: "Quinta" },
  { value: "5", label: "Sexta" },
  { value: "6", label: "Sábado" },
] as const;

export const EVENT_CATEGORIES = [
  { value: "church", label: "Culto", icon: "calendar" },
  { value: "event", label: "Evento", icon: "spark" },
  { value: "vigil", label: "Vigília", icon: "moon" },
  { value: "evangelism", label: "Evangelismo", icon: "users" },
  { value: "meeting", label: "Reunião", icon: "briefcase" },
  { value: "congress", label: "Congresso", icon: "stage" },
  { value: "training", label: "Treinamento", icon: "book" },
  { value: "care", label: "Cuidado", icon: "heart" },
] as const;

export function getEventCategory(value?: string) {
  return EVENT_CATEGORIES.find((category) => category.value === value) || EVENT_CATEGORIES[0];
}

export function parseEventRecurrence(recurrence?: string) {
  const value = recurrence || "";
  if (value.startsWith("weekly:")) return { weekday: value.split(":")[1] || "0", date: "" };
  if (value.startsWith("once:")) return { weekday: "0", date: value.split(":")[1] || "" };
  return { weekday: "0", date: "" };
}

export function parseEventCalendarRecurrence(event: Event) {
  const recurrence = event.recurrence || "";
  if (recurrence.startsWith("weekly:")) {
    const weekday = Number(recurrence.split(":")[1]);
    return Number.isFinite(weekday) ? { type: "weekly" as const, weekday } : null;
  }
  if (recurrence.startsWith("once:")) {
    const date = recurrence.split(":")[1];
    return date ? { type: "once" as const, date } : null;
  }
  return null;
}

export function formatEventRecurrence(event: Event) {
  const parsed = parseEventRecurrence(event.recurrence);
  if (event.type === "recurring") {
    return EVENT_WEEKDAYS.find((day) => day.value === parsed.weekday)?.label || "Sem dia definido";
  }
  if (parsed.date) {
    return new Date(`${parsed.date}T12:00:00`).toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
  return "Sem data definida";
}
