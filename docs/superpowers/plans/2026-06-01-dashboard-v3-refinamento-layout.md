# Dashboard V3 — Refinamento de Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Alinhar o `dashboard-v3` à paleta V2 (laranja `#F4532A`, bg `#FAFAF8`, tipografia Outfit/DM Sans) e refinar a UX com dropdown, hierarquia tipográfica no hero, tags/ícones semânticos e atributos de identificação.

**Architecture:** Todas as mudanças ficam em `src/components/dashboard/home-v3-ui.tsx`. A lógica de dados em `page.tsx` não muda. Mudanças são incrementais: primeiro paleta global, depois componente a componente.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Framer Motion

**Spec:** `docs/superpowers/specs/2026-06-01-dashboard-v3-refinamento-layout.md`

**Verificação:** Após cada tarefa, navegue para `/dashboard-v3` no dev server (`npm run dev`) e confirme visualmente.

---

## Mapa de arquivos

| Arquivo | Mudanças |
|---|---|
| `src/components/dashboard/home-v3-ui.tsx` | Todas as 7 tarefas |

---

### Task 1: Paleta de cores global + remoção da fonte inline

**Files:**
- Modify: `src/components/dashboard/home-v3-ui.tsx`

- [ ] **Step 1: Adicionar import de hooks React**

No topo do arquivo, após `"use client";`, adicione:

```tsx
import { useState, useEffect, useRef } from "react";
```

- [ ] **Step 2: Atualizar os mapas de tons**

Substitua os 3 objetos de tom existentes:

```tsx
const toneSurface: Record<Tone, string> = {
  coral: "bg-[#FFF0EC] text-[#191919]",
  care: "bg-[#FFF8ED] text-[#191919]",
  cell: "bg-[#F5F0FF] text-[#191919]",
  visitor: "bg-[#EEF9F1] text-[#191919]",
  neutral: "bg-white text-[#191919]",
};

const toneIcon: Record<Tone, string> = {
  coral: "bg-white/75 text-[#F4532A]",
  care: "bg-white/80 text-[#D99025]",
  cell: "bg-white/80 text-[#7B61FF]",
  visitor: "bg-white/80 text-[#33995B]",
  neutral: "bg-[#FAFAF8] text-[#777777]",
};

const toneDot: Record<Tone, string> = {
  coral: "bg-[#F4532A]",
  care: "bg-[#E7A13A]",
  cell: "bg-[#8C72FF]",
  visitor: "bg-[#45A86B]",
  neutral: "bg-[#B9B5C9]",
};
```

- [ ] **Step 3: Substituições de hex — busca e troca exata**

No arquivo `home-v3-ui.tsx`, faça as substituições abaixo **na ordem listada** (algumas são substrings de outras):

| Encontrar | Substituir |
|---|---|
| `rgba(28,27,42,` | `rgba(25,25,25,` |
| `rgba(255,77,121,` | `rgba(244,83,42,` |
| `rgba(255,107,87,` | `rgba(244,83,42,` |
| `#FF6B57` | `#F4532A` |
| `#FF4D79` | `#F4532A` |
| `#FF5A65` | `#F4532A` |
| `#FFF7F4` | `#FFF0EC` |
| `#FFF4EC` | `#FFF0EC` |
| `#D94B37` | `#D94420` |
| `#FDFDFF` | `#FAFAF8` |
| `#FBFAFD` | `#FAFAF8` |
| `#F8F8FB` | `#FAFAF8` |
| `#DCD8E9` | `#F0EFEB` |
| `#ECEAF4` | `#F0EFEB` |
| `#B6B2C7` | `#AAAAAA` |
| `#A39FB4` | `#AAAAAA` |
| `#7B7890` | `#777777` |
| `#1C1B2A` | `#191919` |

- [ ] **Step 4: Remover font-family inline do DashboardV3Home**

Localize a div mais externa de `DashboardV3Home`:

```tsx
// antes
<div className="min-h-screen bg-[#F8F8FB] [font-family:'Inter','Plus_Jakarta_Sans',system-ui,sans-serif]">

// depois
<div className="min-h-screen bg-[#FAFAF8]">
```

(O `#F8F8FB` já foi trocado por `#FAFAF8` no passo anterior; confirme que ficou correto.)

- [ ] **Step 5: Verificar no browser**

```bash
npm run dev
```

