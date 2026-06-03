# Dashboard V3 — Layout do Líder Híbrido: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar o layout específico para `profileMode === "hybrid"` (líder pastoral com vida de célula): bloco de gestão acima + bloco pessoal (agenda + célula como liderança + pedidos) abaixo.

**Architecture:** 3 tarefas: (1) dados — adicionar `userIsLeader` a `CellSummary` e populá-lo; (2) UI — pill de liderança em `MemberCellPanel` + novo `HybridHomeSections`; (3) roteamento — atualizar `DashboardV3Home` para usar o novo layout no hybrid.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-06-03-dashboard-v3-hibrido-lider.md`

---

## Mapa de arquivos

| Arquivo | Tasks |
|---|---|
| `src/app/(app)/dashboard-v3/page.tsx` | Task 1 |
| `src/components/dashboard/home-v3-ui.tsx` | Tasks 2 e 3 |

---

### Task 1: CellSummary.userIsLeader + page.tsx

**Files:**
- Modify: `src/components/dashboard/home-v3-ui.tsx` — tipo `CellSummary`
- Modify: `src/app/(app)/dashboard-v3/page.tsx` — objeto `cell`

- [ ] **Step 1: Adicionar `userIsLeader?` ao tipo `CellSummary`**

Busque `export type CellSummary` em `home-v3-ui.tsx` e adicione o campo:

```tsx
export type CellSummary = {
  name: string;
  nextMeeting: string;
  notice: string;
  leader: string;
  prayerCount: number;
  href: string;
  leaders?: Array<{ name: string; role: string }>;
  userIsLeader?: boolean;
};
```

- [ ] **Step 2: Popular `userIsLeader` em page.tsx**

Em `page.tsx`, localize a seção de construção do objeto `cell` (em torno da linha 465). A seção atual é:

```ts
const cell: CellSummary | undefined = myCell
  ? {
      name: myCell.name,
      nextMeeting: `${myCell.week_day} às ${myCell.time} · ${myCell.address || "Local a confirmar"}`,
      notice: "Separar pedidos de oração e confirmar presença antes do encontro.",
      leader: cellLeader?.name || "Liderança da célula",
      prayerCount: activePrayerRequests.length,
      href: `/celulas/${myCell.id}`,
      leaders: cellLeaders.length > 0 ? cellLeaders : undefined,
    }
  : undefined;
```

**Antes** desse bloco, insira:

```ts
const userIsLeader = myCell
  ? [...(myCell.leader_ids || []), ...(myCell.co_leader_ids || [])].includes(user.id)
  : false;
```

E adicione `userIsLeader` ao objeto `cell`:

```ts
const cell: CellSummary | undefined = myCell
  ? {
      name: myCell.name,
      nextMeeting: `${myCell.week_day} às ${myCell.time} · ${myCell.address || "Local a confirmar"}`,
      notice: "Separar pedidos de oração e confirmar presença antes do encontro.",
      leader: cellLeader?.name || "Liderança da célula",
      prayerCount: activePrayerRequests.length,
      href: `/celulas/${myCell.id}`,
      leaders: cellLeaders.length > 0 ? cellLeaders : undefined,
      userIsLeader,
    }
  : undefined;
```

- [ ] **Step 3: Verificar TypeScript**

```bash
cd /Users/ramonoliver/Documents/Projetos/servosapp && npx tsc --noEmit 2>&1 | grep "error" | head -10
```

Esperado: nenhum erro.

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/home-v3-ui.tsx src/app/\(app\)/dashboard-v3/page.tsx
git commit -m "feat(dashboard-v3): adiciona userIsLeader em CellSummary"
```

---

### Task 2: MemberCellPanel — pill de liderança + HybridHomeSections

**Files:**
- Modify: `src/components/dashboard/home-v3-ui.tsx`

**Parte A — Pill de liderança em MemberCellPanel**

- [ ] **Step 1: Adicionar pill após `cell.nextMeeting` em MemberCellPanel**

Localize o bloco do `cell.nextMeeting` dentro de `MemberCellPanel`. Atualmente é:

```tsx
<div className="mt-1 text-[13px] font-semibold text-[#6D5DF0]">{cell.nextMeeting}</div>
```

Substitua por:

```tsx
<div className="mt-1 text-[13px] font-semibold text-[#6D5DF0]">{cell.nextMeeting}</div>
{cell.userIsLeader && (
  <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#6D5DF0] px-3 py-1 text-[11px] font-bold text-white">
    <Icon name="spark" size={11} />
    Você lidera esta célula
  </div>
)}
```

**Parte B — Novo componente HybridHomeSections**

- [ ] **Step 2: Inserir `HybridHomeSections` antes de `MemberHomeSections`**

Imediatamente antes de `function MemberHomeSections`, insira:

