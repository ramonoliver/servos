# Servos V2 — Design Spec

**Data:** 2026-05-23  
**Status:** Aprovado pelo usuário  
**Escopo:** Redesign completo da interface e simplificação dos fluxos

---

## Contexto

O Servos App é um sistema de gestão de voluntários para igrejas, construído em Next.js 14 + Tailwind + Supabase. A V1 tem uma interface funcional com sidebar branca, mas os fluxos podem ser simplificados e o visual modernizado. O objetivo da V2 é:

- Interface no estilo Notion App (sidebar cinza-off, tipografia limpa, hierarquia sutil)
- Detalhes em laranja da marca (`#F4532A`) para ações e destaques
- Fluxos simplificados: menos navegações de página, mais ações inline

---

## 1. Sistema Visual

### Paleta de Cores

| Token | Hex | Uso |
|---|---|---|
| `sidebar-bg` | `#F7F7F5` | Background da sidebar (Notion light) |
| `sidebar-border` | `#E9E9E6` | Borda sidebar/conteúdo |
| `bg` | `#FAFAF8` | Background geral das páginas (mantém) |
| `surface` | `#FFFFFF` | Cards, painéis, drawers |
| `brand` | `#F4532A` | CTAs primários, item ativo, highlights |
| `brand-deep` | `#D94420` | Hover de botões brand |
| `brand-light` | `#FFF0EC` | Backgrounds suaves brand |
| `ink` | `#191919` | Títulos, texto principal |
| `ink-muted` | `#777777` | Labels, texto secundário |
| `ink-faint` | `#AAAAAA` | Placeholder, rótulos de seção |
| `border-soft` | `#F0EFEB` | Bordas internas de cards |

A paleta existente no `tailwind.config.js` é mantida — apenas o token `sidebar-bg` e `sidebar-border` são novos e devem ser adicionados.

### Tipografia

Mantém **Outfit** (display) + **DM Sans** (body). Ajustes de escala:

| Elemento | Tamanho | Peso | Observação |
|---|---|---|---|
| Título de página | 22–24px | 700 | Ex: "Escalas", "Bom dia, Ramon" |
| Subtítulo | 13px | 400 | Data, contexto, descrição |
| Label de seção | 10px | 700 | Uppercase, `letter-spacing: .08em`, `color: ink-faint` |
| Item da sidebar | 13px | 500 | Normal; ativo: 600 |
| Corpo | 13–14px | 400 | Conteúdo geral |
| Stat/número | 24–28px | 800 | Dashboard, relatórios |

---

## 2. Shell de Navegação

### Desktop

- Sidebar esquerda com `background: #F7F7F5`, largura 240px
- Colapsível a 60px (somente ícones) via botão no header
- `border-right: 1px solid #E9E9E6`
- Item ativo: `background: rgba(0,0,0,.06)`, `border-radius: 6px`, texto `#191919` — sem borda colorida lateral (diferença do V1)
- Único laranja na sidebar: logo Servos (ícone) e avatar do usuário
- Seções de ministérios no rodapé da nav (igual ao V1, estilo mantido)
- Rodapé: avatar + nome + role + botão logout

### Mobile

Substitui o drawer hambúrguer por **Bottom Tab Bar** com 5 posições:

```
[ Início ]  [ Escalas ]  [ ⊕ ]  [ Membros ]  [ Mais ]
```

- Ícone `⊕` central: círculo laranja `#F4532A`, 48px — abre **Quick Action Sheet**
- Quick Action Sheet (bottom sheet modal):
  - Nova Escala
  - Convidar Membro
  - Registrar Indisponibilidade
- Aba "Mais" expande: Calendário, Mensagens, Notificações, Relatórios, Configurações
- Header mobile: logo + nome da igreja (truncado) + avatar — sem menu hambúrguer

### Header Desktop

