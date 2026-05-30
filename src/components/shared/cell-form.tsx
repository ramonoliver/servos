"use client";

import { useState } from "react";
import { Modal, MultiSelect } from "@/components/ui";
import type { MultiSelectOption } from "@/components/ui";
import { WEEK_DAYS, DEFAULT_HEALTH, type Cell, type CellMemberRow } from "@/lib/cells/types";
import { saveCell } from "@/lib/cells/client";
import type { User } from "@/types";

export function CellForm({
  cell,
  members,
  cellMembers,
  toast,
  close,
  onSaved,
}: {
  cell?: Cell;
  members: User[];
  cellMembers: CellMemberRow[];
  toast: (msg: string) => void;
  close: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!cell;
  const existingMemberIds = isEdit
    ? cellMembers.filter((cm) => cm.cell_id === cell!.id).map((cm) => cm.user_id)
    : [];

  const [name, setName] = useState(cell?.name || "");
  const [leaderId, setLeaderId] = useState(cell?.leader_id || "");
  const [coLeaderId, setCoLeaderId] = useState(cell?.co_leader_id || "");
  const [weekDay, setWeekDay] = useState(cell?.week_day || "");
  const [time, setTime] = useState(cell?.time || "");
  const [audience, setAudience] = useState(cell?.audience || "");
  const [address, setAddress] = useState(cell?.address || "");
  const [description, setDescription] = useState(cell?.description || "");
  const [maxMembers, setMaxMembers] = useState(cell?.max_members ?? 12);
  const [memberIds, setMemberIds] = useState<string[]>(
    existingMemberIds.filter((id) => id !== cell?.leader_id && id !== cell?.co_leader_id)
  );
  const [saving, setSaving] = useState(false);

  const memberOptions: MultiSelectOption[] = members.map((m) => ({
    id: m.id,
    label: m.name,
    sublabel: m.role === "admin" ? "Admin" : m.role === "leader" ? "Líder" : "Membro",
    avatarColor: m.avatar_color,
  }));

  async function submit() {
    if (!name.trim()) {
      toast("Informe o nome da célula.");
      return;
    }
    setSaving(true);
    const data = {
      name: name.trim(),
      description,
      cover_color: cell?.cover_color || "#FF6B57",
      leader_id: leaderId || null,
      co_leader_id: coLeaderId || null,
      supervisor_id: cell?.supervisor_id || null,
      address,
      week_day: weekDay,
      time,
      max_members: Number(maxMembers) || 0,
      audience,
      status: cell?.status || "active",
      health: cell?.health || DEFAULT_HEALTH,
    };
    try {
      await saveCell({ mode: isEdit ? "update" : "create", cellId: cell?.id, data, memberIds });
      toast(isEdit ? "Célula atualizada!" : "Célula criada!");
      onSaved();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Erro ao salvar célula.");
      setSaving(false);
    }
  }

  return (
    <Modal
      title={isEdit ? "Editar célula" : "Nova célula"}
      close={close}
      width={560}
      footer={
        <>
          <button onClick={close} className="btn btn-secondary">Cancelar</button>
          <button onClick={submit} disabled={saving} className="btn btn-primary">
            {saving ? "Salvando..." : isEdit ? "Salvar" : "Criar"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="input-label">Nome da célula</label>
          <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Célula Jardins" autoFocus />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="input-label">Líder</label>
            <select className="input-field" value={leaderId} onChange={(e) => setLeaderId(e.target.value)}>
              <option value="">Selecione…</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="input-label">Co-líder (opcional)</label>
            <select className="input-field" value={coLeaderId} onChange={(e) => setCoLeaderId(e.target.value)}>
              <option value="">Nenhum</option>
              {members.filter((m) => m.id !== leaderId).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="input-label">Dia da semana</label>
            <select className="input-field" value={weekDay} onChange={(e) => setWeekDay(e.target.value)}>
              <option value="">Selecione…</option>
              {WEEK_DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="input-label">Horário</label>
            <input type="time" className="input-field" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="input-label">Público</label>
            <input className="input-field" value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Ex: Casais, Jovens..." />
          </div>
          <div>
            <label className="input-label">Máx. de membros</label>
            <input type="number" min={0} className="input-field" value={maxMembers} onChange={(e) => setMaxMembers(Number(e.target.value))} />
          </div>
        </div>

        <div>
          <label className="input-label">Endereço</label>
          <input className="input-field" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Onde a célula se reúne" />
        </div>

        <div>
          <label className="input-label">Descrição</label>
          <textarea className="input-field min-h-[60px]" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Sobre a célula..." />
        </div>

        <div>
          <label className="input-label">Membros</label>
          <MultiSelect
            options={memberOptions}
            selected={memberIds}
            onChange={(ids) => setMemberIds(ids.filter((id) => id !== leaderId && id !== coLeaderId))}
            placeholder="Adicionar membros..."
          />
          <p className="mt-1.5 text-[11px] text-ink-faint">O líder e o co-líder já entram como membros automaticamente.</p>
        </div>
      </div>
    </Modal>
  );
}
