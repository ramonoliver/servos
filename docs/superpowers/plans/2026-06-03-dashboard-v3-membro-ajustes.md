# Dashboard V3 — Ajustes no Layout do Membro: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refinar o layout de membro com 3 mudanças: agenda em grid de cards, nova seção "Minhas escalas" condicional, e redesign da célula com líderes reais.

**Architecture:** 4 componentes alterados/adicionados em `home-v3-ui.tsx` + 1 mudança de tipo + 1 mudança em `page.tsx`. Cada task é atômica e commitada separadamente.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Framer Motion

**Spec:** `docs/superpowers/specs/2026-06-03-dashboard-v3-membro-ajustes.md`

---

## Mapa de arquivos

| Arquivo | Tasks |
|---|---|
| `src/components/dashboard/home-v3-ui.tsx` | Tasks 1, 2, 3, 5 |
| `src/app/(app)/dashboard-v3/page.tsx` | Task 4 |

---

### Task 1: MemberAgenda → grid de cards

**Files:**
- Modify: `src/components/dashboard/home-v3-ui.tsx` — função `MemberAgenda` (linha ~546)

- [ ] **Step 1: Substituir o corpo completo de `MemberAgenda`**

```tsx
export function MemberAgenda({ items }: { items: UpcomingEventItem[] }) {
  return (
    <Panel className="p-6" dataSectionId="member-agenda">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#AAAAAA]">
            Agenda pessoal
          </div>
          <h2 className="text-[22px] font-semibold tracking-[-0.025em] text-[#191919] md:text-[24px]">
            Seus compromissos
          </h2>
        </div>
        <Link
          href="/escalas"
          className="shrink-0 text-[13px] font-semibold text-[#F4532A] transition hover:opacity-75"
        >
          Ver todos
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-[#E6E0D7] bg-[#FAFAF8] px-5 py-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[18px] bg-white text-[#F4532A]">
            <Icon name="calendar" size={20} />
          </div>
          <div className="mt-4 text-[15px] font-bold text-[#191919]">Nenhum compromisso publicado</div>
          <p className="mx-auto mt-1 max-w-[300px] text-[13px] leading-5 text-[#777777]">
            Quando houver escala, encontro de célula ou evento para você, aparece aqui.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {items.slice(0, 4).map((item) => {
            const isEscala = item.icon === "calendar";
            const isPending = isEscala && item.badge === "Confirmar";
            const isConfirmed = isEscala && !isPending;
            const surface = isPending
              ? "bg-[#FFF0EC] border-[rgba(244,83,42,0.18)]"
              : isConfirmed
              ? "bg-[#EEF9F1] border-[#C8EDD5]"
              : "bg-[#EEF1FF] border-[rgba(74,90,222,0.14)]";
            const iconColor = isPending
              ? "text-[#F4532A]"
              : isConfirmed
              ? "text-[#1F8044]"
              : "text-[#4A5ADE]";
            return (
              <div
                key={`${item.title}-${item.time}`}
                className={cn(
                  "flex min-h-[150px] flex-col justify-between rounded-[20px] border p-4 transition hover:shadow-[0_10px_28px_-16px_rgba(25,25,25,0.18)]",
                  surface,
                )}
              >
                <div>
                  <div
                    className={cn(
                      "mb-3 flex h-[38px] w-[38px] items-center justify-center rounded-[12px] bg-white",
                      iconColor,
                    )}
                  >
                    <Icon name={item.icon} size={17} />
                  </div>
                  <div className="text-[14px] font-bold leading-tight text-[#191919]">{item.title}</div>
                  <div className="mt-1.5 text-[11px] leading-5 text-[#777777]">{item.time}</div>
                </div>
                <div className="mt-3">
                  {isPending ? (
                    <div className="flex gap-2">
                      <Link
                        href={item.href}
                        className="rounded-full bg-[#F4532A] px-3 py-1.5 text-[10px] font-bold text-white shadow-[0_4px_10px_-4px_rgba(244,83,42,0.55)] transition hover:bg-[#D94420]"
                      >
                        ✓ Vou
                      </Link>
                      <Link
                        href={item.href}
                        className="rounded-full border border-[#F0EFEB] bg-white px-2.5 py-1.5 text-[10px] font-semibold text-[#777777] transition hover:bg-[#FAFAF8]"
                      >
                        ✕
                      </Link>
                    </div>
                  ) : isConfirmed ? (
                    <span className="inline-block rounded-full border border-[#C8EDD5] bg-white/80 px-3 py-1 text-[10px] font-bold text-[#1F8044]">
                      ✓ Confirmado
                    </span>
                  ) : (
                    <Link
                      href={item.href}
                      className="inline-block rounded-full border border-[rgba(74,90,222,0.25)] bg-white/80 px-3 py-1 text-[10px] font-bold text-[#4A5ADE] transition hover:bg-[#EEF1FF]"
                    >
                      Ver célula →
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/home-v3-ui.tsx
git commit -m "feat(dashboard-v3): MemberAgenda em grid de cards estilo ministério"
```