O header atual (barra horizontal com nome da igreja) é **removido** no desktop. A informação de igreja passa para o rodapé da sidebar (nome abreviado, já presente). O conteúdo começa direto abaixo da sidebar, sem barra superior no desktop.

---

## 3. Dashboard

### Admin / Líder

Layout em coluna única, conteúdo centralizado, `max-width: 720px`:

```
Bom dia, [nome]                       [dia da semana, data · Igreja]

┌────────────────────────────────────────────────────────────┐
│  PRÓXIMA ESCALA                                            │
│  [Nome da escala] — [Evento]                               │
│  [Data] · [N] membros · [N] pendentes de confirmação       │
│                                          [Ver escala →]    │
└────────────────────────────────────────────────────────────┘

┌──────────────────┐   ┌──────────────────┐
│  [N]             │   │  [N]             │
│  Escalas ativas  │   │  Membros ativos  │
└──────────────────┘   └──────────────────┘

ATIVIDADE RECENTE
─ [notificação 1]
─ [notificação 2]
─ [notificação 3]
```

- Card "Próxima Escala": `background: #FFF8F6`, `border: 1.5px solid rgba(244,83,42,.2)`, laranja como cor de destaque
- Se não há próxima escala: CTA para criar uma
- Stats: 2 números principais (escalas ativas + membros ativos) — sem os 4 do V1
- Atividade recente: 3 últimas notificações não lidas, link para cada uma

### Membro

```
Olá, [nome]

┌────────────────────────────────────────────────────────────┐
│  Você está na escala:                                      │
│  [Nome] — [Data]  ·  [Ministério]                          │
│  [✓ Confirmar presença]    [✗ Não consigo ir]              │
└────────────────────────────────────────────────────────────┘

PRÓXIMAS ESCALAS
─ [escala 2]
─ [escala 3]
```

- Se não há escala pendente: card com "Você está em dia ✓" e próxima escala confirmada

---

## 4. Escalas (fluxo principal)

### Layout Duas Colunas (Split View)

Toda a gestão de escalas acontece em `/escalas` sem navegação para subpáginas:

```
┌── Lista (240px) ─────────┬── Painel de Detalhe ────────────────┐
│  Escalas          [+]    │  [Nome da escala]                   │
│  ──────────────────────  │  [Ministério] · [Data] · [Horário]  │
│  [Todas] [Ativas] [Rasc] │  ─────────────────────────────────  │
│  ──────────────────────  │  MEMBROS (N)                        │
│  ▶ Louvor · Dom 25/05    │  [Avatar] [Nome]   [status badge]   │
│    9 membros · laranja   │  [Avatar] [Nome]   [status badge]   │
│  ──────────────────────  │  ─────────────────────────────────  │
│    Infantil · Sáb 31/05  │  [+ Membro]  [✨ IA]  [💬 Chat]    │
│    5 membros             │                                     │
│  ──────────────────────  │  ── Chat da Escala ──────────────   │
│    Música · Dom 01/06    │  [mensagens]                        │
│    7 membros             │  [MentionInput + enviar]            │
└──────────────────────────┴─────────────────────────────────────┘
```

**Lista:**
- Item selecionado: `background: #FFF8F6`, `border-left: 2px solid #F4532A`
- Badge de status inline (ativa / rascunho / encerrada)
- Avatares empilhados dos primeiros 3 membros

**Painel de detalhe:**
- `[+ Membro]`: abre busca inline no próprio painel (campo de busca aparece acima da lista de membros, sem modal)
- `[✨ IA]`: expande seção de sugestões logo abaixo da lista de membros, com os 9 fatores e botões "Adicionar" por sugerido
- `[💬 Chat]`: rola o painel até o chat (posicionado no rodapé do painel, visível sem scroll no desktop; no mobile ocupa tela inteira ao focar no input)
- Status do membro: badge colorido (confirmado / pendente / recusou); clicar em "recusou" revela inline um botão "Sugerir substituto" que aciona a IA