```tsx
function HybridHomeSections({ data }: { data: DashboardV3Data }) {
  return (
    <>
      <PriorityCards items={data.priorities} />

      <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(280px,340px)]">
        <PriorityList items={data.priorityItems} />
        <ActivityTimeline items={data.timeline} />
        <UpcomingEvents items={data.upcoming} />
      </section>

      <section className="grid min-w-0 items-stretch gap-5 xl:grid-cols-2">
        <CarePeopleSection people={data.carePeople} />
        <InsightCards items={data.insights} />
      </section>

      <MemberAgenda items={data.upcoming} />

      <section className="grid min-w-0 items-stretch gap-6 xl:grid-cols-2">
        <MemberCellPanel cell={data.cell} />
        <MemberPrayerPanel items={data.prayers} />
      </section>
    </>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/home-v3-ui.tsx
git commit -m "feat(dashboard-v3): HybridHomeSections com gestão + vida pessoal"
```

---

### Task 3: DashboardV3Home — roteamento hybrid

**Files:**
- Modify: `src/components/dashboard/home-v3-ui.tsx` — função `DashboardV3Home`

- [ ] **Step 1: Localizar `DashboardV3Home`**

Busque `export function DashboardV3Home`. O bloco atual é:

```tsx
const showPastoralManagement = data.profileMode === "admin" || data.profileMode === "hybrid";
const showCellLife = data.profileMode === "hybrid" || data.profileMode === "cellMember";
const showMemberHome = data.profileMode === "departmentMember" || data.profileMode === "cellMember";
```

E mais abaixo:

```tsx
{showMemberHome ? (
  <MemberHomeSections data={data} />
) : (
  <>
    <PriorityCards items={data.priorities} />
    <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(280px,340px)]">
      {showPastoralManagement ? <PriorityList items={data.priorityItems} /> : <ActivityTimeline items={data.timeline} />}
      {showPastoralManagement ? <ActivityTimeline items={data.timeline} /> : <PrayerRequestCard items={data.prayers} />}
      <UpcomingEvents items={data.upcoming} />
    </section>
    <section className="grid min-w-0 items-stretch gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {showPastoralManagement ? <CarePeopleSection people={data.carePeople} /> : showCellLife ? <CellCard cell={data.cell} /> : <PrayerRequestCard items={data.prayers} />}
      <div className={cn("space-y-6", showPastoralManagement && !showCellLife && "flex h-full flex-col")}>
        {showCellLife && showPastoralManagement && <CellCard cell={data.cell} />}
        <InsightCards items={data.insights} className={showPastoralManagement && !showCellLife ? "h-full" : undefined} />
        {!showPastoralManagement && showCellLife && <PrayerRequestCard items={data.prayers} />}
      </div>
    </section>
  </>
)}
```

- [ ] **Step 2: Substituir as constantes e o bloco de renderização**

Substitua as 3 constantes por:

```tsx
const showMemberHome = data.profileMode === "departmentMember" || data.profileMode === "cellMember";
const showHybridHome = data.profileMode === "hybrid";
```

E substitua o bloco de renderização condicional por:

```tsx
{showHybridHome ? (
  <HybridHomeSections data={data} />
) : showMemberHome ? (
  <MemberHomeSections data={data} />
) : (
  <>
    <PriorityCards items={data.priorities} />
    <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(280px,340px)]">
      <PriorityList items={data.priorityItems} />
      <ActivityTimeline items={data.timeline} />
      <UpcomingEvents items={data.upcoming} />
    </section>
    <section className="grid min-w-0 items-stretch gap-5 xl:grid-cols-2">
      <CarePeopleSection people={data.carePeople} />
      <InsightCards items={data.insights} />
    </section>
  </>
)}
```

**Nota importante:** as constantes `showPastoralManagement` e `showCellLife` são removidas nesta refatoração. O bloco `else` (admin puro) agora sempre renderiza `PriorityList`, `ActivityTimeline`, `CarePeopleSection` e `InsightCards` diretamente, sem condicionais — pois é o único caso que chega ali (`admin`).

- [ ] **Step 3: Verificar TypeScript**

```bash
cd /Users/ramonoliver/Documents/Projetos/servosapp && npx tsc --noEmit 2>&1 | grep "error" | head -10
```

Esperado: nenhum erro.

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/home-v3-ui.tsx
git commit -m "feat(dashboard-v3): DashboardV3Home roteia hybrid para HybridHomeSections"
```

---

## Self-Review

**Cobertura da spec:**
- [x] `CellSummary.userIsLeader?` adicionado — Task 1
- [x] `userIsLeader` populado de `leader_ids + co_leader_ids` — Task 1
- [x] Pill "Você lidera esta célula" em `MemberCellPanel` — Task 2
- [x] `HybridHomeSections`: gestão (PriorityCards → PriorityList+Timeline+UpcomingEvents → CarePeopleSection+InsightCards) + pessoal (MemberAgenda → MemberCellPanel+MemberPrayerPanel) — Task 2
- [x] `showHybridHome = "hybrid"` + `DashboardV3Home` com 3 ramificações — Task 3
- [x] Admin puro simplificado (sem condicionais desnecessárias no `else`) — Task 3
- [x] `MemberHomeSections` intocado — Tasks 1-3 não tocam nele

**Tipos consistentes:**
- `userIsLeader?: boolean` definido Task 1 (tipo), populado Task 1 (page.tsx), consumido Task 2 (MemberCellPanel) ✓
- `HybridHomeSections` definido Task 2, referenciado Task 3 ✓
- Constantes `showPastoralManagement` e `showCellLife` removidas em Task 3 — não usadas em mais nenhum lugar após a refatoração ✓
