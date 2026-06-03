# Dashboard V3 — Layout do Membro Comum

**Data:** 2026-06-03
**Status:** Aprovado pelo usuário
**Escopo:** Reescrita total das seções abaixo do hero para `profileMode === "departmentMember" | "cellMember"`, com limpeza de componentes não usados.

---

## Contexto

O `home-v3-ui.tsx` tem uma série de componentes para membros comuns (`MemberAgenda`, `MemberCellOverview`, `MemberCommunion`, `MemberNotices`, `MemberPrayerList`, `MemberServeSection`, `MemberDevotionalInvite`, `MemberCellOverview`) que foram acumulando variantes e ficaram inconsistentes entre si. `MemberHomeSections` orquestra esses componentes mas mistura versões antigas e novas.

O objetivo é descartar esses componentes e reescrever o layout de membro do zero com uma estrutura clara de 3 blocos.

---

## Decisões de Design

### Estrutura

Abaixo do hero, membros comuns (`departmentMember` e `cellMember`) veem exatamente 3 blocos:

```
┌─────────────────────────────────────────────────┐
│  AGENDA PESSOAL (full-width)                    │
│  Escala pendente [✓ Vou] [✕]                    │
│  Célula próxima  [Ver célula →]                 │
└─────────────────────────────────────────────────┘

┌──────────────────────────┐  ┌────────────────────┐
│  CÉLULA                  │  │  PEDIDOS DE ORAÇÃO  │
│  Nome · horário          │  │  [avatar] pessoa    │
│  Recado da célula        │  │  texto do pedido    │
│  Stats: pedidos · líder  │  │  + Fazer pedido     │
└──────────────────────────┘  └────────────────────┘

┌─────────────────────────────────────────────────┐
│  MINISTÉRIO (full-width, 4-col grid)            │
│  [Louvor] [Acolhimento] [Kids] [Mídia]          │
└─────────────────────────────────────────────────┘
```

Grid 2-col apenas no segundo bloco (xl breakpoint). Em mobile tudo é coluna única.

---

## Componentes

### `MemberAgenda` (reescrito)

**Props:** `{ items: UpcomingEventItem[] }`

**Renderização:**
- Panel branco com `data-section="member-agenda"`, label "AGENDA PESSOAL", título "Seus compromissos", link "Ver todos" → `/escalas`
- Lista de items (`data.upcoming`, máx. 4) em cards internos individuais:
  - **Escala** (`icon === "calendar"`): fundo `#FFF0EC`, borda `rgba(244,83,42,.18)`, ícone calendario laranja; mostra `badge === "Confirmar"` como pill `bg-[#FFF0EC] text-[#D94420]`; botões inline `[✓ Vou]` (laranja) + `[✕]` (branco/bordado) — ambos são `<Link>` para `/escalas?id=...` (a confirmação real acontece na página de escala)
  - **Célula** (`icon === "home"`): fundo `#EEF1FF`, borda `rgba(74,90,222,.14)`, ícone home índigo; botão `[Ver célula →]` índigo → `href` do item
- **Empty state** (sem items): card dashed `#FAFAF8` com ícone calendario laranja, texto "Nenhum compromisso publicado" + descrição

### `MemberCellPanel` (novo, substitui `MemberCellOverview` e `MemberCommunion`)

**Props:** `{ cell?: CellSummary }`

**Com célula:**
- Panel `bg-[#F5F0FF]`, borda `rgba(109,93,240,.12)`, `data-section="member-cell"`
- Header: label "MINHA CÉLULA", título "Comunhão", botão "Abrir célula" índigo (`#6D5DF0`) → `cell.href`
- Nome da célula em `text-[22px] font-bold`
- Meta: horário + local em `text-[#6D5DF0] font-semibold`
- Card branco interno "Recado da célula" com `cell.notice`
- Grid 2-col de stats: `cell.prayerCount` pedidos ativos + nome do líder (`cell.leader`)

**Sem célula:**
- Empty state dashed com CTA "Ver células" → `/celulas`

### `MemberPrayerPanel` (novo, substitui `MemberPrayerList` e `PrayerRequestCard`)

**Props:** `{ items: PrayerRequestCardData[] }`

