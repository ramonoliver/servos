"use client";

import { useState } from "react";
import { Modal, DateField } from "@/components/ui";
import { saveCareNote } from "@/lib/care/client";
import { CARE_TYPES } from "@/lib/care/types";

const today = () => new Date().toISOString().slice(0, 10);

export function CareNoteForm({
  personId,
  toast,
  close,
  onSaved,
}: {
  personId: string;
  toast: (msg: string) => void;
  close: () => void;
  onSaved: () => void;
}) {
  const [type, setType] = useState("visit");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(today());
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!description.trim() && !title.trim()) {
      toast("Escreva o que aconteceu.");
      return;
    }
    setSaving(true);
    try {
      await saveCareNote({ mode: "create", personId, data: { type, title: title.trim(), description: description.trim(), date } });
      toast("Cuidado registrado!");
      onSaved();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Erro ao registrar cuidado.");
      setSaving(false);
    }
  }

  return (
    <Modal
      title="Registrar cuidado"
      close={close}
      width={500}
      footer={
        <>
          <button onClick={close} className="btn btn-secondary">Cancelar</button>
          <button onClick={submit} disabled={saving} className="btn btn-primary">{saving ? "Salvando..." : "Registrar"}</button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="input-label">Tipo</label>
          <div className="flex flex-wrap gap-2">
            {CARE_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition ${
                  type === t.value ? "bg-brand text-white" : "bg-surface-alt text-ink-muted hover:bg-surface-hover"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-[1fr_150px] gap-4">
          <div>
            <label className="input-label">Título (opcional)</label>
            <input className="input-field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Visita em casa" />
          </div>
          <div>
            <label className="input-label">Data</label>
            <DateField value={date} onChange={setDate} />
          </div>
        </div>

        <div>
          <label className="input-label">O que aconteceu</label>
          <textarea className="input-field min-h-[90px]" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalhes do cuidado, conversa, pedido..." autoFocus />
        </div>
      </div>
    </Modal>
  );
}