**Deep links:** `/escalas/[id]` continua funcionando — ao acessar diretamente, a rota carrega o split view com a escala em questão pré-selecionada no painel direito.

### Criar Nova Escala (Drawer)

O botão `[+]` na lista abre um **ActionDrawer** da direita (350px, `z-index: 50`):

```
┌── Nova Escala ────────────── ✕ ┐
│  Nome *                        │
│  [________________________]    │
│                                │
│  Ministério *                  │
│  [Selecionar ▾]                │
│                                │
│  Data *                        │
│  [dd/mm/aaaa]                  │
│                                │
│  [Criar Escala]                │
└────────────────────────────────┘
```

- 3 campos obrigatórios (nome, ministério, data)
- Ao criar: escala aparece no topo da lista, painel de detalhe abre automaticamente
- A página `/escalas/nova` é mantida apenas como rota de fallback para acesso direto por URL; o fluxo principal passa pelo drawer

---

## 5. Fluxos Simplificados

| Ação | V1 | V2 |
|---|---|---|
| Criar escala | Navega para `/escalas/nova` | Drawer lateral (sem sair da tela) |
| Ver detalhe da escala | Navega para `/escalas/[id]` | Painel direito do Split View |
| Adicionar membro à escala | Modal separado | Busca inline no painel |
| Sugestão IA | Botão abre seção na mesma página | Seção colapsável inline no painel |
| Ver detalhe do ministério | Navega para `/ministerios/[id]` | Drawer lateral |
| Convidar membro | Navega para `/membros/convidar` | Modal leve em `/membros` |
| Notificações | Página `/notificacoes` | Painel slide-over do sino (mantém página como fallback) |
| Onboarding | Wizard 6 etapas | Reduzido para 3 etapas: Igreja → Ministério → Primeiro Membro |

---

## 6. Outros Módulos

### Membros

- Lista com busca inline + filtro por ministério/role
- Split View opcional: lista + detalhe (drawer no mobile)
- Convidar: modal leve com campo de email + role

### Ministérios

- Cards em grid (2 colunas desktop, 1 mobile)
- Detalhe: drawer lateral com membros + líderes + escalas recentes

### Calendário

- Mantém a visão mensal atual com visual atualizado
- Eventos clicáveis abrem drawer com detalhes

### Notificações

- Sino no rodapé da sidebar (com badge) abre painel slide-over
- Página `/notificacoes` mantida para histórico completo

### Mensagens

- Mantém estrutura atual, visual atualizado
- `MentionInput` sem mudanças funcionais

---

## 7. Componentes Novos (a criar)

| Componente | Descrição |
|---|---|
| `<SidebarV2>` | Sidebar com `#F7F7F5`, novo estilo de item ativo, sem header separado |
| `<BottomTabBar>` | Navegação mobile com 5 tabs + FAB central |
| `<QuickActionSheet>` | Bottom sheet do `+` central (mobile) |
| `<ActionDrawer>` | Drawer reutilizável da direita (criação/edição de entidades) |
| `<SplitView>` | Layout lista + painel lateral (Escalas, Membros) |
| `<NotificationPanel>` | Slide-over do sino |
| `<InlineSearch>` | Busca inline sem modal (adicionar membro à escala) |

---

## 8. O Que Não Muda

- Stack técnica: Next.js 14, TypeScript, Tailwind, Supabase
- Motor de IA (9 fatores) — sem alterações funcionais
- Sistema de permissões RBAC (admin/leader/member)
- Lógica de notificações push e in-app
- Chat com `@mentions` (componente `MentionInput`)
- Rotas de URL existentes (deep links preservados)
- Dados e schema do banco

---

## 9. Fora de Escopo (V2)

- Dark mode
- Internacionalização
- Novos módulos funcionais (ex: financeiro, patrimônio)
- PWA / app nativo
- Redesign do e-mail de boas-vindas