**Renderização:**
- Panel branco, `data-section="member-prayers"`, label "CUIDADO", título "Pedidos de oração", link "Ver todos" → `/pedidos-oracao`
- Lista de até 3 itens com avatar (iniciais + cor por índice: `#C07B1A`, `#4A5ADE`, `#1F8044`, `#D94420`), nome, texto do pedido (truncado a 2 linhas), tempo relativo
- Botão "Fazer pedido de oração" dashed no rodapé → `/pedidos-oracao`

**Empty state** (sem items): card dashed "Nenhum pedido ainda" + CTA "Compartilhar pedido"

### `MemberMinistryGrid` (novo, substitui `MemberServeSection`)

**Props:** nenhum (dados hardcoded — ministérios reais virão em feature futura)

**Renderização:**
- Panel branco, `data-section="member-ministry"`, label "SERVIÇO", título "Em que você quer servir?", link "Ver ministérios →" → `/ministerios`
- Grid `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4`, gap 10px
- 4 cards fixos:

| Ministério | Ícone | Cor de fundo | Cor do texto | Badge |
|---|---|---|---|---|
| Louvor | `spark` | `bg-[#EEF9F1] border-[#C8EDD5]` | `text-[#1F8044]` | "3 vagas" |
| Acolhimento | `heart` | `bg-[#FFF8ED] border-[#F2E0C2]` | `text-[#C07B1A]` | "5 vagas" |
| Ministério Kids | `users` | `bg-[#F5F0FF] border-[#DDD4FE]` | `text-[#6D5DF0]` | "2 vagas" |
| Mídia | `message` | `bg-[#EEF4FF] border-[#C5D8FE]` | `text-[#3B6CF4]` | "4 vagas" |

- Cada card: ícone em quadrado branco, título bold, descrição curta, badge "N vagas" em branco
- Link para `/ministerios` ao clicar em qualquer card

### `MemberHomeSections` (reescrito)

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

---

## Limpeza de Componentes

Os seguintes componentes são **removidos** do arquivo (não apenas deixados sem uso):

| Componente | Motivo |
|---|---|
| `MemberCommunion` | Substituído por `MemberCellPanel` |
| `MemberCellOverview` | Substituído por `MemberCellPanel` |
| `MemberPrayerList` | Substituído por `MemberPrayerPanel` |
| `MemberServeSection` | Substituído por `MemberMinistryGrid` |
| `MemberDevotionalInvite` | Removido — conteúdo não priorizado no novo layout |
| `MemberNotices` | Removido — notificações já estão na topbar (sino) |

`MemberAgenda` é mantido mas com seu corpo completamente reescrito.

**Nota:** `PrayerRequestCard` é mantido — ainda é usado no layout de admin (`showCellLife && !showPastoralManagement`).

---

## Tokens Visuais

Tudo segue a paleta V2 já em uso no arquivo. Novos valores introduzidos:

| Uso | Valor |
|---|---|
| Cell panel bg | `#F5F0FF` (igual ao `toneSurface.cell`) |
| Cell border | `rgba(109,93,240,.12)` |
| Cell accent | `#6D5DF0` |
| Cell shadow | `rgba(109,93,240,.2)` |
| Escala item bg | `#FFF0EC` / borda `rgba(244,83,42,.18)` |
| Célula item bg | `#EEF1FF` / borda `rgba(74,90,222,.14)` |
| Prayer avatar colors | `#C07B1A`, `#4A5ADE`, `#1F8044`, `#D94420` (por índice) |

---

## Escopo Técnico

### Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `src/components/dashboard/home-v3-ui.tsx` | Reescrita de `MemberAgenda`, `MemberHomeSections`; novos `MemberCellPanel`, `MemberPrayerPanel`, `MemberMinistryGrid`; remoção de 6 componentes |

### Arquivos não alterados

- `src/app/(app)/dashboard-v3/page.tsx` — sem mudanças (dados existentes suficientes)
- `src/app/globals.css`
- `tailwind.config.js`

---

## O Que Não Muda

- Hero (`DashboardHero`) — fora de escopo
- Layout admin/leader — `showPastoralManagement === true` não é afetado
- `PriorityCards`, `PriorityList`, `ActivityTimeline`, `UpcomingEvents`, `CarePeopleSection`, `InsightCards` — usados no layout admin, intocados
- Lógica de dados e tipos em `page.tsx`
- `DashboardV3Data` — sem novos campos necessários
