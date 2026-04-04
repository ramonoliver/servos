"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/hooks/use-app";
import { supabase } from "@/lib/supabase/client";
import { getIconEmoji, genId } from "@/lib/utils/helpers";
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

  async function deleteEvent(ev: Event) {
    const { error } = await supabase
      .from("events")
      .update({ active: false })
      .eq("id", ev.id);

    if (error) {
      console.error("Erro ao remover evento:", error);
      toast("Erro ao remover evento.");
      return;
    }

    toast(ev.name + " removido.");
    setModal(null);
    await loadData();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Eventos</h1>
          <p className="page-subtitle">Cultos e eventos especiais</p>
        </div>
        {canDo("event.create") && (
          <button onClick={() => setModal({ type: "form" })} className="btn btn-primary">
            + Novo
          </button>
        )}
      </div>

      {[{ title: "Cultos Recorrentes", list: recurring }, { title: "Eventos Especiais", list: special }].map(
        (section) => (
          <div key={section.title} className="mb-8">
            <h3 className="font-display text-lg mb-3">{section.title}</h3>

            <div className="card">
              {loading ? (
                <div className="px-5 py-8 text-center text-sm text-ink-faint">Carregando eventos...</div>
              ) : section.list.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-ink-faint">Nenhum evento.</div>
              ) : (
                section.list.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center gap-3 px-5 py-3 border-t border-border-soft first:border-t-0 hover:bg-brand-glow transition-colors group"
                  >
                    <span className="text-xl">{getIconEmoji(e.icon)}</span>

                    <div className="flex-1">
                      <div className="text-sm font-medium">{e.name}</div>
                      {e.description && <div className="text-[11px] text-ink-faint">{e.description}</div>}
                      {e.location && <div className="text-[11px] text-ink-faint">{e.location}</div>}
                    </div>

                    <span className={`badge ${e.type === "recurring" ? "badge-green" : "badge-brand"}`}>
                      {e.type === "recurring" ? "Recorrente" : "Especial"}
                    </span>

                    {canDo("event.edit") && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                ))
              )}
            </div>
          </div>
        )
      )}

      {modal?.type === "form" && (
        <EventForm
          ev={(modal as any).ev}
          userId={user.id}
          churchId={user.church_id}
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
  userId,
  churchId,
  toast,
  close,
  onSaved,
}: {
  ev?: Event;
  userId: string;
  churchId: string;
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

    if (isEdit) {
      const { error } = await supabase
        .from("events")
        .update(data)
        .eq("id", ev!.id);

      if (error) {
        console.error("Erro ao atualizar evento:", error);
        toast("Erro ao atualizar evento.");
        setSaving(false);
        return;
      }

      toast("Atualizado!");
    } else {
      const { error } = await supabase
        .from("events")
        .insert({
          id: genId(),
          church_id: churchId,
          ...data,
          active: true,
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error("Erro ao criar evento:", error);
        toast("Erro ao criar evento.");
        setSaving(false);
        return;
      }

      toast("Evento criado!");
    }

    setSaving(false);
    await onSaved();
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
            <label className="input-label">Descricao</label>
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