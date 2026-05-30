"use client";

import { useState } from "react";
import { Modal, Avatar, DateField } from "@/components/ui";
import { saveMeeting } from "@/lib/cells/client";
import {
  MEETING_FEELINGS,
  ATTENDANCE_OPTIONS,
  type CellMeeting,
  type CellAttendanceRow,
  type AttendanceStatus,
} from "@/lib/cells/types";
import type { User } from "@/types";

const today = () => new Date().toISOString().slice(0, 10);

export function CellMeetingForm({
  cellId,
  members,
  meeting,
  existingAttendance,
  toast,
  close,
  onSaved,
}: {
  cellId: string;
  members: User[];
  meeting?: CellMeeting;
  existingAttendance?: CellAttendanceRow[];
  toast: (msg: string) => void;
  close: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!meeting;
  const [date, setDate] = useState(meeting?.date || today());
  const [time, setTime] = useState(meeting?.time || "");
  const [theme, setTheme] = useState(meeting?.theme || "");
  const [word, setWord] = useState(meeting?.word || "");
  const [notes, setNotes] = useState(meeting?.notes || "");
  const [feedback, setFeedback] = useState(meeting?.feedback || "");
  const [feeling, setFeeling] = useState(meeting?.feeling || "boa");
  const [saving, setSaving] = useState(false);

  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>(() => {
    const map: Record<string, AttendanceStatus> = {};
    members.forEach((m) => {
      const existing = existingAttendance?.find((a) => a.user_id === m.id);
      map[m.id] = (existing?.status as AttendanceStatus) || "present";
    });
    return map;
  });

  const presentCount = Object.values(attendance).filter(
    (s) => s === "present" || s === "visitor" || s === "first_visit"
  ).length;

  async function submit() {
    if (!date) { toast("Informe a data da reunião."); return; }
    setSaving(true);
    try {
      await saveMeeting({
        mode: isEdit ? "update" : "create",
        cellId,
        meetingId: meeting?.id,
        data: { date, time, theme, word, notes, feeling, feedback },
        attendance: members.map((m) => ({ user_id: m.id, status: attendance[m.id] || "present" })),
      });
      toast(isEdit ? "Reunião atualizada!" : "Reunião registrada!");
      onSaved();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Erro ao salvar reunião.");
      setSaving(false);
    }
  }

  return (
    <Modal
      title={isEdit ? "Editar reunião" : "Registrar reunião"}
      close={close}
      width={560}
      footer={
        <>
          <button onClick={close} className="btn btn-secondary">Cancelar</button>
          <button onClick={submit} disabled={saving} className="btn btn-primary">
            {saving ? "Salvando..." : isEdit ? "Salvar" : "Registrar"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="input-label">Data</label>
            <DateField value={date} onChange={setDate} />
          </div>
          <div>
            <label className="input-label">Horário</label>
            <input type="time" className="input-field" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="input-label">Tema</label>
          <input className="input-field" value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="Tema do encontro" />
        </div>

        <div>
          <label className="input-label">Palavra / texto base</label>
          <input className="input-field" value={word} onChange={(e) => setWord(e.target.value)} placeholder="Ex: João 15" />
        </div>

        <div>
          <label className="input-label">Como foi o encontro?</label>
          <div className="flex flex-wrap gap-2">
            {MEETING_FEELINGS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFeeling(f.value)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition ${
                  feeling === f.value ? "bg-brand text-white" : "bg-surface-alt text-ink-muted hover:bg-surface-hover"
                }`}
              >
                <span>{f.emoji}</span> {f.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="input-label mb-0">Presença</label>
            <span className="text-[11px] font-semibold text-ink-faint">{presentCount}/{members.length} presentes</span>
          </div>
          {members.length === 0 ? (
            <p className="rounded-[12px] bg-surface-alt px-3 py-2 text-[12px] text-ink-faint">
              Esta célula ainda não tem membros. Adicione membros para marcar presença.
            </p>
          ) : (
            <div className="max-h-56 space-y-1.5 overflow-y-auto rounded-[12px] border border-border-soft p-2">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-2.5 rounded-[10px] px-1.5 py-1">
                  <Avatar name={m.name} color={m.avatar_color} photoUrl={m.photo_url} size={28} />
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">{m.name}</span>
                  <select
                    className="rounded-[8px] border border-border bg-white px-2 py-1 text-[12px] font-medium text-ink outline-none focus:border-brand"
                    value={attendance[m.id] || "present"}
                    onChange={(e) => setAttendance((prev) => ({ ...prev, [m.id]: e.target.value as AttendanceStatus }))}
                  >
                    {ATTENDANCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="input-label">Observações / pedidos</label>
          <textarea className="input-field min-h-[56px]" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anotações do encontro..." />
        </div>

        <div>
          <label className="input-label">Feedback para a liderança</label>
          <textarea className="input-field min-h-[44px]" value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Opcional" />
        </div>
      </div>
    </Modal>
  );
}