Acesse `/dashboard-v3`. A página deve ter fundo `#FAFAF8` (quase branco com leve tom quente), sem rosa ou roxo. O hero ainda estará com a estrutura antiga (próximas tarefas), mas as cores de fundo, texto, bordas e botões devem ser laranja/neutro.

- [ ] **Step 6: Commit**

```bash
git add src/components/dashboard/home-v3-ui.tsx
git commit -m "style(dashboard-v3): alinha paleta de cores com tokens V2"
```

---

### Task 2: Hero — pill V2, emoji e hierarquia tipográfica

**Files:**
- Modify: `src/components/dashboard/home-v3-ui.tsx` — componente `DashboardHero`

- [ ] **Step 1: Atualizar a assinatura do componente**

`DashboardHero` passa a receber `churchName`:

```tsx
export function DashboardHero({
  title,
  summary,
  profileMode,
  churchName,
}: {
  title: string;
  summary: string;
  profileMode: ProfileMode;
  churchName: string;
}) {
```

- [ ] **Step 2: Substituir o corpo do componente**

Substitua o corpo completo de `DashboardHero` pelo código abaixo:

```tsx
  const [namePart, ...rest] = title.split(". ");
  const subtitlePart = rest.join(". ");
  const emoji = title.startsWith("Bom dia")
    ? "☀️"
    : title.startsWith("Boa tarde")
    ? "🌤️"
    : title.startsWith("Boa noite")
    ? "🌙"
    : "👋";

  return (
    <section
      data-section="hero"
      className="relative overflow-hidden rounded-[36px] border border-white bg-[linear-gradient(135deg,#FFFFFF_0%,#FFF0EC_48%,#FAFAF8_100%)] px-6 py-8 shadow-[0_28px_80px_-50px_rgba(244,83,42,0.30)] md:px-10 md:py-10"
    >
      <div className="pointer-events-none absolute -right-28 -top-36 h-72 w-72 rounded-full bg-[#F4532A]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-16 h-64 w-64 rounded-full bg-[#F4532A]/6 blur-3xl" />
      <div className="relative grid gap-8 lg:grid-cols-[1fr_320px] lg:items-end">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#F0EFEB] bg-white/75 px-3 py-1.5 text-[12px] font-semibold text-[#777777] shadow-[0_8px_24px_-18px_rgba(25,25,25,0.20)]">
            <span className="aurora-pulse h-1.5 w-1.5 rounded-full bg-[#F4532A]" />
            {churchName}
          </div>
          <h1 className="max-w-[860px] leading-[1.03] tracking-[-0.055em] text-[#191919]">
            <span className="text-[38px] font-bold md:text-[48px]">
              {namePart} <span className="aurora-wave inline-block">{emoji}</span>
            </span>
            {subtitlePart && (
              <span className="mt-2 block text-[18px] font-normal text-[#777777]">
                {subtitlePart}
              </span>
            )}
          </h1>
          <p className="mt-5 max-w-[690px] text-[15px] leading-7 text-[#777777] md:text-[16px]">
            {summary}
          </p>
        </div>
        <div className="rounded-[26px] border border-[#F0EFEB] bg-white/80 p-4 shadow-[0_18px_45px_-32px_rgba(25,25,25,0.35)] backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF0EC] text-[#F4532A]">
              <Icon name="spark" size={20} />
            </div>
            <div>
              <div className="text-[13px] font-semibold text-[#191919]">Radar inteligente</div>
              <div className="text-[12px] leading-5 text-[#777777]">
                Prioridades, cuidado e agenda em um só lugar.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
```

- [ ] **Step 3: Passar `churchName` de DashboardV3Home**

Em `DashboardV3Home`, localize a linha que renderiza `<DashboardHero>` e adicione `churchName`:

```tsx
// antes
<DashboardHero title={data.heroTitle} summary={data.heroSummary} profileMode={data.profileMode} />

// depois
<DashboardHero
  title={data.heroTitle}
  summary={data.heroSummary}
  profileMode={data.profileMode}
  churchName={data.churchName}
/>
```

- [ ] **Step 4: Verificar no browser**