---

### Task 2: Novo MemberSchedulePanel

**Files:**
- Modify: `src/components/dashboard/home-v3-ui.tsx` — inserir antes de `MemberHomeSections`

- [ ] **Step 1: Inserir o componente imediatamente antes de `function MemberHomeSections`**

```tsx
function MemberSchedulePanel({ items }: { items: UpcomingEventItem[] }) {
  return (
    <Panel className="p-6" dataSectionId="member-schedules">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#AAAAAA]">
            Ministério
          </div>
          <h2 className="text-[22px] font-semibold tracking-[-0.025em] text-[#191919] md:text-[24px]">
            Minhas escalas
          </h2>
        </div>
        <Link
          href="/escalas"
          className="shrink-0 text-[13px] font-semibold text-[#F4532A] transition hover:opacity-75"
        >
          Ver todas
        </Link>
      </div>
      <div className="flex flex-col gap-3">
        {items.slice(0, 4).map((item) => {
          const isPending = item.badge === "Confirmar";
          return (
            <div
              key={`${item.title}-${item.time}`}
              className={cn(
                "flex items-center gap-3 rounded-[16px] p-3",
                isPending
                  ? "border border-[rgba(244,83,42,0.18)] bg-[#FFF0EC]"
                  : "border border-[#F0EFEB] bg-white",
              )}
            >
              <div
                className={cn(
                  "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[12px] bg-white",
                  isPending ? "text-[#F4532A]" : "text-[#1F8044]",
                )}
              >
                <Icon name="calendar" size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-bold text-[#191919]">{item.title}</div>
                <div className="mt-0.5 text-[11px] text-[#777777]">{item.time}</div>
              </div>
              {isPending ? (
                <div className="flex flex-shrink-0 gap-1.5">
                  <Link
                    href={item.href}
                    className="rounded-full bg-[#F4532A] px-3 py-1.5 text-[10px] font-bold text-white shadow-[0_4px_10px_-4px_rgba(244,83,42,0.5)] transition hover:bg-[#D94420]"
                  >
                    ✓ Vou
                  </Link>
                  <Link
                    href={item.href}
                    className="rounded-full border border-[#F0EFEB] bg-white px-2.5 py-1.5 text-[10px] font-semibold text-[#777777] transition hover:bg-[#FAFAF8]"
                  >
                    ✕
                  </Link>
                </div>
              ) : (
                <span className="flex-shrink-0 rounded-full bg-[#EEF9F1] px-2.5 py-1 text-[10px] font-bold text-[#1F8044]">
                  ✓ Confirmado
                </span>
              )}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/home-v3-ui.tsx
git commit -m "feat(dashboard-v3): adiciona MemberSchedulePanel com confirmações"
```

---

### Task 3: Extensão de CellSummary + redesign MemberCellPanel

**Files:**
- Modify: `src/components/dashboard/home-v3-ui.tsx` — tipo `CellSummary` e função `MemberCellPanel`

- [ ] **Step 1: Adicionar campo `leaders` ao tipo `CellSummary`**

Busque `export type CellSummary` e adicione o campo `leaders?`:

```tsx
export type CellSummary = {
  name: string;
  nextMeeting: string;
  notice: string;
  leader: string;
  prayerCount: number;
  href: string;
  leaders?: Array<{ name: string; role: string }>;
};
```

- [ ] **Step 2: Substituir o componente `MemberCellPanel` completo**

