import { getSession } from "@/lib/auth/session";
import type { PastoralNote } from "./types";

function careAuthHeaders(): Record<string, string> {
  const token = getSession()?.token;
  return { "Content-Type": "application/json", ...(token ? { "x-servos-auth": token } : {}) };
}

export async function fetchCareNotes(personId: string): Promise<PastoralNote[]> {
  const res = await fetch("/api/care/list", {
    method: "POST",
    credentials: "include",
    headers: careAuthHeaders(),
    body: JSON.stringify({ personId }),
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok) throw new Error(payload?.error || "Falha ao carregar o cuidado pastoral.");
  return (payload?.notes || []) as PastoralNote[];
}

type SaveNoteInput = {
  mode: "create" | "delete";
  personId: string;
  noteId?: string;
  data?: Record<string, unknown>;
};

export async function saveCareNote(input: SaveNoteInput): Promise<void> {
  const res = await fetch("/api/care/manage", {
    method: "POST",
    credentials: "include",
    headers: careAuthHeaders(),
    body: JSON.stringify(input),
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok) throw new Error(payload?.error || "Falha ao salvar o registro de cuidado.");
}
