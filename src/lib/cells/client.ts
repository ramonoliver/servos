import { getSession } from "@/lib/auth/session";
import type { Cell, CellMemberRow, CellMeeting, CellAttendanceRow } from "./types";

export function cellAuthHeaders(): Record<string, string> {
  const token = getSession()?.token;
  return { "Content-Type": "application/json", ...(token ? { "x-servos-auth": token } : {}) };
}

export async function fetchCells(): Promise<{ cells: Cell[]; cellMembers: CellMemberRow[] }> {
  const res = await fetch("/api/cells/list", {
    method: "POST",
    credentials: "include",
    headers: cellAuthHeaders(),
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok) throw new Error(payload?.error || "Falha ao carregar células.");
  return { cells: (payload?.cells || []) as Cell[], cellMembers: (payload?.cellMembers || []) as CellMemberRow[] };
}

type SaveCellInput = {
  mode: "create" | "update" | "delete";
  cellId?: string;
  data?: Record<string, unknown>;
  memberIds?: string[];
};

export async function saveCell(input: SaveCellInput): Promise<{ id?: string }> {
  const res = await fetch("/api/cells/manage", {
    method: "POST",
    credentials: "include",
    headers: cellAuthHeaders(),
    body: JSON.stringify(input),
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok) throw new Error(payload?.error || "Falha ao salvar célula.");
  return payload || {};
}

export async function fetchMeetings(cellId: string): Promise<{ meetings: CellMeeting[]; attendance: CellAttendanceRow[] }> {
  const res = await fetch("/api/cells/meetings/list", {
    method: "POST",
    credentials: "include",
    headers: cellAuthHeaders(),
    body: JSON.stringify({ cellId }),
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok) throw new Error(payload?.error || "Falha ao carregar reuniões.");
  return { meetings: (payload?.meetings || []) as CellMeeting[], attendance: (payload?.attendance || []) as CellAttendanceRow[] };
}

type SaveMeetingInput = {
  mode: "create" | "update" | "delete";
  cellId: string;
  meetingId?: string;
  data?: Record<string, unknown>;
  attendance?: { user_id: string; status: string }[];
};

export async function saveMeeting(input: SaveMeetingInput): Promise<void> {
  const res = await fetch("/api/cells/meetings/manage", {
    method: "POST",
    credentials: "include",
    headers: cellAuthHeaders(),
    body: JSON.stringify(input),
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok) throw new Error(payload?.error || "Falha ao salvar reunião.");
}
