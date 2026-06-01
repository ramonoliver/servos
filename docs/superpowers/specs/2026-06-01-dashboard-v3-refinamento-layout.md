# Dashboard V3 — Refinamento de Layout e Alinhamento V2

**Data:** 2026-06-01
**Status:** Aprovado pelo usuário (revisão 2)
**Escopo:** Alinhamento de cores, tipografia e ajustes de UX do `dashboard-v3` com o sistema visual V2

---

## Contexto

O `dashboard-v3` (`src/components/dashboard/home-v3-ui.tsx`) foi construído com uma paleta rosa/roxo própria que diverge dos tokens V2 (`#F4532A`, `#191919`, `#777777`, `#FAFAF8`). A tipografia usa `Inter`/`Plus Jakarta Sans` hardcoded. Este refinamento alinha cores, fonte e alguns padrões de UX com o restante do app V2.

---

## Decisões de Design

### Layout

Mantém o layout rico atual:
- Hero grande com gradiente
- 4 cards de métricas em grid
- Seção de 3 colunas (lista de prioridades + timeline + agenda)
- Seção de 2 colunas (cuidado pastoral + insights/célula)

### Paleta de Cores

| Token V2 | Hex | Substitui |
|---|---|---|
| `bg` | `#FAFAF8` | `#F8F8FB` (background geral e hovers) |
| `ink` | `#191919` | `#1C1B2A` (texto principal) |
| `ink-muted` | `#777777` | `#7B7890` (texto secundário) |
| `ink-faint` | `#AAAAAA` | `#A39FB4` (labels de seção) |
| `border-soft` | `#F0EFEB` | `#ECEAF4` e `#DCD8E9` (bordas e hover de bordas) |
| `brand` | `#F4532A` | `#FF5A65`, `#FF6B57`, `#FF4D79` |
| `brand-deep` | `#D94420` | variações de hover rosa |
| `brand-light` | `#FFF0EC` | `#FFF4EC` |

### Tom "Coral"

- `toneSurface.coral`: `bg-[#FFF4EC]` → `bg-[#FFF0EC]`
- `toneIcon.coral`: `text-[#FF5A65]` → `text-[#F4532A]`
- `toneDot.coral`: `bg-[#FF5A65]` → `bg-[#F4532A]`

Os tons `care` (âmbar), `cell` (índigo), `visitor` (verde) são mantidos.

### Hero — DashboardHero

**Cores:**
- Gradiente: `→ linear-gradient(135deg,#FFFFFF 0%,#FFF0EC 48%,#FAFAF8 100%)`
- Sombra: `→ rgba(244,83,42,0.30)`
- Blobs: `#FF6B57/10 → #F4532A/10` e `#FF4D79/8 → #F4532A/6`

**Tipografia:**
- A pílula de label atual ("Operação pastoral" com dot) é substituída pela pill V2: dot `aurora-pulse bg-brand` + nome da igreja (`churchName`), estilo idêntico ao `DashboardHeader` da V2. A data não aparece na pill.
- O título `h1` mantém tamanho (38–48px bold). O trecho após a vírgula — "Aqui está o que precisa da sua atenção hoje." — é renderizado em peso normal (`font-normal`) e tamanho menor (16px), visualmente subserviente ao nome.
- Um emoji animado (`aurora-wave`) é adicionado inline após o nome, seguindo o padrão da V2: `{firstName} <span className="aurora-wave">{greetingEmoji}</span>` onde `greetingEmoji` é derivado do `greeting` ("Bom dia" → ☀️, "Boa tarde" → 🌤, "Boa noite" → 🌙).

**Props:** `DashboardHero` recebe dois props novos: `dateLabel: string` e `greetingEmoji: string`, ambos calculados em `page.tsx` e passados via `DashboardV3Data`.

### Topbar — DashboardV3Topbar

**Cores:**
- Background: `#F8F8FB/75 → #FAFAF8/75`
- Dot de notificação: `bg-[#FF4D79] → bg-[#F4532A]`

**Botão CTA → Dropdown "Ações rápidas":**
- O botão "Nova ação" é substituído por um botão dropdown "Ações rápidas" com ícone de chevron-down.
- Ao clicar, abre um menu flutuante abaixo do botão com 3 itens:
  - Nova escala → `/escalas/nova`
  - Nova célula → `/celulas` (abre o form)
  - Nova pessoa → `/pessoas` (abre o form)
