# Servos Pessoas & Cuidado Local Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first local, validated version of the new pastoral modules without touching Supabase online.

**Architecture:** Add a local pastoral domain layer with TypeScript types, deterministic mock data, selectors, reusable pastoral UI components, and App Router pages. Existing design tokens, layout shell, sidebar, cards, badges, inputs, buttons, and mobile patterns remain the source of truth.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript, Tailwind CSS, existing Supabase client untouched, Framer Motion for subtle local UI transitions.

---

## Files

- Modify: `package.json` and `package-lock.json` to add `framer-motion`.
- Modify: `src/components/layout/sidebar-v2.tsx` to support new icons, grouped sections, and `Novo` badges.
- Modify: `src/app/(app)/layout.tsx` to add new navigation items and include new split/full-page routes.
- Create: `src/lib/pastoral/types.ts` for local domain types.
- Create: `src/lib/pastoral/mock-data.ts` for local mock pastoral data.
- Create: `src/lib/pastoral/selectors.ts` for pure derived data such as filters, health, alerts, and timelines.
- Create: `src/components/pastoral/pastoral-ui.tsx` for shared cards, tags, timeline, tabs, empty states, and health UI.
- Create: route pages under `src/app/(app)/pessoas`, `celulas`, `acompanhamentos`, `pedidos-oracao`, `timeline-pastoral`, `alertas`, `crm-pastoral`, `dashboard-pastoral`, `relatorios-pastorais`, `comunicacao`, `enquetes`, and `perfis-permissoes`.

## Tasks

### Task 1: Dependency and domain model

- [ ] Install `framer-motion`.
- [ ] Add pastoral types for people, cells, meetings, attendance, timeline, care cases, alerts, prayer requests, roles, permissions, and relationships.
- [ ] Add deterministic mock data that relates every entity back to people.
- [ ] Add selector helpers for filtering people, grouping timeline events, deriving cell health, and dashboard summaries.

### Task 2: Shared pastoral UI

- [ ] Build shared visual primitives using current tokens: person tags, pastoral cards, section labels, tabs, timeline items, health meters, alert cards, and gentle empty states.
- [ ] Use Framer Motion only for subtle entry/hover/status transitions.
- [ ] Keep cards, radius, typography, colors, and spacing consistent with the current Servos V2 style.

### Task 3: Navigation

- [ ] Update desktop sidebar to match the supplied structure: Pessoas & Cuidado, Gestao Pastoral, Comunicacao, and Ministerios.
- [ ] Add new navigation entries with `Novo` badges.
- [ ] Preserve collapsed sidebar behavior, mobile bottom navigation, and existing routes.

### Task 4: People-centered pages

- [ ] Implement `/pessoas` with search, filters, tags, avatars, status, cell, ministries, and role/function summary.
- [ ] Implement `/pessoas/[id]` with header, quick actions, tabs, overview, timeline, cells, ministries, schedules, care, prayer requests, observations, and relationships.

### Task 5: Cell pages

- [ ] Implement `/celulas` with search, filters, modern cards, leader, day/time, member count, and health.
- [ ] Implement `/celulas/[id]` with header, tabs, members, meetings, timeline, health, prayer requests, attendance toggles, and pastoral feedback UI.

### Task 6: Pastoral care pages

- [ ] Implement `/acompanhamentos`, `/crm-pastoral`, `/timeline-pastoral`, `/alertas`, and `/dashboard-pastoral` using local data.
- [ ] Make alert copy supportive instead of punitive.
- [ ] Keep dashboard pastoral human and action-oriented, not corporate.

### Task 7: Supporting pages

- [ ] Implement `/pedidos-oracao`, `/relatorios-pastorais`, `/comunicacao`, `/enquetes`, and `/perfis-permissoes` as functional local screens with empty states or mock content.
- [ ] Keep permissions simple with presets: Admin Geral, Pastor, Lider de Departamento, Lider de Celula, Membro.

### Task 8: Verification

- [ ] Run `npm run build`.
- [ ] Start local dev server.
- [ ] Verify key routes locally in a browser.
- [ ] Confirm no new code writes to Supabase tables or applies migrations.