```tsx
function MemberCellPanel({ cell }: { cell?: CellSummary }) {
  return (
    <Panel
      className="overflow-hidden border-[rgba(109,93,240,0.12)] shadow-[0_14px_40px_-28px_rgba(109,93,240,0.2)]"
      dataSectionId="member-cell"
    >
      <div className="h-[5px] bg-[linear-gradient(90deg,#6D5DF0,#8C78FF)]" />
      <div className="p-6">
        {cell ? (
          <>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9A95BB]">
                  Minha célula
                </div>
                <h2 className="text-[24px] font-extrabold leading-tight tracking-[-0.04em] text-[#191919]">
                  {cell.name}
                </h2>
                <div className="mt-1 text-[13px] font-semibold text-[#6D5DF0]">{cell.nextMeeting}</div>
              </div>
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[16px] bg-[#F5F0FF] text-[#6D5DF0]">
                <Icon name="home" size={22} />
              </div>
            </div>

            <div className="mb-4 rounded-[16px] bg-[#FAFAF8] p-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#AAAAAA]">
                Recado da célula
              </div>
              <div className="mt-1 text-[13px] leading-5 text-[#191919]">{cell.notice}</div>
            </div>

            <div className="mb-5">
              <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#AAAAAA]">
                Liderança
              </div>
              <div className="flex flex-col gap-2">
                {(cell.leaders && cell.leaders.length > 0
                  ? cell.leaders
                  : [{ name: cell.leader, role: "Líder" }]
                ).map((leader, index) => (
                  <div
                    key={leader.name}
                    className={cn(
                      "flex items-center gap-3 rounded-[14px] px-3 py-2.5",
                      index === 0 ? "bg-[#F5F0FF]" : "bg-[#FAFAF8]",
                    )}
                  >
                    <div
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                      style={{ background: index === 0 ? "#6D5DF0" : "#C07B1A" }}
                    >
                      {leader.name
                        .split(" ")
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((n) => n.charAt(0))
                        .join("")
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-bold text-[#191919]">{leader.name}</div>
                      <div className="text-[11px] text-[#9A95BB]">{leader.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href={cell.href}
              className="block w-full rounded-full bg-[#6D5DF0] px-4 py-2.5 text-center text-[13px] font-bold text-white shadow-[0_8px_20px_-10px_rgba(109,93,240,0.65)] transition hover:bg-[#5849D6]"
            >
              Abrir célula
            </Link>
          </>
        ) : (
          <div>
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9A95BB]">
              Minha célula
            </div>
            <div className="mt-5 rounded-[20px] border border-dashed border-[rgba(109,93,240,0.25)] bg-[#FAFAF8] p-5">
              <div className="text-[16px] font-bold text-[#191919]">
                Você ainda não está em uma célula.
              </div>
              <p className="mt-2 text-[13px] leading-6 text-[#777777]">
                Escolha uma célula próxima e comece a participar da vida em comunidade.
              </p>
              <Link
                href="/celulas"
                className="mt-4 inline-flex rounded-full bg-[#F4532A] px-4 py-2.5 text-[13px] font-bold text-white shadow-[0_10px_24px_-14px_rgba(244,83,42,0.7)] transition hover:bg-[#D94420]"
              >
                Ver células
              </Link>
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}
```

- [ ] **Step 3: Verificar que `prayerCount` ainda está no tipo** (para compatibilidade com `page.tsx`) — não deve ser removido do tipo, apenas não é renderizado no componente.

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/home-v3-ui.tsx
git commit -m "feat(dashboard-v3): redesign MemberCellPanel com líderes e acento"
```

---

### Task 4: page.tsx — popular leaders em CellSummary

**Files:**
- Modify: `src/app/(app)/dashboard-v3/page.tsx` — seção de construção do objeto `cell`

- [ ] **Step 1: Ler a seção de construção de `cell` no useMemo**

Busque `const cell: CellSummary | undefined = myCell` no arquivo (linha ~451). A seção atual é:

```ts
const cellLeaderId = myCell?.leader_ids?.[0] || myCell?.leader_id || "";
const cellLeader = cellLeaderId ? members.find((member) => member.id === cellLeaderId) : null;
const cell: CellSummary | undefined = myCell
  ? {
      name: myCell.name,
      nextMeeting: `${myCell.week_day} às ${myCell.time} · ${myCell.address || "Local a confirmar"}`,
      notice: "Separar pedidos de oração e confirmar presença antes do encontro.",
      leader: cellLeader?.name || "Liderança da célula",
      prayerCount: activePrayerRequests.length,
      href: `/celulas/${myCell.id}`,
    }
  : undefined;
