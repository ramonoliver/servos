# Dashboard V3 — Layout do Membro Comum: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reescrever o layout de membro do dashboard-v3 com 3 blocos (Agenda pessoal → Célula + Pedidos de oração → Ministério) e remover os 6 componentes antigos não usados.

**Architecture:** Todas as mudanças ficam em `home-v3-ui.tsx`. São criados 3 novos componentes (`MemberCellPanel`, `MemberPrayerPanel`, `MemberMinistryGrid`), o `MemberAgenda` e o `MemberHomeSections` são reescritos, e os 6 componentes antigos (`MemberNotices`, `MemberCommunion`, `MemberCellOverview`, `MemberPrayerList`, `MemberServeSection`, `MemberDevotionalInvite`) são deletados. `page.tsx` não muda.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Framer Motion

**Spec:** `docs/superpowers/specs/2026-06-03-dashboard-v3-membro-layout.md`

**Verificação:** Após cada task, rode `npm run dev` e acesse `/dashboard-v3` logado como membro comum (`profileMode === "departmentMember"` ou `"cellMember"`).

---

## Mapa de arquivos

| Arquivo | Mudança |
|---|---|
| `src/components/dashboard/home-v3-ui.tsx` | Todas as 5 tasks |

---

### Task 1: Reescrita de MemberAgenda

**Files:**
- Modify: `src/components/dashboard/home-v3-ui.tsx` — função `MemberAgenda` (atualmente em torno da linha 546)

O `MemberAgenda` atual exibe cards em grid 4-col com tons de cor alternados. O novo exibe uma lista vertical de compromissos diferenciados por tipo (escala = laranja, célula = índigo) com botões de confirmação inline.

- [ ] **Step 1: Localizar o componente atual**

Busque `export function MemberAgenda` no arquivo. O componente vai da declaração até o `}` de fechamento (cerca de linha 546–614). Leia-o para confirmar os limites antes de substituir.

