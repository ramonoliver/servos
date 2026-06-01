# Dashboard V3 — Refinamento de Layout e Alinhamento V2

**Data:** 2026-06-01
**Status:** Aprovado pelo usuário
**Escopo:** Alinhamento de cores e tipografia do `dashboard-v3` com o sistema visual definido na spec V2

---

## Contexto

O `dashboard-v3` (`src/components/dashboard/home-v3-ui.tsx`) foi construído com uma paleta rosa/roxo própria (`#FF5A65`, `#FF4D79`, `#1C1B2A`, `#7B7890`, `#F8F8FB`) que diverge dos tokens de design definidos na spec V2 (`#F4532A`, `#191919`, `#777777`, `#FAFAF8`). A tipografia também usa `Inter`/`Plus Jakarta Sans` hardcoded, enquanto o restante do app V2 já usa `Outfit`/`DM Sans` via globals.

O objetivo deste refinamento é alinhar o `dashboard-v3` ao sistema visual V2 sem alterar estrutura, lógica ou dados.

---

## Decisões de Design

### Layout

Mantém o layout rico atual:
- Hero grande com gradiente
- 4 cards de métricas em grid
- Seção de 3 colunas (lista de prioridades + timeline + agenda)
- Seção de 2 colunas (cuidado pastoral + insights/célula)

Não há simplificação de estrutura neste refinamento.

### Paleta de Cores

Todas as ocorrências de cores da paleta rosa/roxo são substituídas pelos tokens V2:

| Token V2 | Hex | Substituição |
|---|---|---|
| `bg` | `#FAFAF8` | `#F8F8FB` (background geral) |
| `ink` | `#191919` | `#1C1B2A` (texto principal) |
| `ink-muted` | `#777777` | `#7B7890` (texto secundário) |
| `ink-faint` | `#AAAAAA` | `#A39FB4` (texto faint/labels) |
| `border-soft` | `#F0EFEB` | `#ECEAF4` (bordas) e `#DCD8E9` (hover de bordas) |
| `brand` | `#F4532A` | `#FF5A65`, `#FF6B57`, `#FF4D79` (coral/rosa) |
| `brand-deep` | `#D94420` | variações de hover/deep rosa |
| `brand-light` | `#FFF0EC` | `#FFF4EC` (background suave brand) |

### Tom "Coral" (card de Confirmações)

O tom `coral` no mapa de tons dos 4 cards de prioridade é remapeado para laranja V2:

- `toneSurface.coral`: `bg-[#FFF4EC]` → `bg-[#FFF0EC]`
- `toneIcon.coral`: `text-[#FF5A65]` → `text-[#F4532A]`
- `toneDot.coral`: `bg-[#FF5A65]` → `bg-[#F4532A]`

Os outros 3 tons (`care` âmbar, `cell` índigo, `visitor` verde) são mantidos — cada categoria preserva sua cor semântica.

### Hero

O `DashboardHero` mantém estrutura e tamanho. Mudanças:
- Gradiente: `linear-gradient(135deg,#FFFFFF 0%,#FFF7F4 48%,#F8F8FB 100%)` → `linear-gradient(135deg,#FFFFFF 0%,#FFF0EC 48%,#FAFAF8 100%)`
- Sombra: `rgba(255,77,121,0.45)` → `rgba(244,83,42,0.30)`
- Blob decorativo direito: `#FF6B57/10` → `#F4532A/10`
- Blob decorativo esquerdo: `#FF4D79/8` → `#F4532A/6`
- Pílula de label: dot `bg-[#FF5A65]` → `bg-[#F4532A]`
- Ícone spark no card interno: cor via `toneIcon.coral` (já coberto acima)

### Topbar

O `DashboardV3Topbar` recebe:
- Background blur: `#F8F8FB/75` → `#FAFAF8/75`
- Sombra da search bar: `rgba(28,27,42,0.45)` → `rgba(25,25,25,0.25)`
- Botão CTA "Nova ação": gradiente rosa → `bg-[#F4532A]` sólido, sombra `rgba(244,83,42,0.55)`
- Dot de notificação: `bg-[#FF4D79]` → `bg-[#F4532A]`

### Tipografia

O wrapper `DashboardV3Home` tem `font-family` hardcoded inline: `[font-family:'Inter','Plus_Jakarta_Sans',system-ui,sans-serif]`. Esta declaração é removida — o componente passa a herdar a fonte global do app (`Outfit`/`DM Sans` definida em `globals.css`).

### Estado Vazio — PersonalizedEmptyState

- Botão primário "Encontrar célula": gradiente `linear-gradient(135deg,#FF6B57_0%,#FF4D79_100%)` → `bg-[#F4532A]`, sombra `rgba(244,83,42,0.65)`

---

## Escopo Técnico

### Arquivos alterados

| Arquivo | Tipo de mudança |
|---|---|
| `src/components/dashboard/home-v3-ui.tsx` | Substituição de valores hex e remoção de font-family inline |

### Arquivos não alterados

- `src/app/(app)/dashboard-v3/page.tsx` — sem mudanças (lógica de dados inalterada)
- `src/app/globals.css` — sem mudanças (fonte global já correta)
- `tailwind.config.js` — sem mudanças (tokens V2 já existentes não precisam ser adicionados agora)

---

## O Que Não Muda

- Estrutura de componentes e props
- Lógica de `profileMode` e renderização condicional
- Tons semânticos de `care` (âmbar), `cell` (índigo), `visitor` (verde)
- Animações `framer-motion`
- Todos os textos e labels
- Cores de superfície dos tons `cell` (`#F5F0FF`) e `visitor` (`#EEF9F1`) — fora de escopo, revisão futura se necessário

---

## Resultado Esperado

O `dashboard-v3` fica visualmente coerente com as demais páginas do redesign V2 (mesma base de cor, mesma fonte, mesmo laranja da marca) sem nenhuma regressão funcional.
