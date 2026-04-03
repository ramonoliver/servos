"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/hooks/use-app";
import { getDB } from "@/lib/db/local-db";
import { suggestMembers, autoSelectWithCouples, DAY_LABELS } from "@/lib/ai/engine";
import { getDayOfWeek, getInitials, getIconEmoji } from "@/lib/utils/helpers";
import type { Event, Department, User, DepartmentMember, Schedule, ScheduleMember, UnavailableDate } from "@/types";

export default function NovaEscalaPage() {
  const { user, toast, departments } = useApp();
  const db = getDB();
  const router = useRouter();
  const events = db.getWhere<Event>("events", { church_id: user.church_id }).filter(e => e.active);
  const members = db.getWhere<User>("users", { church_id: user.church_id }).filter(u => u.active);
  const allDM = db.getAll<DepartmentMember>("department_members");
  const allSchedules = db.getAll<Schedule>("schedules");
  const allSM = db.getAll<ScheduleMember>("schedule_members");
  const allUD = db.getAll<UnavailableDate>("unavailable_dates");

  const [eventId, setEventId] = useState(events[0]?.id || "");
  const [deptId, setDeptId] = useState(departments[0]?.id || "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("18:00");
  const [arrivalTime, setArrivalTime] = useState("");
  const [instructions, setInstructions] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [aiRan, setAiRan] = useState(false);

  const deptMembers = useMemo(() => allDM.filter(dm => dm.department_id === deptId), [deptId, allDM]);
  const deptMemberIds = deptMembers.map(dm => dm.user_id);
  const avgSchedules = members.length ? members.reduce((a, m) => a + m.total_schedules, 0) / members.length : 0;

  const scored = useMemo(() => {
    if (!date) return [];
    const dow = getDayOfWeek(date);
    return suggestMembers(members, deptMembers, {
      date, dayOfWeek: dow, deptMemberIds, unavailableDates: allUD,
      existingSchedules: allSchedules, existingScheduleMembers: allSM, avgSchedules,
    });
  }, [date, deptId, members, deptMembers]);

  function runAI() {
    if (!date) { toast("Selecione a data primeiro."); return; }
    const auto = autoSelectWithCouples(scored, 8);
    setSelectedIds(auto);
    setAiRan(true);
    toast(`IA sugeriu ${auto.length} membros!`);
  }

  function toggleMember(id: string) {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      const next = [...prev, id];
      const m = members.find(u => u.id === id);
      if (m?.spouse_id && deptMemberIds.includes(m.spouse_id) && !next.includes(m.spouse_id)) {
        const spouseScore = scored.find(s => s.user.id === m.spouse_id);
        if (spouseScore?.available) next.push(m.spouse_id);
      }
      return next;
    });
  }

  function save(publish: boolean) {
    if (!date || !eventId || !deptId) { toast("Preencha evento, ministerio e data."); return; }
    const sched = db.insert("schedules", {
      church_id: user.church_id, event_id: eventId, department_id: deptId, date, time,
      arrival_time: arrivalTime || "", status: publish ? "active" : "draft",
      instructions, notes: "", published: publish, created_by: user.id,
    });
    selectedIds.forEach(uid => {
      const dm = deptMembers.find(d => d.user_id === uid);
      db.insert("schedule_members", {
        schedule_id: sched.id, user_id: uid, function_name: dm?.function_name || "",
        status: "pending", decline_reason: "", substitute_id: null, substitute_for: null,
        is_reserve: false, responded_at: null, notified_at: new Date().toISOString(),
      });
    });
    toast(publish ? `Escala publicada com ${selectedIds.length} membros!` : "Rascunho salvo.");
    router.push("/escalas");
  }

  return (
    <div className="max-w-[720px] mx-auto">
      <div className="mb-6">
        <h1 className="page-title">Nova Escala</h1>
        <p className="page-subtitle">Configure o evento, equipe e publique.</p>
      </div>

      {/* Step 1: Event & Date */}
      <div className="card p-6 mb-5">
        <h3 className="font-display text-lg mb-4">Evento e Data</h3>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="input-label">Evento</label><select className="input-field" value={eventId} onChange={e => setEventId(e.target.value)}>{events.map(ev => <option key={ev.id} value={ev.id}>{getIconEmoji(ev.icon)} {ev.name}</option>)}</select></div>
          <div><label className="input-label">Ministerio</label><select className="input-field" value={deptId} onChange={e => { setDeptId(e.target.value); setSelectedIds([]); setAiRan(false); }}>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
          <div><label className="input-label">Data</label><input type="date" className="input-field" value={date} onChange={e => { setDate(e.target.value); setAiRan(false); }} /></div>
          <div><label className="input-label">Horario</label><input type="time" className="input-field" value={time} onChange={e => setTime(e.target.value)} /></div>
          <div><label className="input-label">Horario de chegada (opcional)</label><input type="time" className="input-field" value={arrivalTime} onChange={e => setArrivalTime(e.target.value)} placeholder="Ex: 1h antes" /></div>
        </div>
      </div>

      {/* Step 2: Members */}
      <div className="card p-6 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg">Equipe ({selectedIds.length} selecionados)</h3>
          <button onClick={runAI} disabled={!date} className="btn btn-brand btn-sm disabled:opacity-40">&#129302; IA Sugerir</button>
        </div>
        {aiRan && <div className="text-xs text-brand font-semibold mb-3 flex items-center gap-1">&#129302; IA selecionou com base em disponibilidade, rodizio e casais.</div>}
        {!date ? (
          <p className="text-sm text-ink-faint py-8 text-center">Selecione uma data para ver os membros disponiveis.</p>
        ) : scored.length === 0 ? (
          <p className="text-sm text-ink-faint py-8 text-center">Nenhum membro neste ministerio.</p>
        ) : (
          <div className="space-y-2">
            {scored.map(item => {
              const isSelected = selectedIds.includes(item.user.id);
              const spouse = item.user.spouse_id ? members.find(m => m.id === item.user.spouse_id) : null;
              return (
                <div key={item.user.id}>
                  <div onClick={() => item.available && toggleMember(item.user.id)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] border-[1.5px] transition-all ${
                      !item.available ? "opacity-35 cursor-not-allowed border-transparent bg-surface-alt" :
                      isSelected ? "border-success bg-success-light cursor-pointer" :
                      "border-border-soft cursor-pointer hover:border-ink-ghost"
                    }`}>
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center text-[10px] font-bold transition-all ${isSelected ? "bg-ink border-ink text-white" : "border-border"}`}>{isSelected ? "\u2713" : ""}</div>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-bold" style={{ background: item.user.avatar_color }}>{getInitials(item.user.name)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium truncate">{item.user.name}</div>
                      <div className="text-[10px] text-ink-faint">{item.dept_member?.function_name || ""} &middot; {item.user.total_schedules} escalas &middot; Score: {item.score}</div>
                    </div>
                    {spouse && deptMemberIds.includes(spouse.id) && <span className="text-[9px] font-semibold text-brand bg-brand-light px-1.5 py-0.5 rounded-full">&#128145; {spouse.name.split(" ")[0]}</span>}
                    <div className={`w-2 h-2 rounded-full ${item.available ? "bg-success" : "bg-danger"}`} />
                  </div>
                  {!item.available && <div className="text-[10px] text-danger font-medium ml-9 mt-0.5">&#9888; {item.reasons[0]?.label}</div>}
                  {item.alerts.length > 0 && item.available && <div className="text-[10px] text-amber font-medium ml-9 mt-0.5">&#9888; {item.alerts.join(", ")}</div>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Step 3: Instructions */}
      <div className="card p-6 mb-5">
        <h3 className="font-display text-lg mb-4">Instrucoes (opcional)</h3>
        <textarea className="input-field min-h-[80px]" value={instructions} onChange={e => setInstructions(e.target.value)} placeholder="Notas para a equipe, repertorio, orientacoes..." />
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <button onClick={() => router.back()} className="btn btn-secondary">Cancelar</button>
        <button onClick={() => save(false)} className="btn btn-secondary">Salvar rascunho</button>
        <button onClick={() => save(true)} className="btn btn-primary">Publicar e notificar &middot; {selectedIds.length}</button>
      </div>
    </div>
  );
}