```

- [ ] **Step 2: Substituir essa seção por**

```ts
const cellLeaderId = myCell?.leader_ids?.[0] || myCell?.leader_id || "";
const cellLeader = cellLeaderId ? members.find((member) => member.id === cellLeaderId) : null;

const cellLeaderIds = myCell
  ? [
      ...(myCell.leader_ids || []).map((id) => ({ id, role: "Líder" })),
      ...(myCell.co_leader_ids || []).map((id) => ({ id, role: "Co-líder" })),
    ].slice(0, 3)
  : [];
const cellLeaders = cellLeaderIds
  .map(({ id, role }) => {
    const member = members.find((m) => m.id === id);
    return member ? { name: member.name, role } : null;
  })
  .filter(Boolean) as Array<{ name: string; role: string }>;

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

- [ ] **Step 3: Verificar TypeScript**

```bash
cd /Users/ramonoliver/Documents/Projetos/servosapp && npx tsc --noEmit 2>&1 | grep "dashboard-v3\|home-v3-ui" | head -10
```

Esperado: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(app\)/dashboard-v3/page.tsx
git commit -m "feat(dashboard-v3): popula leaders reais em CellSummary"
```

---

### Task 5: MemberHomeSections — grade adaptável 2/3 colunas

**Files:**
- Modify: `src/components/dashboard/home-v3-ui.tsx` — função `MemberHomeSections`

- [ ] **Step 1: Substituir `MemberHomeSections` completo**

```tsx
function MemberHomeSections({ data }: { data: DashboardV3Data }) {
  const scheduleItems = data.upcoming.filter((item) => item.icon === "calendar");
  const hasSchedules = scheduleItems.length > 0;

  return (
    <>
      <MemberAgenda items={data.upcoming} />
      <section
        className={cn(
          "grid min-w-0 items-stretch gap-6",
          hasSchedules ? "xl:grid-cols-3" : "xl:grid-cols-2",
        )}
      >
        <MemberCellPanel cell={data.cell} />
        {hasSchedules && <MemberSchedulePanel items={scheduleItems} />}
        <MemberPrayerPanel items={data.prayers} />
      </section>
      <MemberMinistryGrid />
    </>
  );
}
```

- [ ] **Step 2: Verificar no browser**

Acesse `/dashboard-v3` como membro com ministério. A grade do meio deve ter 3 colunas (Célula | Minhas escalas | Pedidos). Como membro sem ministério (sem escalas), deve ter 2 colunas.

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/home-v3-ui.tsx
git commit -m "feat(dashboard-v3): MemberHomeSections com grade adaptável 2/3 colunas"
```

---

## Self-Review

**Cobertura da spec:**
- [x] MemberAgenda: grid 2/4-col, cards orange/green/indigo por tipo, empty state — Task 1
- [x] MemberSchedulePanel: lista de escalas, pending/confirmed, botões confirmação — Task 2
- [x] CellSummary.leaders?: campo adicionado ao tipo — Task 3
- [x] MemberCellPanel: barra de acento, cell.name extrabold, recado, líderes com avatar + papel, sem prayerCount — Task 3
- [x] page.tsx: cellLeaders populados de leader_ids + co_leader_ids — Task 4
- [x] MemberHomeSections: 3-col com hasSchedules, MemberSchedulePanel condicional — Task 5

**Tipos consistentes:**
- `leaders?: Array<{ name: string; role: string }>` definido em Task 3, populado em Task 4, consumido em Task 3 ✓
- `MemberSchedulePanel({ items: UpcomingEventItem[] })` definido Task 2, usado Task 5 ✓
- `scheduleItems` calculado em `MemberHomeSections` — só filtra `data.upcoming`, sem nova prop ✓
- `prayerCount` mantido no tipo `CellSummary` em Task 3 — compatibilidade com page.tsx ✓
