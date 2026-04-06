"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/hooks/use-app";
import { supabase } from "@/lib/supabase/client";
import { getIconEmoji } from "@/lib/utils/helpers";
import type { Event } from "@/types";

const ICONS = ["church", "cross", "flower", "flame", "star", "music", "heart", "book"] as const;

export default function EventosPage() {
  const { user, toast, canDo } = useApp();
  const [modal, setModal] = useState<null | { type: "form"; ev?: Event } | { type: "delete"; ev: Event }>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("church_id", user.church_id)
      .neq("active", false)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar eventos:", error);
      toast("Erro ao carregar eventos.");
      setLoading(false);
      return;
    }

    setEvents((data || []) as Event[]);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [user.church_id]);

  const recurring = useMemo(
    () => events.filter((e) => e.type === "recurring"),
    [events]
  );

  const special = useMemo(
    () => events.filter((e) => e.type === "special"),
    [events]
  );
  const withTime = useMemo(() => events.filter((e) => Boolean(e.base_time)).length, [events]);

  async function deleteEvent(ev: Event) {
    try {
      const response = await fetch("/api/events/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "delete",
          eventId: ev.id,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        console.error("Erro ao remover evento:", data);
        toast(data?.error || "Erro ao remover evento.");
        return;
      }

      toast(ev.name + " removido.");
      setModal(null);
      await loadData();
    } catch (error) {
      console.error("Erro ao remover evento:", error);
      toast("Erro ao remover evento.");
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="max-w-2xl">
          <h1 className="page-title">Eventos</h1>
          <p className="page-subtitle">
            Organize a agenda da igreja com uma leitura mais clara entre bases recorrentes e
            programações especiais.
          </p>
        </div>
        {canDo("event.create") && (
          <button onClick={() => setModal({ type: "form" })} className="btn btn-primary self-start sm:self-auto">
            + Novo
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 mb-6">
        <div className="rounded-[18px] border border-border-soft bg-[linear-gradient(180deg,rgba(236,245,238,0.9),rgba(255,255,255,0.96))] px-4 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
            Recorrentes
          </div>
          <div className="mt-2 font-display text-[28px] leading-none text-success">{recurring.length}</div>
          <div className="mt-1 text-xs text-ink-muted leading-relaxed">
            Bases semanais que sustentam as escalas.
          </div>
        </div>

        <div className="rounded-[18px] border border-border-soft bg-[linear-gradient(180deg,rgba(255,241,230,0.9),rgba(255,255,255,0.96))] px-4 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
            Especiais
          </div>
          <div className="mt-2 font-display text-[28px] leading-none text-brand">{special.length}</div>
          <div className="mt-1 text-xs text-ink-muted leading-relaxed">
            Eventos únicos ou fora do ritmo semanal.
          </div>
        </div>

        <div className="rounded-[18px] border border-border-soft bg-[linear-gradient(180deg,rgba(240,246,255,0.9),rgba(255,255,255,0.96))] px-4 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-faint">
            Com horário base
          </div>
          <div className="mt-2 font-display text-[28px] leading-none text-info">{withTime}</div>
          <div className="mt-1 text-xs text-ink-muted leading-relaxed">
            Prontos para agilizar a criação de escala.
          </div>
        </div>
      </div>

      {[{ title: "Cultos Recorrentes", list: recurring }, { title: "Eventos Especiais", list: special }].map(
        (section) => (
          <div key={section.title} className="mb-8">
            <div className="flex items-end justify-between gap-3 mb-3">
              <div>
                <h3 className="font-display text-lg">{section.title}</h3>
                <p className="text-xs text-ink-muted mt-1">
                  {section.title === "Cultos Recorrentes"
                    ? "Eventos base para a rotina semanal dos ministérios."
                    : "Programações pontuais que merecem destaque próprio no calendário."}
                </p>
              </div>
              <span className="badge badge-secondary">{section.list.length}</span>
            </div>

            <div className="card overflow-hidden">
              {loading ? (
                <div className="px-5 py-8 text-center text-sm text-ink-faint">Carregando eventos...</div>
              ) : section.list.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-ink-faint">Nenhum evento.</div>
              ) : (
                section.list.map((e) => (
                  <div
                    key={e.id}
                    className="flex flex-col gap-3 px-5 py-4 border-t border-border-soft first:border-t-0 hover:bg-brand-glow transition-colors group"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                      <div className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-border-soft bg-surface-alt text-2xl">
                        {getIconEmoji(e.icon)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <div className="text-sm font-semibold break-words">{e.name}</div>
                          <span className={`badge ${e.type === "recurring" ? "badge-green" : "badge-brand"}`}>
                            {e.type === "recurring" ? "Recorrente" : "Especial"}
                          </span>
                          {e.base_time && <span className="badge badge-secondary">{e.base_time}</span>}
                        </div>

                        {e.description && (
                          <div className="text-[12px] text-ink-muted break-words leading-relaxed">
                            {e.description}
                          </div>
                        )}

                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-faint leading-relaxed">
                          {e.location && <span>Local: {e.location}</span>}
                          {e.instructions && <span>Instruções disponíveis</span>}
                        </div>
                      </div>

                      {canDo("event.edit") && (
                        <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setModal({ type: "form", ev: e })}
                            className="btn btn-ghost btn-sm"
                          >
                            &#9998;
                          </button>
                          <button
                            onClick={() => setModal({ type: "delete", ev: e })}
                            className="btn btn-ghost btn-sm text-danger"
                          >
                            &#10005;
                          </button>
                        </div>
                      )}
                    </div>

                    {e.instructions && (
                      <div className="rounded-[14px] border border-border-soft bg-surface-alt/60 px-3 py-2 text-[11px] text-ink-muted leading-relaxed">
                        {e.instructions}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )
      )}

      {modal?.type === "form" && (
        <EventForm
          ev={(modal as any).ev}
          toast={toast}
          close={() => setModal(null)}
          onSaved={async () => {
            setModal(null);
            await loadData();
          }}
        />
      )}

      {modal?.type === "delete" && (
        <div
          className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center"
          onClick={(e) => e.target === e.currentTarget && setModal(null)}
        >
          <div className="bg-white rounded-xl w-full max-w-[420px] shadow-xl p-6">
            <div className="bg-danger-light text-danger text-sm px-4 py-3 rounded-[10px] border border-danger/10 mb-5">
              Remover <strong>{modal.ev.name}</strong>?
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setModal(null)} className="btn btn-secondary">
                Cancelar
              </button>
              <button onClick={() => deleteEvent(modal.ev)} className="btn btn-danger">
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EventForm({
  ev,
  toast,
  close,
  onSaved,
}: {
  ev?: Event;
  toast: (msg: string) => void;
  close: () => void;
  onSaved: () => Promise<void>;
}) {
  const isEdit = !!ev;
  const [name, setName] = useState(ev?.name || "");
  const [desc, setDesc] = useState(ev?.description || "");
  const [type, setType] = useState<"recurring" | "special">((ev?.type as "recurring" | "special") || "recurring");
  const [icon, setIcon] = useState(ev?.icon || "church");
  const [location, setLocation] = useState(ev?.location || "");
  const [baseTime, setBaseTime] = useState(ev?.base_time || "");
  const [instructions, setInstructions] = useState(ev?.instructions || "");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim()) {
      toast("Informe o nome.");
      return;
    }

    setSaving(true);

    const data = {
      name: name.trim(),
      description: desc,
      type,
      icon,
      location,
      base_time: baseTime,
      instructions,
      recurrence: type === "recurring" ? "weekly" : "once",
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
    <div
      className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div className="bg-white rounded-xl w-full max-w-[500px] shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border-soft">
          <span className="font-display text-xl">{isEdit ? "Editar Evento" : "Novo Evento"}</span>
          <button
            onClick={close}
            className="w-8 h-8 rounded-full bg-surface-alt flex items-center justify-center hover:bg-border text-ink-muted"
          >
            &times;
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="input-label">Nome</label>
            <input
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Culto de Domingo"
            />
          </div>

          <div>
            <label className="input-label">Descrição</label>
            <textarea className="input-field min-h-[60px]" value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>

          <div>
            <label className="input-label">Tipo</label>
            <select className="input-field" value={type} onChange={(e) => setType(e.target.value as "recurring" | "special")}>
              <option value="recurring">Recorrente</option>
              <option value="special">Especial</option>
            </select>
          </div>

          <div>
            <label className="input-label">Icone</label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg border-2 ${
                    icon === i ? "border-brand bg-brand-light" : "border-border-soft"
                  }`}
                >
                  {getIconEmoji(i)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Local</label>
              <input
                className="input-field"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Templo principal"
              />
            </div>

            <div>
              <label className="input-label">Horario base</label>
              <input
                type="time"
                className="input-field"
                value={baseTime}
                onChange={(e) => setBaseTime(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="input-label">Instrucoes</label>
            <textarea
              className="input-field min-h-[60px]"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Orientacoes para este evento..."
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border-soft flex gap-2 justify-end">
          <button onClick={close} className="btn btn-secondary">
            Cancelar
          </button>
          <button onClick={save} disabled={saving} className="btn btn-primary">
            {saving ? "Salvando..." : isEdit ? "Salvar" : "Criar"}
          </button>
        </div>
      </div>
    </div>
  );
}
