"use client";

import { useState } from "react";
import { ActionDrawer, SegmentedControl, MultiSelect } from "@/components/ui";
import type { MultiSelectOption } from "@/components/ui";
import { WEEK_DAYS, CELL_TYPES, DEFAULT_HEALTH, type Cell, type CellMemberRow, type CellNetwork } from "@/lib/cells/types";
import { saveCell } from "@/lib/cells/client";
import type { User } from "@/types";

export function CellForm({
  cell,
  members,
  cellMembers,
  networks = [],
  toast,
  close,
  onSaved,
}: {
  cell?: Cell;
  members: User[];
  cellMembers: CellMemberRow[];
  networks?: CellNetwork[];
  toast: (msg: string) => void;
  close: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!cell;
  const existingMemberIds = isEdit
    ? cellMembers.filter((cm) => cm.cell_id === cell!.id).map((cm) => cm.user_id)
    : [];

  const [name, setName] = useState(cell?.name || "");
  const [leaderIds, setLeaderIds] = useState<string[]>(cell?.leader_ids || []);
  const [coLeaderIds, setCoLeaderIds] = useState<string[]>(cell?.co_leader_ids || []);
  const [weekDay, setWeekDay] = useState(cell?.week_day || "");
  const [time, setTime] = useState(cell?.time || "");
  const [audience, setAudience] = useState(cell?.audience || "");
  const [address, setAddress] = useState(cell?.address || "");
  const [description, setDescription] = useState(cell?.description || "");
  const [maxMembers, setMaxMembers] = useState(cell?.max_members ?? 12);
  const [networkId, setNetworkId] = useState(cell?.network_id || "");
  const [memberIds, setMemberIds] = useState<string[]>(
    existingMemberIds.filter(
      (id) => !(cell?.leader_ids || []).includes(id) && !(cell?.co_leader_ids || []).includes(id)
    )
  );
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"info" | "membros">("info");

  const allOptions: MultiSelectOption[] = members.map((m) => ({
    id: m.id,
    label: m.name,
    sublabel: m.role === "admin" ? "Admin" : m.role === "leader" ? "Líder" : "Membro",
    avatarColor: m.avatar_color,
  }));
  const coLeaderOptions = allOptions.filter((o) => !leaderIds.includes(o.id));

  function addSpouses(ids: string[], setter: (v: string[]) => void) {
    const spouses = ids
      .map((id) => members.find((m) => m.id === id)?.spouse_id)
      .filter((s): s is string => !!s);
    if (!spouses.length) {
      toast("Nenhum cônjuge cadastrado para os selecionados.");
      return;
    }
    setter(Array.from(new Set([...ids, ...spouses])));
  }

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
      leader_ids: leaderIds,
      co_leader_ids: coLeaderIds.filter((id) => !leaderIds.includes(id)),
      network_id: networkId || null,
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
    <ActionDrawer
      open={true}
      onClose={close}
      title={isEdit ? "Editar célula" : "Nova célula"}
      width={480}
      footer={
        <>
          <button onClick={close} className="btn btn-secondary">Cancelar</button>
          <button onClick={submit} disabled={saving} className="btn btn-primary">
            {saving ? "Salvando..." : isEdit ? "Salvar" : "Criar"}
          </button>
        </>
      }
    >
      <div className="mb-6">
        <SegmentedControl
          value={tab}
          onChange={(val) => setTab(val as "info" | "membros")}
          options={[
            { value: "info", label: "Informações" },
            { value: "membros", label: "Membros" }
          ]}
        />
      </div>

      <div className="space-y-5">
        {tab === "info" && (
          <>
            <div>
              <label className="input-label">Nome da célula</label>
              <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Célula Jardins" autoFocus />
            </div>

            {networks.length > 0 && (
              <div>
                <label className="input-label">Supervisão (opcional)</label>
                <select className="input-field" value={networkId} onChange={(e) => setNetworkId(e.target.value)}>
                  <option value="">Sem supervisão</option>
                  {networks.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
              </div>
            )}

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
                <label className="input-label">Tipo / Público</label>
                <select className="input-field" value={audience} onChange={(e) => setAudience(e.target.value)}>
                  <option value="">Selecione…</option>
                  {CELL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  <option value="Outros">Outros</option>
                </select>
                {/* Allow custom value if not in list */}
                {audience && !([...CELL_TYPES, "Outros", ""] as string[]).includes(audience) && (
                  <input className="input-field mt-1.5" value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Tipo personalizado" />
                )}
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
          </>
        )}

        {tab === "membros" && (
          <>
            <div>
              <div className="flex items-center justify-between">
                <label className="input-label">Líderes</label>
                <button type="button" onClick={() => addSpouses(leaderIds, setLeaderIds)} className="text-[11px] font-bold text-brand-deep hover:text-brand">
                  + Incluir cônjuge
                </button>
              </div>
              <MultiSelect options={allOptions} selected={leaderIds} onChange={setLeaderIds} placeholder="Selecionar líder(es)... (casal pode ser os dois)" />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="input-label">Co-líderes (opcional)</label>
                <button type="button" onClick={() => addSpouses(coLeaderIds, (v) => setCoLeaderIds(v.filter((id) => !leaderIds.includes(id))))} className="text-[11px] font-bold text-brand-deep hover:text-brand">
                  + Incluir cônjuge
                </button>
              </div>
              <MultiSelect
                options={coLeaderOptions}
                selected={coLeaderIds}
                onChange={(ids) => setCoLeaderIds(ids.filter((id) => !leaderIds.includes(id)))}
                placeholder="Selecionar co-líder(es)..."
              />
            </div>

            <div>
              <label className="input-label">Membros</label>
              <MultiSelect
                options={allOptions}
                selected={memberIds}
                onChange={(ids) => setMemberIds(ids.filter((id) => !leaderIds.includes(id) && !coLeaderIds.includes(id)))}
                placeholder="Adicionar membros..."
              />
              <p className="mt-1.5 text-[11px] text-ink-faint">Líderes e co-líderes já entram como membros automaticamente.</p>
            </div>
          </>
        )}
      </div>
    </ActionDrawer>
  );
}