Acesse `/dashboard-v3`. O hero deve mostrar:
- Pill com dot pulsante laranja + nome da igreja
- "Bom dia, Ramon ☀️" (emoji oscila) em tamanho grande, negrito
- "Aqui está o que precisa da sua atenção hoje." menor e mais claro abaixo do nome
- Gradiente quente laranja, sem rosa

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/home-v3-ui.tsx
git commit -m "feat(dashboard-v3): hero com pill V2, emoji aurora e hierarquia tipográfica"
```

---

### Task 3: Topbar — dropdown "Ações rápidas"

**Files:**
- Modify: `src/components/dashboard/home-v3-ui.tsx` — componente `DashboardV3Topbar`

- [ ] **Step 1: Substituir o componente `DashboardV3Topbar` completo**

```tsx
export function DashboardV3Topbar({ unreadNotifications }: { unreadNotifications: number }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div
      data-section="topbar"
      className="sticky top-0 z-20 -mx-4 mb-6 border-b border-white/70 bg-[#FAFAF8]/75 px-4 py-4 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 xl:-mx-10 xl:px-10"
    >
      <div className="mx-auto flex min-h-[56px] max-w-[1240px] items-center gap-4">
        <label className="mx-auto flex h-12 w-full max-w-[620px] items-center gap-3 rounded-full border border-[#F0EFEB] bg-white px-4 text-[14px] text-[#777777] shadow-[0_14px_35px_-28px_rgba(25,25,25,0.25)]">
          <Icon name="search" size={17} />
          <input
            className="min-w-0 flex-1 border-0 bg-transparent text-[#191919] outline-none placeholder:text-[#AAAAAA]"
            placeholder="Buscar pessoas, escalas, células, ministérios..."
          />
        </label>
        <Link
          href="/notificacoes"
          className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-[#F0EFEB] bg-white text-[#777777] transition hover:bg-[#FAFAF8]"
        >
          <Icon name="bell" size={18} />
          {unreadNotifications > 0 && (
            <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-[#F4532A]" />
          )}
        </Link>
        <div ref={dropdownRef} className="relative hidden md:block">
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex min-h-12 flex-shrink-0 items-center gap-2 rounded-full bg-[#F4532A] px-5 text-[14px] font-semibold text-white shadow-[0_16px_34px_-18px_rgba(244,83,42,0.55)] transition hover:brightness-[0.97]"
          >
            <Icon name="plus" size={17} />
            Ações rápidas
            <Icon
              name="chevron"
              size={14}
              className={cn("transition-transform duration-200", open && "rotate-90")}
            />
          </button>
          {open && (
            <div className="absolute right-0 top-[calc(100%+8px)] w-44 overflow-hidden rounded-[14px] border border-[#F0EFEB] bg-white shadow-[0_12px_32px_-16px_rgba(25,25,25,0.25)]">
              {(
                [
                  { label: "Nova escala", href: "/escalas/nova", icon: "plus" as const },
                  { label: "Nova célula", href: "/celulas", icon: "home" as const },
                  { label: "Nova pessoa", href: "/pessoas", icon: "users" as const },
                ] as const
              ).map((item, i, arr) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 px-4 py-3 text-[13px] font-medium text-[#191919] transition hover:bg-[#FAFAF8]",
                    i < arr.length - 1 && "border-b border-[#F0EFEB]",
                  )}
                >
                  <Icon name={item.icon} size={14} />
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar no browser**

Acesse `/dashboard-v3`. O botão "Ações rápidas" deve:
- Abrir um dropdown com os 3 itens ao clicar
- Fechar ao clicar fora do dropdown
- Fechar ao clicar em um item
- O chevron deve rotacionar 90° quando aberto

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/home-v3-ui.tsx
git commit -m "feat(dashboard-v3): topbar com dropdown Ações rápidas"
```

---

### Task 4: Remover QuickActions do layout principal

**Files:**
- Modify: `src/components/dashboard/home-v3-ui.tsx` — função `DashboardV3Home`

- [ ] **Step 1: Remover a linha de renderização de QuickActions**

Em `DashboardV3Home`, localize e remova a linha:

```tsx
// remover esta linha:
<QuickActions items={data.quickActions} />
```

O componente `QuickActions` e o tipo `QuickActionItem` permanecem no arquivo (não deletar).

- [ ] **Step 2: Verificar no browser**

Acesse `/dashboard-v3`. Os botões "Nova escala / Nova célula / Nova pessoa" que apareciam abaixo do hero não devem mais existir. As ações ficam apenas no dropdown da topbar.

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/home-v3-ui.tsx
git commit -m "refactor(dashboard-v3): move quick actions para dropdown da topbar"
```

---

### Task 5: PriorityList — badges e ícones com cor semântica

**Files:**
- Modify: `src/components/dashboard/home-v3-ui.tsx` — componente `PriorityList`

- [ ] **Step 1: Adicionar lookups de cor acima do componente `PriorityList`**

```tsx
const priorityBadgeColors: Record<string, string> = {
  Escalas: "bg-[#FFF0EC] text-[#D94420]",
  Cuidado: "bg-[#FFF8ED] text-[#C07B1A]",
  Células: "bg-[#EEF1FF] text-[#4A5ADE]",
  Pessoas: "bg-[#EEFAF2] text-[#1F8044]",
  Hoje: "bg-[#FFF0EC] text-[#F4532A] font-bold",
};

const priorityIconColors: Record<string, string> = {
  Escalas: "bg-[#FFF0EC] text-[#F4532A]",
  Cuidado: "bg-[#FFF8ED] text-[#C07B1A]",
  Células: "bg-[#EEF1FF] text-[#4A5ADE]",
  Pessoas: "bg-[#EEFAF2] text-[#1F8044]",
  Hoje: "bg-[#FFF0EC] text-[#F4532A]",
};

const priorityFallbackColors = { badge: "bg-[#F0EFEB] text-[#777777]", icon: "bg-[#FAFAF8] text-[#777777]" };
```

- [ ] **Step 2: Substituir o componente `PriorityList`**

```tsx
export function PriorityList({ items }: { items: PriorityListItem[] }) {
  return (
    <Panel className="p-6" dataSectionId="priority-list">
      <SectionTitle title="Prioridades de hoje" eyebrow="Ações" />
      <div className="space-y-2">
        {items.map((item) => {
          const badgeClass = priorityBadgeColors[item.badge] ?? priorityFallbackColors.badge;
          const iconClass = priorityIconColors[item.badge] ?? priorityFallbackColors.icon;
          return (
            <Link
              key={item.title}
              href={item.href}
              className="group flex items-center gap-3 rounded-[18px] px-2.5 py-3 transition hover:bg-[#FAFAF8]"
            >
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-2xl", iconClass)}>
                <Icon name={item.icon} size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-semibold text-[#191919]">{item.title}</div>
                <div className="truncate text-[12px] text-[#777777]">{item.meta}</div>
              </div>
              <span className={cn("rounded-full px-2.5 py-1 text-[11px]", badgeClass)}>{item.badge}</span>
              <Icon name="chevron" size={16} className="text-[#AAAAAA] transition group-hover:text-[#191919]" />
            </Link>
          );
        })}
      </div>
    </Panel>
  );
}
```

- [ ] **Step 3: Verificar no browser**

Acesse `/dashboard-v3`. Na caixa "Prioridades de hoje" cada item deve ter badge e ícone com cor própria: Escalas=laranja, Cuidado=âmbar, Células=índigo, Pessoas=verde, Hoje=laranja bold.

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/home-v3-ui.tsx
git commit -m "feat(dashboard-v3): tags e ícones semânticos em Prioridades de hoje"
```

---

### Task 6: UpcomingEvents — ícones com cor semântica

**Files:**
- Modify: `src/components/dashboard/home-v3-ui.tsx` — componente `UpcomingEvents`

- [ ] **Step 1: Adicionar lookup de cor acima do componente `UpcomingEvents`**

```tsx
const eventIconColors: Record<string, { bg: string; text: string }> = {
  calendar: { bg: "bg-[#FFF0EC]", text: "text-[#F4532A]" },
  home: { bg: "bg-[#EEF1FF]", text: "text-[#4A5ADE]" },
};

const eventIconFallback = { bg: "bg-[#FAFAF8]", text: "text-[#777777]" };
```

- [ ] **Step 2: Substituir o componente `UpcomingEvents`**

```tsx
export function UpcomingEvents({ items }: { items: UpcomingEventItem[] }) {
  return (
    <Panel className="p-6" dataSectionId="upcoming-events">
      <SectionTitle title="Próximos encontros" eyebrow="Agenda" />
      <div className="space-y-3">
        {items.map((item) => {
          const iconStyle = eventIconColors[item.icon] ?? eventIconFallback;
          return (
            <Link
              key={`${item.title}-${item.time}`}
              href={item.href}
              className="block rounded-[20px] border border-[#F0EFEB] bg-white p-4 transition hover:border-[#F0EFEB] hover:bg-[#FAFAF8]"
            >
              <div className="flex gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl",
                    iconStyle.bg,
                    iconStyle.text,
                  )}
                >
                  <Icon name={item.icon} size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-semibold text-[#191919]">{item.title}</div>
                  <div className="mt-1 text-[12px] text-[#777777]">
                    {item.time} · {item.location}
                  </div>
                  <div className="mt-1 text-[12px] text-[#AAAAAA]">{item.meta}</div>
                </div>
                <span className="h-fit rounded-full bg-[#FFF0EC] px-2.5 py-1 text-[11px] font-semibold text-[#D94420]">
                  {item.badge}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </Panel>
  );
}
```

- [ ] **Step 3: Verificar no browser**

Em "Próximos encontros": ícone de calendário deve ter fundo laranja claro, ícone de casa deve ter fundo índigo claro.

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/home-v3-ui.tsx
git commit -m "feat(dashboard-v3): ícones semânticos em Próximos encontros"
```

---

### Task 7: Atributos `data-section` em todos os painéis

**Files:**
- Modify: `src/components/dashboard/home-v3-ui.tsx` — componente `Panel` + restantes

- [ ] **Step 1: Atualizar o componente `Panel` para aceitar `dataSectionId`**

```tsx
function Panel({
  children,
  className,
  dataSectionId,
}: {
  children: React.ReactNode;
  className?: string;
  dataSectionId?: string;
}) {
  return (
    <motion.section
      data-section={dataSectionId}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className={cn(
        "rounded-[28px] border border-[#F0EFEB] bg-white shadow-[0_18px_50px_-34px_rgba(25,25,25,0.35)]",
        className,
      )}
    >
      {children}
    </motion.section>
  );
}
```

- [ ] **Step 2: Adicionar `dataSectionId` nos componentes que já receberam `Panel` em tasks anteriores**

`PriorityList` e `UpcomingEvents` já foram atualizados nas Tasks 5 e 6. Agora adicione nos demais:

```tsx
// ActivityTimeline
<Panel className="p-6" dataSectionId="timeline">

// CarePeopleSection
<Panel className="p-6" dataSectionId="care-people">

// InsightCards
<Panel className="p-6" dataSectionId="insights">

// CellCard
<Panel className="bg-[#F5F0FF] p-6" dataSectionId="cell">

// PrayerRequestCard
<Panel className="p-6" dataSectionId="prayer-requests">

// PersonalizedEmptyState
<Panel className="p-6" dataSectionId="empty-state">
```

- [ ] **Step 3: Adicionar `data-section` na section dos PriorityCards**

Em `PriorityCards`:

```tsx
// antes
<section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

// depois
<section data-section="priority-cards" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
```

O `DashboardHero` já recebeu `data-section="hero"` na Task 2.

- [ ] **Step 4: Verificar no browser**

Abra o DevTools, inspecione os elementos — cada seção deve ter `data-section="..."` no DOM.

- [ ] **Step 5: Commit final**

```bash
git add src/components/dashboard/home-v3-ui.tsx
git commit -m "chore(dashboard-v3): adiciona data-section em todos os painéis"
```

---

## Self-Review

**Cobertura da spec:**
- [x] Paleta V2 completa (bg, ink, ink-muted, ink-faint, border-soft, brand, brand-deep, brand-light) — Task 1
- [x] Fonte inline removida — Task 1
- [x] Pill hero com churchName + aurora-pulse — Task 2
- [x] Emoji aurora-wave no greeting — Task 2
- [x] Hierarquia tipográfica (nome bold, subtítulo normal) — Task 2
- [x] Dropdown "Ações rápidas" — Task 3
- [x] QuickActions removido do layout — Task 4
- [x] PriorityList tags semânticas — Task 5
- [x] UpcomingEvents ícones semânticos — Task 6
- [x] data-section em todos os painéis — Task 7
- [x] PersonalizedEmptyState botão laranja — Task 1 (hex swap) + Task 4 (não afetada)
- [x] Topbar CTA cor + sombra — Task 3
- [x] Topbar dot de notificação — Task 1

**Tipos consistentes:**
- `dataSectionId?: string` definido em Task 7, usado em Tasks 5, 6 e 7 ✓
- `priorityBadgeColors` / `priorityIconColors` definidos antes de `PriorityList` ✓
- `eventIconColors` definido antes de `UpcomingEvents` ✓
- `churchName: string` adicionado a `DashboardHero` em Task 2 e passado em `DashboardV3Home` ✓
