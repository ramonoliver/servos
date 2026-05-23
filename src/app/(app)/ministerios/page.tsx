"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/hooks/use-app";
import { supabase } from "@/lib/supabase/client";
import { getIconEmoji, getInitials } from "@/lib/utils/helpers";
import { ConfirmDialog, Modal, MultiSelect } from "@/components/ui";
import type { MultiSelectOption } from "@/components/ui";
import Link from "next/link";
import type { Department, User, DepartmentMember } from "@/types";

const ICONS = ["music", "camera", "heart", "church", "cross", "flower", "flame", "star", "book", "baby", "pray"];

export default function MinisteriosPage() {
  const { user, toast, canDo, departments, refresh } = useApp();

  const [modal, setModal] = useState<
    null | { type: "form"; dept?: Department } | { type: "delete"; dept: Department }
  >(null);

  const [members, setMembers] = useState<User[]>([]);
  const [allDM, setAllDM] = useState<DepartmentMember[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);

    const [{ data: usersData, error: usersError }, { data: dmData, error: dmError }] =
      await Promise.all([
        supabase.from("users").select("*").eq("church_id", user.church_id).eq("active", true),
        supabase.from("department_members").select("*"),
      ]);

    if (usersError || dmError) {
      console.error({ usersError, dmError });
      toast("Erro ao carregar ministérios.");
      setLoading(false);
      return;
    }

    setMembers((usersData || []) as User[]);
    setAllDM((dmData || []) as DepartmentMember[]);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [user.church_id]);

  async function deleteDept(d: Department) {
    try {
      const response = await fetch("/api/departments/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "delete",
          departmentId: d.id,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        console.error("Erro ao excluir ministério:", data);
        toast(data?.error || "Erro ao excluir ministério.");
        return;
      }

      toast(d.name + " excluido.");
      setModal(null);
      await refresh();
      await loadData();
    } catch (error) {
      console.error("Erro ao excluir ministério:", error);
      toast("Erro ao excluir ministério.");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-xl font-bold text-ink">Ministérios</h1>
          <p className="text-[12px] text-ink-faint mt-0.5">{departments.length} ministérios cadastrados</p>
        </div>
        {canDo("department.create") && (
          <button onClick={() => setModal({ type: "form" })} className="btn btn-primary btn-sm">
            + Novo
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-ink-faint">Carregando ministérios...</div>
      ) : departments.length === 0 ? (
        <div className="py-12 text-center text-sm text-ink-faint">Nenhum ministério cadastrado.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {departments.map((d) => {
            const count = allDM.filter((dm) => dm.department_id === d.id).length;
            const leaderNames = (d.leader_ids || [])
              .map((id) => members.find((m) => m.id === id)?.name?.split(" ")[0])
              .filter(Boolean);

            return (
              <Link
                key={d.id}
                href={`/ministerios/${d.id}`}
                className="group bg-white border border-border-soft rounded-xl overflow-hidden hover:border-black/[.12] hover:shadow-sm transition-all cursor-pointer"
              >
                <div
                  className="h-16 flex items-center justify-center text-3xl relative"
                  style={{ background: d.color + "22" }}
                >
                  {getIconEmoji(d.icon)}

                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    {canDo("department.edit", d.id) && (
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setModal({ type: "form", dept: d }); }}
                        className="w-7 h-7 rounded-full bg-white/90 shadow-sm flex items-center justify-center text-xs text-ink opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                        title="Editar ministério"
                        aria-label="Editar ministério"
                      >
                        &#9998;
                      </button>
                    )}
                    {canDo("department.delete") && (
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setModal({ type: "delete", dept: d }); }}
                        className="w-7 h-7 rounded-full bg-white/90 shadow-sm flex items-center justify-center text-xs text-danger opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                        title="Excluir ministério"
                        aria-label="Excluir ministério"
                      >
                        &#10005;
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  <div className="font-display text-[16px] font-semibold text-ink leading-snug">{d.name}</div>
                  <div className="text-[11px] text-ink-faint mt-0.5">
                    {count} {count === 1 ? "membro" : "membros"}{leaderNames.length ? " · " + leaderNames.join(", ") : ""}
                  </div>
                  {d.description && (
                    <div className="text-xs text-ink-faint leading-relaxed line-clamp-2 mt-1">{d.description}</div>
                  )}
                  {d.function_names?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {d.function_names.slice(0, 3).map((fn) => (
                        <span key={fn} className="badge badge-secondary">{fn}</span>
                      ))}
                      {d.function_names.length > 3 && (
                        <span className="text-[10px] text-ink-faint self-center">+{d.function_names.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {modal?.type === "form" && (
        <DeptForm
          dept={(modal as any).dept}
          members={members}
          user={user}
          toast={toast}
          close={() => setModal(null)}
          allDM={allDM}
          onSaved={async () => {
            setModal(null);
            await refresh();
            await loadData();
          }}
        />
      )}

      {modal?.type === "delete" && (
        <ConfirmDialog
          title="Excluir ministério"
          message={`Você está prestes a excluir <strong>${modal.dept.name}</strong>.`}
          confirmLabel="Excluir"
          onCancel={() => setModal(null)}
          onConfirm={() => void deleteDept(modal.dept)}
        />
      )}
    </div>
  );
}

function DeptForm({ dept, members, user, toast, close, onSaved, allDM }: {
  dept?: Department;
  members: User[];
  user: User;
  toast: (msg: string) => void;
  close: () => void;
  onSaved: () => void;
  allDM: DepartmentMember[];
}) {
  const isEdit = !!dept;
  const [tab, setTab] = useState<"geral" | "pessoas">("geral");

  const [name, setName] = useState(dept?.name || "");
  const [desc, setDesc] = useState(dept?.description || "");
  const [icon, setIcon] = useState(dept?.icon || "church");
  const [color, setColor] = useState(dept?.color || "#7B9E87");
  const [functionNames, setFunctionNames] = useState<string[]>(dept?.function_names || []);
  const [newFunctionName, setNewFunctionName] = useState("");

  const existingMemberIds = isEdit
    ? allDM.filter((dm) => dm.department_id === dept!.id).map((dm) => dm.user_id)
    : [];
  const [leaderIds, setLeaderIds] = useState<string[]>(dept?.leader_ids || [user.id]);
  const [coLeaderIds, setCoLeaderIds] = useState<string[]>(dept?.co_leader_ids || []);
  const [memberIds, setMemberIds] = useState<string[]>(
    existingMemberIds.filter(
      (id) => !(dept?.leader_ids || []).includes(id) && !(dept?.co_leader_ids || []).includes(id)
    )
  );
  const [memberSearch, setMemberSearch] = useState("");

  function addFunctionName() {
    const normalized = newFunctionName.trim();
    if (!normalized) return;
    if (functionNames.some((f) => f.toLowerCase() === normalized.toLowerCase())) {
      setNewFunctionName("");
      return;
    }
    setFunctionNames((c) => [...c, normalized]);
    setNewFunctionName("");
  }

  function removeFunctionName(fn: string) {
    setFunctionNames((c) => c.filter((f) => f !== fn));
  }

  const eligibleLeaders = members.filter((m) => m.role === "admin" || m.role === "leader");
  const eligibleCoLeaders = members.filter((m) => !leaderIds.includes(m.id));
  const allActiveMembers = members.filter(
    (m) => m.name.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const leaderOptions: MultiSelectOption[] = eligibleLeaders.map((m) => ({
    id: m.id,
    label: m.name,
    sublabel: m.role === "admin" ? "Admin" : "Líder",
    avatarColor: m.avatar_color,
  }));

  const coLeaderOptions: MultiSelectOption[] = eligibleCoLeaders.map((m) => ({
    id: m.id,
    label: m.name,
    sublabel: m.role === "admin" ? "Admin" : m.role === "leader" ? "Líder" : "Membro",
    avatarColor: m.avatar_color,
  }));

  async function save() {
    if (!name.trim()) { toast("Informe o nome."); return; }
    const data = { name, description: desc, icon, color, function_names: functionNames, leader_ids: leaderIds, co_leader_ids: coLeaderIds };
    try {
      const response = await fetch("/api/departments/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: isEdit ? "update" : "create", departmentId: dept?.id, data, memberIds }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) { toast(payload?.error || "Erro ao salvar ministério."); return; }
      toast(isEdit ? "Atualizado!" : "Criado!");
      onSaved();
    } catch {
      toast("Erro ao salvar ministério.");
    }
  }

  return (
    <Modal
      title={isEdit ? "Editar Ministério" : "Novo Ministério"}
      close={close}
      width={520}
      footer={
        <>
          <button onClick={close} className="btn btn-secondary">Cancelar</button>
          <button onClick={save} className="btn btn-primary">{isEdit ? "Salvar" : "Criar"}</button>
        </>
      }
    >
      <div className="flex gap-0.5 mb-5 border-b border-border-soft -mx-1 px-1">
        {(["geral", "pessoas"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-[13px] font-medium transition-colors ${
              tab === t ? "text-ink border-b-2 border-brand" : "text-ink-muted hover:text-ink"
            }`}
          >
            {t === "geral" ? "Geral" : "Pessoas"}
          </button>
        ))}
      </div>

      {tab === "geral" && (
        <div className="space-y-4">
          <div>
            <label className="input-label">Nome</label>
            <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Louvor" autoFocus />
          </div>
          <div>
            <label className="input-label">Descrição</label>
            <textarea className="input-field min-h-[56px]" value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>
          <div className="grid grid-cols-[1fr_100px] gap-4">
            <div>
              <label className="input-label">Ícone</label>
              <div className="flex flex-wrap gap-1.5">
                {ICONS.map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIcon(i)}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-base border-2 transition-all ${
                      icon === i ? "border-brand bg-brand-light" : "border-border-soft hover:border-ink-ghost"
                    }`}
                  >
                    {getIconEmoji(i)}
                  </button>
                ))}
                {!ICONS.includes(icon as any) && icon && (
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base border-2 border-brand bg-brand-light">
                    {icon}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <input
                  type="text"
                  className="w-12 h-8 text-center text-lg border-[1.5px] border-border rounded-[10px] outline-none focus:border-brand focus:ring-[3px] focus:ring-brand/10 transition-all bg-white"
                  placeholder="✏️"
                  value={!ICONS.includes(icon as any) ? icon : ""}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (!raw) return;
                    const graphemes = [...new Intl.Segmenter().segment(raw)];
                    const last = graphemes[graphemes.length - 1]?.segment;
                    if (last) setIcon(last);
                  }}
                />
                <span className="text-[10px] text-ink-faint">Emoji personalizado</span>
              </div>
            </div>
            <div>
              <label className="input-label">Cor</label>
              <input type="color" className="input-field h-10 p-1 cursor-pointer" value={color} onChange={(e) => setColor(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="input-label">Funções do ministério</label>
            <div className="rounded-[14px] border border-border-soft bg-surface-alt/50 p-3">
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  className="input-field flex-1"
                  value={newFunctionName}
                  onChange={(e) => setNewFunctionName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFunctionName(); } }}
                  placeholder="Ex: Câmera, Fotografia, Projeção..."
                />
                <button type="button" onClick={addFunctionName} className="btn btn-secondary sm:self-start">
                  Adicionar
                </button>
              </div>
              {functionNames.length > 0 ? (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {functionNames.map((fn) => (
                    <button key={fn} type="button" onClick={() => removeFunctionName(fn)} className="badge badge-secondary">
                      {fn} ×
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-ink-faint">Funções deste ministério para uso nas escalas.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "pessoas" && (
        <div className="space-y-4">
          <div>
            <label className="input-label">Líderes</label>
            <MultiSelect
              options={leaderOptions}
              selected={leaderIds}
              onChange={setLeaderIds}
              placeholder="Selecionar líderes..."
            />
          </div>
          <div>
            <label className="input-label">Co-líderes (opcional)</label>
            <MultiSelect
              options={coLeaderOptions}
              selected={coLeaderIds}
              onChange={(ids) => setCoLeaderIds(ids.filter((id) => !leaderIds.includes(id)))}
              placeholder="Selecionar co-líderes..."
            />
          </div>
          <div>
            <label className="input-label">Membros</label>
            <div className="rounded-[14px] border border-border-soft overflow-hidden">
              <div className="p-2 border-b border-border-soft bg-surface-alt/40">
                <input
                  className="w-full text-sm px-2 py-1.5 rounded-lg border-[1.5px] border-border outline-none focus:border-brand transition-all bg-white placeholder:text-ink-ghost"
                  placeholder="Buscar membro..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                />
              </div>
              <div className="max-h-52 overflow-y-auto">
                {allActiveMembers.length === 0 && (
                  <div className="px-3 py-4 text-xs text-ink-faint text-center">Nenhum membro encontrado</div>
                )}
                {allActiveMembers.map((m) => {
                  const isLeader = leaderIds.includes(m.id);
                  const isCoLeader = coLeaderIds.includes(m.id);
                  const isImplicit = isLeader || isCoLeader;
                  const checked = isImplicit || memberIds.includes(m.id);
                  return (
                    <label
                      key={m.id}
                      className={`flex items-center gap-3 px-3 py-2.5 border-b border-border-soft last:border-b-0 transition-colors ${
                        isImplicit ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-surface-alt/60"
                      } ${checked && !isImplicit ? "bg-brand-light/30" : ""}`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        disabled={isImplicit}
                        onChange={() => {
                          if (isImplicit) return;
                          setMemberIds((ids) =>
                            ids.includes(m.id) ? ids.filter((x) => x !== m.id) : [...ids, m.id]
                          );
                        }}
                      />
                      <div
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                          checked ? "bg-brand border-brand text-white" : "border-border"
                        }`}
                      >
                        {checked ? "✓" : ""}
                      </div>
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                        style={{ background: m.avatar_color }}
                      >
                        {getInitials(m.name)}
                      </div>
                      <span className="text-[13px] font-medium text-ink flex-1 truncate">{m.name}</span>
                      {isLeader && <span className="text-[10px] text-brand font-semibold">Líder</span>}
                      {isCoLeader && !isLeader && <span className="text-[10px] text-info font-semibold">Co-líder</span>}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
