"use client";

import { useState } from "react";
import {
  EVENT_CATEGORIES,
  EVENT_WEEKDAYS,
  getEventCategory,
  parseEventRecurrence,
} from "@/lib/events/recurrence";
import type { Event } from "@/types";
import { ActionDrawer } from "@/components/ui";

type EventFormModalProps = {
  ev?: Event;
  toast: (msg: string) => void;
  close: () => void;
  onSaved: () => Promise<void>;
};

export function EventFormModal({ ev, toast, close, onSaved }: EventFormModalProps) {
  const isEdit = !!ev;
  const parsedRecurrence = parseEventRecurrence(ev?.recurrence);
  const [category, setCategory] = useState(ev?.icon || "church");
  const [name, setName] = useState(ev?.name || "");
  const [desc, setDesc] = useState(ev?.description || "");
  const [type, setType] = useState<"recurring" | "special">((ev?.type as "recurring" | "special") || "recurring");
  const [location, setLocation] = useState(ev?.location || "");
  const [baseTime, setBaseTime] = useState(ev?.base_time || "");
  const [weekday, setWeekday] = useState(parsedRecurrence.weekday);
  const [eventDate, setEventDate] = useState(parsedRecurrence.date);
  const [instructions, setInstructions] = useState(ev?.instructions || "");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim()) {
      toast("Informe o nome.");
      return;
    }
    if (type === "special" && !eventDate) {
      toast("Informe a data do evento especial.");
      return;
    }

    setSaving(true);

    const data = {
      name: name.trim(),
      description: desc,
      type,
      icon: category,
      location,
      base_time: baseTime,
      instructions,
      recurrence: type === "recurring" ? `weekly:${weekday}` : `once:${eventDate}`,
    };

    try {
      const response = await fetch("/api/events/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: isEdit ? "update" : "create",
          eventId: ev?.id,
          data,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        console.error("Erro ao salvar evento:", payload);
        toast(payload?.error || "Erro ao salvar evento.");
        setSaving(false);
        return;
      }

      toast(isEdit ? "Atualizado!" : "Evento criado!");
      setSaving(false);
      await onSaved();
    } catch (error) {
      console.error("Erro ao salvar evento:", error);
      toast("Erro ao salvar evento.");
      setSaving(false);
    }
  }

  return (
    <ActionDrawer
      open={true}
      title={isEdit ? "Editar evento" : "Novo evento"}
      onClose={close}
      width={540}
      footer={
        <>
          <button onClick={close} className="btn btn-secondary">
            Cancelar
          </button>
          <button onClick={save} disabled={saving} className="btn btn-primary">
            {saving ? "Salvando..." : isEdit ? "Salvar" : "Criar"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="input-label">Categoria</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {EVENT_CATEGORIES.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setCategory(item.value)}
                className={`flex h-11 items-center justify-center rounded-2xl border px-3 text-xs font-semibold transition ${
                  category === item.value
                    ? "border-brand bg-brand-light text-brand"
                    : "border-border-soft bg-white text-ink-muted hover:bg-surface-alt"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="input-label">Nome</label>
          <input
            className="input-field"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={`Ex: ${getEventCategory(category).label} de domingo`}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="input-label">Tipo</label>
            <select className="input-field" value={type} onChange={(event) => setType(event.target.value as "recurring" | "special")}>
              <option value="recurring">Recorrente</option>
              <option value="special">Especial</option>
            </select>
          </div>

          {type === "recurring" ? (
            <div>
              <label className="input-label">Dia da semana</label>
              <select className="input-field" value={weekday} onChange={(event) => setWeekday(event.target.value)}>
                {EVENT_WEEKDAYS.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="input-label">Data</label>
              <input
                type="date"
                className="input-field"
                value={eventDate}
                onChange={(event) => setEventDate(event.target.value)}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="input-label">Local</label>
            <input
              className="input-field"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Templo principal"
            />
          </div>

          <div>
            <label className="input-label">Horário base</label>
            <input
              type="time"
              className="input-field"
              value={baseTime}
              onChange={(event) => setBaseTime(event.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="input-label">Descrição</label>
          <textarea
            className="input-field min-h-[70px]"
            value={desc}
            onChange={(event) => setDesc(event.target.value)}
            placeholder="Resumo curto do evento..."
          />
        </div>

        <div>
          <label className="input-label">Instruções</label>
          <textarea
            className="input-field min-h-[70px]"
            value={instructions}
            onChange={(event) => setInstructions(event.target.value)}
            placeholder="Orientações para este evento..."
          />
        </div>
      </div>
    </ActionDrawer>
  );
}