- [ ] **Step 2: Substituir o componente completo**

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
        <div className="flex flex-col gap-3">
          {items.slice(0, 4).map((item) => {
            const isEscala = item.icon === "calendar";
            return (
              <div
                key={`${item.title}-${item.time}`}
                className={cn(
                  "flex items-center gap-4 rounded-[18px] p-4",
                  isEscala
                    ? "border border-[rgba(244,83,42,0.18)] bg-[#FFF0EC]"
                    : "border border-[rgba(74,90,222,0.14)] bg-[#EEF1FF]",
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[14px] bg-white",
                    isEscala ? "text-[#F4532A]" : "text-[#4A5ADE]",
                  )}
                >
                  <Icon name={item.icon} size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-bold text-[#191919]">{item.title}</div>
                  <div className="mt-1 text-[12px] text-[#777777]">
                    {item.time} · {item.location}
                  </div>
                  {isEscala && item.badge === "Confirmar" && (
                    <span className="mt-2 inline-block rounded-full border border-[rgba(244,83,42,0.2)] bg-[#FFF0EC] px-2.5 py-0.5 text-[10px] font-bold text-[#D94420]">
                      Aguardando confirmação
                    </span>
                  )}
                </div>
                <div className="flex flex-shrink-0 gap-2">
                  {isEscala ? (
                    <>
                      <Link
                        href={item.href}
                        className="rounded-full bg-[#F4532A] px-3.5 py-2 text-[11px] font-bold text-white shadow-[0_6px_16px_-8px_rgba(244,83,42,0.55)] transition hover:bg-[#D94420]"
                      >
                        ✓ Vou
                      </Link>
                      <Link
                        href={item.href}
                        className="rounded-full border border-[#F0EFEB] bg-white px-3 py-2 text-[11px] font-semibold text-[#777777] transition hover:bg-[#FAFAF8]"
                      >
                        ✕
                      </Link>
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      className="rounded-full border border-[rgba(74,90,222,0.25)] bg-white px-3.5 py-2 text-[11px] font-bold text-[#4A5ADE] transition hover:bg-[#EEF1FF]"
                    >
                      Ver célula
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

- [ ] **Step 3: Verificar no browser**

Acesse `/dashboard-v3` como membro. A seção de agenda deve exibir itens em lista vertical, escala com fundo laranja claro e botões "✓ Vou / ✕", célula com fundo índigo e botão "Ver célula".

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/home-v3-ui.tsx
git commit -m "feat(dashboard-v3): reescreve MemberAgenda com lista de confirmação"
```

---

### Task 2: Novo MemberCellPanel

**Files:**
- Modify: `src/components/dashboard/home-v3-ui.tsx` — inserir novo componente antes de `MemberHomeSections`

- [ ] **Step 1: Localizar ponto de inserção**

Busque `function MemberHomeSections` no arquivo. Insira o novo componente **imediatamente antes** dessa função.

- [ ] **Step 2: Inserir o componente**

```tsx
function MemberCellPanel({ cell }: { cell?: CellSummary }) {
  return (
    <Panel
      className="overflow-hidden border-[rgba(109,93,240,0.12)] bg-[#F5F0FF] shadow-[0_14px_40px_-28px_rgba(109,93,240,0.2)]"
      dataSectionId="member-cell"
    >
      <div className="p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9A95BB]">
              Minha célula
            </div>
            <h2 className="text-[22px] font-semibold tracking-[-0.025em] text-[#191919] md:text-[24px]">
              Comunhão
            </h2>
          </div>
          {cell && (
            <Link
              href={cell.href}
              className="shrink-0 rounded-full bg-[#6D5DF0] px-4 py-2.5 text-[13px] font-bold text-white shadow-[0_8px_20px_-12px_rgba(109,93,240,0.7)] transition hover:bg-[#5849D6]"
            >
              Abrir célula
            </Link>
          )}
        </div>

        {cell ? (
          <>
            <div className="text-[22px] font-bold tracking-[-0.035em] text-[#191919]">{cell.name}</div>
            <div className="mt-1 text-[13px] font-semibold text-[#6D5DF0]">{cell.nextMeeting}</div>
            <div className="mt-4 rounded-[18px] bg-white p-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#AAAAAA]">
                Recado da célula
              </div>
              <div className="mt-1 text-[13px] leading-5 text-[#191919]">{cell.notice}</div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-[16px] bg-white/60 p-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#9A95BB]">
                  Pedidos ativos
                </div>
                <div className="mt-1 text-[26px] font-bold leading-none tracking-[-0.04em] text-[#6D5DF0]">
                  {cell.prayerCount}
                </div>
                <div className="mt-1 text-[11px] text-[#9A95BB]">em oração</div>
              </div>
              <div className="rounded-[16px] bg-white/60 p-4">
                <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#9A95BB]">
                  Liderança
                </div>
                <div className="mt-2 text-[13px] font-semibold leading-tight text-[#191919]">
                  {cell.leader}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-[20px] border border-dashed border-[rgba(109,93,240,0.25)] bg-[#FAFAF8] p-5">
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
        )}
      </div>
    </Panel>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/home-v3-ui.tsx
git commit -m "feat(dashboard-v3): adiciona MemberCellPanel"
```

---

### Task 3: Novo MemberPrayerPanel

**Files:**
- Modify: `src/components/dashboard/home-v3-ui.tsx` — inserir após `MemberCellPanel`, antes de `MemberHomeSections`

- [ ] **Step 1: Inserir constante e componente**

Logo após o fechamento `}` de `MemberCellPanel`, insira:

```tsx
const prayerAvatarColors = ["#C07B1A", "#4A5ADE", "#1F8044", "#D94420"];

function MemberPrayerPanel({ items }: { items: PrayerRequestCardData[] }) {
  return (
    <Panel className="flex flex-col p-6" dataSectionId="member-prayers">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#AAAAAA]">
            Cuidado
          </div>
          <h2 className="text-[22px] font-semibold tracking-[-0.025em] text-[#191919] md:text-[24px]">
            Pedidos de oração
          </h2>
        </div>
        <Link
          href="/pedidos-oracao"
          className="shrink-0 text-[13px] font-semibold text-[#F4532A] transition hover:opacity-75"
        >
          Ver todos
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="flex-1 rounded-[20px] border border-dashed border-[#E6E0D7] bg-[#FAFAF8] px-5 py-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[18px] bg-white text-[#C07B1A]">
            <Icon name="heart" size={20} />
          </div>
          <div className="mt-3 text-[14px] font-bold text-[#191919]">Nenhum pedido ainda</div>
          <p className="mx-auto mt-1 max-w-[240px] text-[12px] leading-5 text-[#777777]">
            Compartilhe um pedido e a célula ora por você.
          </p>
        </div>
      ) : (
        <div className="flex-1 divide-y divide-[#F0EFEB]">
          {items.slice(0, 3).map((item, index) => (
            <Link
              key={item.title}
              href={item.href}
              className="flex items-start gap-3 py-3.5 transition hover:opacity-80"
            >
              <div
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white"
                style={{ background: prayerAvatarColors[index % prayerAvatarColors.length] }}
              >
                {item.person
                  .split(" ")
                  .slice(0, 2)
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-bold text-[#191919]">{item.person}</div>
                <p className="mt-0.5 line-clamp-2 text-[12px] leading-5 text-[#777777]">
                  {item.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Link
        href="/pedidos-oracao"
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-[16px] border border-dashed border-[#E6E0D7] bg-[#FAFAF8] py-3 text-[13px] font-bold text-[#777777] transition hover:bg-white"
      >
        <Icon name="plus" size={14} />
        Fazer pedido de oração
      </Link>
    </Panel>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/home-v3-ui.tsx
git commit -m "feat(dashboard-v3): adiciona MemberPrayerPanel"
```

---

### Task 4: Novo MemberMinistryGrid

**Files:**
- Modify: `src/components/dashboard/home-v3-ui.tsx` — inserir após `MemberPrayerPanel`, antes de `MemberHomeSections`

- [ ] **Step 1: Inserir constante e componente**

Logo após o fechamento `}` de `MemberPrayerPanel`, insira:

```tsx
const MEMBER_MINISTRIES = [
  {
    title: "Louvor",
    description: "Use seu talento para glorificar a Deus.",
    spots: "3 vagas",
    icon: "spark" as IconName,
    surface: "bg-[#EEF9F1] border-[#C8EDD5]",
    accent: "text-[#1F8044]",
  },
  {
    title: "Acolhimento",
    description: "Receba as pessoas com amor e alegria.",
    spots: "5 vagas",
    icon: "heart" as IconName,
    surface: "bg-[#FFF8ED] border-[#F2E0C2]",
    accent: "text-[#C07B1A]",
  },
  {
    title: "Ministério Kids",
    description: "Trabalhe com crianças e faça a diferença.",
    spots: "2 vagas",
    icon: "users" as IconName,
    surface: "bg-[#F5F0FF] border-[#DDD4FE]",
    accent: "text-[#6D5DF0]",
  },
  {
    title: "Mídia",
    description: "Sirva com criatividade na comunicação.",
    spots: "4 vagas",
    icon: "message" as IconName,
    surface: "bg-[#EEF4FF] border-[#C5D8FE]",
    accent: "text-[#3B6CF4]",
  },
];

function MemberMinistryGrid() {
  return (
    <Panel className="p-6" dataSectionId="member-ministry">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#AAAAAA]">
            Serviço
          </div>
          <h2 className="text-[22px] font-semibold tracking-[-0.025em] text-[#191919] md:text-[24px]">
            Em que você quer servir?
          </h2>
        </div>
        <Link
          href="/ministerios"
          className="inline-flex shrink-0 items-center gap-1 text-[13px] font-semibold text-[#F4532A] transition hover:opacity-75"
        >
          Ver ministérios
          <Icon name="arrow" size={13} />
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {MEMBER_MINISTRIES.map((item) => (
          <Link
            key={item.title}
            href="/ministerios"
            className={cn(
              "flex min-h-[148px] flex-col justify-between rounded-[20px] border p-5 transition hover:shadow-[0_14px_36px_-22px_rgba(25,25,25,0.22)]",
              item.surface,
            )}
          >
            <div>
              <div
                className={cn(
                  "mb-3 flex h-10 w-10 items-center justify-center rounded-[14px] bg-white",
                  item.accent,
                )}
              >
                <Icon name={item.icon} size={18} />
              </div>
              <div className="text-[15px] font-bold leading-tight text-[#191919]">{item.title}</div>
              <div className="mt-1.5 text-[12px] leading-5 text-[#777777]">{item.description}</div>
            </div>
            <span
              className={cn(
                "mt-4 inline-block rounded-full bg-white/80 px-3 py-1 text-[11px] font-bold",
                item.accent,
              )}
            >
              {item.spots}
            </span>
          </Link>
        ))}
      </div>
    </Panel>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/home-v3-ui.tsx
git commit -m "feat(dashboard-v3): adiciona MemberMinistryGrid"
```

---

### Task 5: Reescrita de MemberHomeSections + remoção dos componentes antigos

**Files:**
- Modify: `src/components/dashboard/home-v3-ui.tsx`

Esta task faz duas coisas: conecta os novos componentes e limpa os antigos. Faça em dois passos com dois commits.

#### Parte A — Reescrever MemberHomeSections

- [ ] **Step 1: Localizar e substituir MemberHomeSections**

Busque `function MemberHomeSections` no arquivo e substitua a função inteira:

```tsx
function MemberHomeSections({ data }: { data: DashboardV3Data }) {
  return (
    <>
      <MemberAgenda items={data.upcoming} />
      <section className="grid min-w-0 items-stretch gap-6 xl:grid-cols-2">
        <MemberCellPanel cell={data.cell} />
        <MemberPrayerPanel items={data.prayers} />
      </section>
      <MemberMinistryGrid />
    </>
  );
}
```

- [ ] **Step 2: Verificar no browser**

Acesse `/dashboard-v3` como membro. A página deve mostrar os 3 blocos na ordem correta: lista de agenda → grade 2-col (célula + pedidos) → grid de ministérios.

- [ ] **Step 3: Commit parcial**

```bash
git add src/components/dashboard/home-v3-ui.tsx
git commit -m "refactor(dashboard-v3): MemberHomeSections usa novos componentes"
```

#### Parte B — Remover os 6 componentes antigos

- [ ] **Step 4: Excluir os 6 componentes**

Busque cada nome abaixo e delete a função inteira (da linha `export function` ou `function` até o `}` de fechamento, incluindo linhas em branco adjacentes):

1. `MemberNotices` — buscar `export function MemberNotices` (ou `function MemberNotices`)
2. `MemberCommunion` — buscar `export function MemberCommunion`
3. `MemberCellOverview` — buscar `function MemberCellOverview`
4. `MemberPrayerList` — buscar `function MemberPrayerList`
5. `MemberServeSection` — buscar `function MemberServeSection`
6. `MemberDevotionalInvite` — buscar `function MemberDevotionalInvite`

Após deletar todos, confirme que o arquivo ainda compila sem erros de referência (nenhum desses nomes deve aparecer em outro lugar do arquivo — especialmente não em `MemberHomeSections`, que acabou de ser reescrito).

- [ ] **Step 5: Verificar build limpo**

```bash
npx tsc --noEmit 2>&1 | grep "home-v3-ui"
```

Esperado: sem erros relacionados ao arquivo.

- [ ] **Step 6: Verificar no browser novamente**

Acesse `/dashboard-v3` como membro e confirme que o layout ainda funciona após a deleção.

- [ ] **Step 7: Commit final**

```bash
git add src/components/dashboard/home-v3-ui.tsx
git commit -m "refactor(dashboard-v3): remove componentes de membro descontinuados"
```

---

## Self-Review

**Cobertura da spec:**
- [x] `MemberAgenda` reescrito com lista, tipos escala/célula, botões inline, empty state — Task 1
- [x] `MemberCellPanel`: fundo índigo, recado, stats (pedidos + líder), empty state com CTA — Task 2
- [x] `MemberPrayerPanel`: lista com avatar por índice, botão "Fazer pedido", empty state — Task 3
- [x] `MemberMinistryGrid`: 4 cards fixos, cores semânticas por ministério, link → `/ministerios` — Task 4
- [x] `MemberHomeSections` reescrito com 3 blocos + grid 2-col — Task 5A
- [x] 6 componentes antigos removidos — Task 5B
- [x] `page.tsx` intocado — confirmado (nenhuma task o toca)
- [x] `PrayerRequestCard` mantido (usado no layout admin) — nenhuma task o remove

**Tipos consistentes em todas as tasks:**
- `MemberCellPanel({ cell?: CellSummary })` — `CellSummary` definido no arquivo ✓
- `MemberPrayerPanel({ items: PrayerRequestCardData[] })` — tipo definido no arquivo ✓
- `prayerAvatarColors` definido na Task 3, usado na Task 3 ✓
- `MEMBER_MINISTRIES` definido na Task 4, usado na Task 4 ✓
- `MemberCellPanel`, `MemberPrayerPanel`, `MemberMinistryGrid` adicionados nas Tasks 2/3/4, referenciados na Task 5A ✓