- O dropdown é controlado por `useState` local (`isOpen`), fecha ao clicar fora (`useEffect` com `mousedown` listener).
- Estilo: `bg-[#F4532A]` com sombra `rgba(244,83,42,0.55)`, itens em branco.

### QuickActions — Removido

A seção `<QuickActions items={data.quickActions} />` é **removida** de `DashboardV3Home`. As ações rápidas passam a viver exclusivamente no dropdown da topbar. O tipo `QuickActionItem` e o componente `QuickActions` podem ser mantidos no arquivo (não deletar) mas deixam de ser renderizados.

### PriorityList — Tags com cor semântica

Cada badge na lista de prioridades recebe cor própria baseada na categoria:

| Badge | Fundo | Texto |
|---|---|---|
| Escalas | `bg-[#FFF0EC]` | `text-[#D94420]` |
| Cuidado | `bg-[#FFF8ED]` | `text-[#C07B1A]` |
| Células | `bg-[#EEF1FF]` | `text-[#4A5ADE]` |
| Pessoas | `bg-[#EEFAF2]` | `text-[#1F8044]` |
| Hoje | `bg-[#FFF0EC]` | `text-[#F4532A]` font-bold |

O componente `PriorityList` recebe um mapa de cores ou deriva cor a partir do `item.badge` string. Abordagem recomendada: lookup object local no componente.

### UpcomingEvents — Ícones com cor semântica

Os ícones dos eventos no painel "Próximos encontros" recebem cor baseada no tipo:

| `item.icon` | Cor do container | Cor do ícone |
|---|---|---|
| `calendar` | `bg-[#FFF0EC]` | `text-[#F4532A]` |
| `home` | `bg-[#EEF1FF]` | `text-[#4A5ADE]` |
| outros | `bg-[#FAFAF8]` | `text-[#777777]` |

Implementação: trocar `bg-[#F8F8FB] text-[#7B7890]` fixo por lookup baseado em `item.icon`.

### Classes CSS de Identificação

Cada seção principal recebe um `data-section` ou `className` descritivo para facilitar ajustes futuros:

| Componente | Classe adicionada |
|---|---|
| `DashboardHero` | `data-section="hero"` no `<section>` |
| `PriorityCards` | `data-section="priority-cards"` no `<section>` |
| `PriorityList` | `data-section="priority-list"` no `<Panel>` |
| `ActivityTimeline` | `data-section="timeline"` no `<Panel>` |
| `UpcomingEvents` | `data-section="upcoming-events"` no `<Panel>` |
| `CarePeopleSection` | `data-section="care-people"` no `<Panel>` |
| `InsightCards` | `data-section="insights"` no `<Panel>` |
| `CellCard` | `data-section="cell"` no `<Panel>` |
| `PrayerRequestCard` | `data-section="prayer-requests"` no `<Panel>` |
| `DashboardV3Topbar` | `data-section="topbar"` no wrapper |

### Tipografia

O `font-family` inline `[font-family:'Inter','Plus_Jakarta_Sans',system-ui,sans-serif]` é removido do wrapper `DashboardV3Home`. Herda a fonte global do app.

### PersonalizedEmptyState

- Botão "Encontrar célula": gradiente rosa → `bg-[#F4532A]`, sombra `rgba(244,83,42,0.65)`

---

## Escopo Técnico

### Arquivos alterados

| Arquivo | Tipo de mudança |
|---|---|
| `src/components/dashboard/home-v3-ui.tsx` | Cores, fonte, hero, topbar dropdown, tag colors, icon colors, data-section, remoção de QuickActions |
| `src/app/(app)/dashboard-v3/page.tsx` | Adicionar `dateLabel` e `greetingEmoji` ao `DashboardV3Data` |

### Arquivos não alterados

- `src/app/globals.css`
- `tailwind.config.js`

### Novos props em DashboardV3Data

```ts
greetingEmoji: string;  // "☀️" | "🌤" | "🌙"
```

`greetingEmoji` é calculado em `page.tsx` a partir de `getGreeting()`. O `churchName` já existe em `DashboardV3Data` e é reutilizado na pill.

---

## O Que Não Muda

- Estrutura de componentes e props (exceto novos props citados)
- Lógica de `profileMode` e renderização condicional
- Tons `care`, `cell`, `visitor` (cores de surface desses 3 tons fora de escopo)
- Animações `framer-motion`
- Todos os textos e labels
