# Ministry Form Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single-column oversized ministry form with a tabbed modal ("Geral" / "Pessoas"), styled MultiSelect for leaders/co-leaders, and a searchable member list.

**Architecture:** A new `MultiSelect` component handles the leaders/co-leaders dropdowns. `DeptForm` gains tab state (0=Geral, 1=Pessoas) and a new `memberIds` state. The API route gains a `memberIds` field and syncs `department_members` on both create and update.

**Tech Stack:** Next.js 14, React, TypeScript, Tailwind CSS, Supabase JS (server-side via service_role)

---

## Files

| File | Action |
|---|---|
| `src/components/ui/multi-select.tsx` | Create — reusable styled MultiSelect |
| `src/components/ui/index.tsx` | Modify — re-export MultiSelect |
| `src/app/(app)/ministerios/page.tsx` | Modify — DeptForm with tabs + MultiSelect + member list |
| `src/app/api/departments/manage/route.ts` | Modify — accept memberIds, sync department_members |

---

### Task 1: MultiSelect component

**Files:**
- Create: `src/components/ui/multi-select.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { getInitials } from "@/lib/utils/helpers";

export type MultiSelectOption = {
  id: string;
  label: string;
  sublabel?: string;
  avatarColor?: string;
};

type Props = {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
};

export function MultiSelect({ options, selected, onChange, placeholder = "Selecionar..." }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectedOptions = options.filter((o) => selected.includes(o.id));
  const filtered = options.filter(
    (o) => !selected.includes(o.id) && o.label.toLowerCase().includes(search.toLowerCase())
  );

  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  }

  function remove(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    onChange(selected.filter((x) => x !== id));
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <div
        onClick={() => setOpen((v) => !v)}
        className={`min-h-[44px] w-full px-3 py-2 border-[1.5px] rounded-[12px] bg-white cursor-pointer transition-all flex flex-wrap gap-1.5 items-center ${
          open ? "border-brand ring-[3px] ring-brand/10" : "border-border hover:border-ink-ghost"
        }`}
      >
        {selectedOptions.length === 0 && (
          <span className="text-sm text-ink-ghost">{placeholder}</span>
        )}
        {selectedOptions.map((o) => (
          <span
            key={o.id}
            className="inline-flex items-center gap-1 bg-surface-alt border border-border-soft rounded-full px-2 py-0.5 text-[11px] font-medium text-ink"
          >
            {o.avatarColor && (
              <span
                className="w-3.5 h-3.5 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[7px] font-bold"
                style={{ background: o.avatarColor }}
              >
                {getInitials(o.label)[0]}
              </span>
            )}
            {o.label.split(" ")[0]}
            <button
              type="button"
              onClick={(e) => remove(o.id, e)}
              className="text-ink-faint hover:text-danger ml-0.5"
            >
              ×
            </button>
          </span>
        ))}
        <span className="ml-auto text-ink-ghost text-xs select-none">▾</span>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full mt-1 w-full bg-white border border-border-soft rounded-[14px] shadow-lg overflow-hidden">
          <div className="p-2 border-b border-border-soft">
            <input
              autoFocus
              className="w-full text-sm px-2 py-1.5 rounded-lg border-[1.5px] border-border outline-none focus:border-brand transition-all bg-white placeholder:text-ink-ghost"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="px-3 py-3 text-xs text-ink-faint text-center">Nenhum resultado</div>
            )}
            {filtered.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => { toggle(o.id); setSearch(""); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-surface-alt transition-colors"
              >
                {o.avatarColor && (
                  <span
                    className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[8px] font-bold"
                    style={{ background: o.avatarColor }}
                  >
                    {getInitials(o.label)}
                  </span>
                )}
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-ink truncate">{o.label}</div>
                  {o.sublabel && <div className="text-[10px] text-ink-faint">{o.sublabel}</div>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Re-export from ui/index.tsx**

Open `src/components/ui/index.tsx` and add this export alongside the existing ones:

```ts
export { MultiSelect } from "./multi-select";
export type { MultiSelectOption } from "./multi-select";
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/multi-select.tsx src/components/ui/index.tsx
git commit -m "feat: add MultiSelect component"
```

---

### Task 2: Update API to sync department_members

**Files:**
- Modify: `src/app/api/departments/manage/route.ts`

- [ ] **Step 1: Add memberIds to the schema**

Replace the `departmentDataSchema` and `bodySchema` in `route.ts`:

```ts
const departmentDataSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().default(""),
  icon: z.string().min(1),
  color: z.string().min(1),
  function_names: z.array(z.string().trim().min(1)).default([]),
  leader_ids: z.array(z.string()).default([]),
  co_leader_ids: z.array(z.string()).default([]),
});

