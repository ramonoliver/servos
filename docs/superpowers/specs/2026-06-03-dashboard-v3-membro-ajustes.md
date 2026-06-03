# Dashboard V3 — Ajustes no Layout do Membro

**Data:** 2026-06-03
**Status:** Aprovado pelo usuário
**Escopo:** 3 ajustes pontuais no layout do membro: agenda em cards, nova seção de escalas, redesign da célula com líderes reais.

---

## Contexto

Após a implementação do layout de membro (spec `2026-06-03-dashboard-v3-membro-layout.md`), o usuário pediu 3 refinamentos:

1. Cards da agenda no estilo da seção de ministérios
2. Nova seção "Minhas escalas" ao lado de "Minha célula" (só para membros com ministério)
3. Layout mais chamativo para "Minha célula" com líderes reais (sem stat de pedidos)

---

## Ajuste 1 — MemberAgenda: cards estilo grid

**Antes:** lista vertical de itens (rows com ícone + texto + botões inline).

**Depois:** grid de tiles similares aos cards da `MemberMinistryGrid`:
- Grid: `grid-cols-2 sm:grid-cols-2 xl:grid-cols-4`, gap 10px
- Cada tile tem: `min-h-[150px]`, fundo colorido por tipo, ícone em quadrado branco (`38×38px`, `rounded-[12px]`), título bold, meta (horário · local), ação no rodapé

| Tipo | Cor de fundo | Borda | Ícone | Ação |
|---|---|---|---|---|
| Escala pendente (`badge === "Confirmar"`) | `#FFF0EC` | `rgba(244,83,42,.18)` | calendar `#F4532A` | `[✓ Vou]` laranja + `[✕]` branco |
| Escala confirmada | `#EEF9F1` | `#C8EDD5` | calendar `#1F8044` | badge "✓ Confirmado" verde |
| Célula (`icon === "home"`) | `#EEF1FF` | `rgba(74,90,222,.14)` | home `#4A5ADE` | `[Ver célula →]` índigo |

- Máximo 4 tiles (`items.slice(0, 4)`)
- Empty state: mesmo dashed card atual

Os botões/links mantêm o comportamento atual (link para `item.href`).

---

## Ajuste 2 — MemberSchedulePanel (novo componente)

**Novo componente:** `MemberSchedulePanel`

**Props:** `{ items: UpcomingEventItem[] }` — recebe já filtrado para `icon === "calendar"`

**Renderização:**
- Panel branco, `data-section="member-schedules"`, eyebrow "Ministério", título "Minhas escalas", link "Ver todas" → `/escalas`
- Lista vertical de itens (sem grid): cada item mostra ícone calendar com fundo colorido (laranja para pendente, verde para confirmado), nome da escala, data/hora
- Itens pendentes (`badge === "Confirmar"`): botões `[✓ Vou]` (laranja) + `[✕]` (branco/borda)
- Itens confirmados: badge verde "✓ Confirmado" à direita
- Máximo 4 itens
- Empty state: não existe — o componente **não é renderizado** quando sem itens (ver MemberHomeSections)

**Renderização condicional em MemberHomeSections:**

```tsx
const scheduleItems = data.upcoming.filter((item) => item.icon === "calendar");
const hasSchedules = scheduleItems.length > 0;
```

A grade do meio varia:
- `hasSchedules === true`: `xl:grid-cols-3` com `MemberCellPanel | MemberSchedulePanel | MemberPrayerPanel`
- `hasSchedules === false`: `xl:grid-cols-2` com `MemberCellPanel | MemberPrayerPanel` (comportamento anterior)

---

## Ajuste 3 — MemberCellPanel: redesign Opção B + líderes reais

### Layout (Opção B)

**Barra de acento no topo:**
```tsx
<div className="h-[5px] bg-[linear-gradient(90deg,#6D5DF0,#8C78FF)]" />
```

**Corpo do card:**
- Fundo branco (não mais `#F5F0FF`)
- Cabeçalho: eyebrow "Minha célula", nome da célula em `text-[24px] font-extrabold`, meta (horário + local) em `text-[#6D5DF0] font-semibold`, ícone home em quadrado `bg-[#F5F0FF] text-[#6D5DF0]` no canto direito
- Recado: card `bg-[#FAFAF8]`, label "Recado da célula", texto notice
- **Liderança** (substituindo o stat "Pedidos ativos" + o campo de líder simples):
  - Lista de líderes com avatar circular de iniciais, nome e papel
  - Líder principal: cor `#6D5DF0`, papel "Líder"
  - Co-líder: cor `#C07B1A`, papel "Co-líder"
  - Mostrar até 3 líderes
- Botão "Abrir célula" índigo full-width no rodapé

**Remove:** o stat de "Pedidos ativos" (prayerCount) — não renderiza mais.

**Empty state** (sem célula): mantém o mesmo (dashed, texto, CTA "Ver células").

### Dados — extensão de CellSummary

Adicionar campo `leaders` ao tipo `CellSummary` em `home-v3-ui.tsx`:

```ts
export type CellSummary = {
  name: string;
  nextMeeting: string;
  notice: string;
  leader: string;        // mantido para compatibilidade
  prayerCount: number;   // mantido no tipo mas não exibido
  href: string;
  leaders?: Array<{ name: string; role: string }>;  // NOVO
};
```

### Dados — page.tsx

Em `page.tsx`, ao construir `CellSummary`, popular `leaders` a partir de `myCell.leader_ids` e `myCell.co_leader_ids`:

```ts
const cellLeaderUsers = [
  ...(myCell?.leader_ids || []).map((id) => ({ id, role: "Líder" })),
  ...(myCell?.co_leader_ids || []).map((id) => ({ id, role: "Co-líder" })),
].slice(0, 3);

const leaders = cellLeaderUsers
  .map(({ id, role }) => {
    const user = members.find((m) => m.id === id);
    return user ? { name: user.name, role } : null;
  })
  .filter(Boolean) as Array<{ name: string; role: string }>;
```

E incluir `leaders` no objeto `CellSummary` retornado.

---

## Escopo Técnico

### Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `src/components/dashboard/home-v3-ui.tsx` | Reescrita de `MemberAgenda`, novo `MemberSchedulePanel`, redesign de `MemberCellPanel`, extensão de `CellSummary`, atualização de `MemberHomeSections` |
| `src/app/(app)/dashboard-v3/page.tsx` | População de `leaders` em `CellSummary` |

### O Que Não Muda

- `MemberPrayerPanel`, `MemberMinistryGrid` — sem mudanças
- `DashboardV3Home` e todos os componentes admin — sem mudanças
- Lógica de dados (exceto a adição de `leaders`)
