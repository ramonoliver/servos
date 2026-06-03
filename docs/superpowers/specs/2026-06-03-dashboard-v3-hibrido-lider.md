# Dashboard V3 — Layout do Líder Híbrido

**Data:** 2026-06-03
**Status:** Aprovado pelo usuário
**Escopo:** Novo layout para `profileMode === "hybrid"` (líder pastoral que também participa de célula) usando os novos componentes de membro, com lógica de liderança de célula.

---

## Contexto

O `profileMode === "hybrid"` (role === "leader" com vida de célula) atualmente renderiza o mesmo layout do admin. Com os novos componentes de membro, o híbrido deve ver:
1. Bloco de gestão pastoral (igual ao admin)
2. Bloco de vida pessoal (usando os novos componentes de membro)

Regra geral aprovada: se o membro **lidera** a célula → visão de liderança; se é **membro** → visão de membro.

---

## Estrutura de Layout — Hybrid

```
Hero
─────────────────── GESTÃO ───────────────────
PriorityCards (4 cards de métricas)
PriorityList | ActivityTimeline | UpcomingEvents
CarePeopleSection | InsightCards
──────────────────── VIDA PESSOAL ────────────────────
MemberAgenda (escalas pessoais como participante)
grid 2-col:
  MemberCellPanel (com badge "Você lidera" se userIsLeader)
  MemberPrayerPanel
```

**Sem** `MemberMinistryGrid` no híbrido — o líder já gerencia ministérios via os painéis de gestão acima.

---

## Mudanças de Dados

### CellSummary — novo campo `userIsLeader`

```ts
export type CellSummary = {
  name: string;
  nextMeeting: string;
  notice: string;
  leader: string;
  prayerCount: number;
  href: string;
  leaders?: Array<{ name: string; role: string }>;
  userIsLeader?: boolean;   // NOVO
};
```

### page.tsx — popular `userIsLeader`

```ts
const userIsLeader = myCell
  ? [...(myCell.leader_ids || []), ...(myCell.co_leader_ids || [])].includes(user.id)
  : false;

const cell: CellSummary | undefined = myCell ? {
  // ...campos existentes...
  leaders: cellLeaders.length > 0 ? cellLeaders : undefined,
  userIsLeader,
} : undefined;
```

---

## Mudanças em Componentes

### MemberCellPanel — visão de liderança

Quando `cell.userIsLeader === true`, exibir uma pill abaixo do nome da célula:

```tsx
{cell.userIsLeader && (
  <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#6D5DF0] px-3 py-1 text-[11px] font-bold text-white">
    <Icon name="spark" size={11} />
    Você lidera esta célula
  </div>
)}
```

A pill fica entre `cell.nextMeeting` e o card de "Recado da célula". O resto do componente é idêntico (inclui a lista de líderes onde o próprio usuário aparece com papel "Líder" ou "Co-líder").

### DashboardV3Home — roteamento do hybrid

Adicionar `"hybrid"` a uma nova rota no render:

```tsx
const showMemberHome = data.profileMode === "departmentMember" || data.profileMode === "cellMember";
const showHybridHome = data.profileMode === "hybrid";
```

E no JSX:
```tsx
{showHybridHome ? (
  <HybridHomeSections data={data} />
) : showMemberHome ? (
  <MemberHomeSections data={data} />
) : (
  // admin layout...
)}
```

### Novo componente HybridHomeSections

```tsx
function HybridHomeSections({ data }: { data: DashboardV3Data }) {
  return (
    <>
      {/* ─── Gestão ─── */}
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

      {/* ─── Vida pessoal ─── */}
      <MemberAgenda items={data.upcoming} />
      <section className="grid min-w-0 items-stretch gap-6 xl:grid-cols-2">
        <MemberCellPanel cell={data.cell} />
        <MemberPrayerPanel items={data.prayers} />
      </section>
    </>
  );
}
```

**Notas:**
- `MemberAgenda` recebe `data.upcoming` que já inclui as escalas pessoais do líder como participante (filtradas por membership em `page.tsx`)
- Sem `MemberSchedulePanel` separado no híbrido — as escalas pessoais já aparecem em `MemberAgenda`
- Sem `MemberMinistryGrid` — desnecessário para líderes

---

## Escopo Técnico

### Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `src/components/dashboard/home-v3-ui.tsx` | `CellSummary.userIsLeader`, pill em `MemberCellPanel`, `showHybridHome`, novo `HybridHomeSections`, atualização de `DashboardV3Home` |
| `src/app/(app)/dashboard-v3/page.tsx` | Popular `userIsLeader` em `CellSummary` |

### O Que Não Muda

- `MemberHomeSections` (para `departmentMember` e `cellMember`) — sem alterações
- Layout admin (para `profileMode === "admin"`) — sem alterações
- Todos os outros componentes