const bodySchema = z.object({
  mode: z.enum(["create", "update", "delete"]),
  departmentId: z.string().optional(),
  data: departmentDataSchema.optional(),
  memberIds: z.array(z.string()).default([]),
});
```

- [ ] **Step 2: Replace the create block**

Find the `if (mode === "create")` block (lines 48–63) and replace it:

```ts
if (mode === "create") {
  if (!data) {
    return NextResponse.json({ error: "Dados do ministerio sao obrigatorios." }, { status: 400 });
  }

  const deptId = genId();
  const { error } = await supabase.from("departments").insert({
    id: deptId,
    church_id: churchId,
    ...data,
    active: true,
    created_at: new Date().toISOString(),
  });
  if (error) throw error;

  // Build department_members rows
  const now = new Date().toISOString();
  const dmRows = [
    ...data.leader_ids.map((uid) => ({
      id: genId(), department_id: deptId, user_id: uid,
      function_name: "Líder", function_names: ["Líder"], joined_at: now,
    })),
    ...data.co_leader_ids.map((uid) => ({
      id: genId(), department_id: deptId, user_id: uid,
      function_name: "Co-líder", function_names: ["Co-líder"], joined_at: now,
    })),
    ...parsed.data.memberIds
      .filter((uid) => !data.leader_ids.includes(uid) && !data.co_leader_ids.includes(uid))
      .map((uid) => ({
        id: genId(), department_id: deptId, user_id: uid,
        function_name: "Membro", function_names: ["Membro"], joined_at: now,
      })),
  ];

  if (dmRows.length > 0) {
    const { error: dmError } = await supabase.from("department_members").insert(dmRows);
    if (dmError) throw dmError;
  }

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 3: Replace the update block**

Find the `if (mode === "update")` block (lines 81–93) and replace it:

```ts
if (mode === "update") {
  if (!data) {
    return NextResponse.json({ error: "Dados do ministerio sao obrigatorios." }, { status: 400 });
  }

  const { error } = await supabase
    .from("departments")
    .update(data)
    .eq("id", departmentId)
    .eq("church_id", churchId);
  if (error) throw error;

  // Sync department_members
  const { data: existingDM } = await supabase
    .from("department_members")
    .select("id, user_id")
    .eq("department_id", departmentId);

  const existingIds = new Set((existingDM || []).map((dm: any) => dm.user_id));
  const now = new Date().toISOString();

  const allDesiredIds = [
    ...data.leader_ids,
    ...data.co_leader_ids,
    ...parsed.data.memberIds.filter(
      (uid) => !data.leader_ids.includes(uid) && !data.co_leader_ids.includes(uid)
    ),
  ];
  const desiredSet = new Set(allDesiredIds);

  // Remove members no longer in the list
  const toRemove = (existingDM || [])
    .filter((dm: any) => !desiredSet.has(dm.user_id))
    .map((dm: any) => dm.id);
  if (toRemove.length > 0) {
    await supabase.from("department_members").delete().in("id", toRemove);
  }

  // Add new members
  const toAdd = allDesiredIds.filter((uid) => !existingIds.has(uid));
  const newRows = toAdd.map((uid) => {
    const fn = data.leader_ids.includes(uid)
      ? "Líder"
      : data.co_leader_ids.includes(uid)
      ? "Co-líder"
      : "Membro";
    return {
      id: genId(), department_id: departmentId, user_id: uid,
      function_name: fn, function_names: [fn], joined_at: now,
    };
  });
  if (newRows.length > 0) {
    const { error: dmError } = await supabase.from("department_members").insert(newRows);
    if (dmError) throw dmError;
  }

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/departments/manage/route.ts
git commit -m "feat: sync department_members on create/update"
```

---

### Task 3: Rebuild DeptForm with tabs

**Files:**
- Modify: `src/app/(app)/ministerios/page.tsx`

- [ ] **Step 1: Add MultiSelect import and update loadData to fetch existing dept members**

At the top of `MinisteriosPage`, the `loadData` function currently fetches `users` and `department_members`. Update the component to also pass `allDM` into `DeptForm` so it knows which users are already in each department.

Add `MultiSelect` to the import from `@/components/ui`:

```ts
import { ConfirmDialog, Modal, MultiSelect } from "@/components/ui";
import type { MultiSelectOption } from "@/components/ui";
```

- [ ] **Step 2: Replace DeptForm function entirely**

Replace the entire `function DeptForm(...)` (lines 192–440) with the following:

```tsx
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

  // Geral
  const [name, setName] = useState(dept?.name || "");
  const [desc, setDesc] = useState(dept?.description || "");
  const [icon, setIcon] = useState(dept?.icon || "church");
  const [color, setColor] = useState(dept?.color || "#7B9E87");
  const [functionNames, setFunctionNames] = useState<string[]>(dept?.function_names || []);
  const [newFunctionName, setNewFunctionName] = useState("");

  // Pessoas
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
        body: JSON.stringify({
          mode: isEdit ? "update" : "create",
          departmentId: dept?.id,
          data,
          memberIds,
        }),
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
      {/* Tabs */}
      <div className="flex gap-0.5 mb-5 border-b border-border-soft -mx-1 px-1">
        {(["geral", "pessoas"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-[13px] font-medium rounded-t-lg transition-colors capitalize ${
              tab === t
                ? "text-ink border-b-2 border-brand"
                : "text-ink-muted hover:text-ink"
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

          {/* Icon + Color side by side */}
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
```

- [ ] **Step 3: Pass `allDM` to DeptForm in the modal render**

Find the two places where `<DeptForm` is rendered (around line 165 and ensure `allDM` is passed):

```tsx
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
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Manual test — create ministry**

1. Open http://localhost:3000/ministerios
2. Click "+ Novo"
3. Verify modal shows two tabs: "Geral" and "Pessoas"
4. Fill in name + icon in "Geral"
5. Switch to "Pessoas", select a leader via the MultiSelect dropdown
6. Select a member from the list
7. Click "Criar" — verify toast "Criado!" and ministry appears in the list

- [ ] **Step 6: Manual test — edit ministry**

1. Click edit on an existing ministry
2. Verify "Pessoas" tab pre-populates leaders, co-leaders, and members
3. Add/remove a member, click "Salvar"
4. Reopen the edit modal — verify the member list reflects the change

- [ ] **Step 7: Commit**

```bash
git add src/app/(app)/ministerios/page.tsx
git commit -m "feat: tabbed ministry form with MultiSelect and member list"
```
