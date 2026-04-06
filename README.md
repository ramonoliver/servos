# Servos App — Organize. Sirva. Viva o propósito.

Sistema de gestão de voluntários para igrejas.

**Site:** [servosapp.com](https://servosapp.com)

## Acesso Demo

```
Email: ramon@servosapp.com
Senha: servos2026
```

## Rodar

```bash
npm install
npm run dev
```

Abra http://localhost:3000

> **Importante:** Se estiver atualizando de uma versão anterior, limpe o localStorage no navegador (DevTools → Application → Local Storage → limpar `servos_db`) ou acesse Configurações → Resetar dados.

## SQL de infraestrutura

Fonte de verdade para novos ambientes:

- diretório [`sql/migrations`](/Users/ramonoliveira/Downloads/Servosapp/servos/sql/migrations)

Ordem atual das migrations:

- [20260406160000_schedule_chats.sql](/Users/ramonoliveira/Downloads/Servosapp/servos/sql/migrations/20260406160000_schedule_chats.sql)
- [20260406160100_member_invitations.sql](/Users/ramonoliveira/Downloads/Servosapp/servos/sql/migrations/20260406160100_member_invitations.sql)
- [20260406160200_realtime_messages.sql](/Users/ramonoliveira/Downloads/Servosapp/servos/sql/migrations/20260406160200_realtime_messages.sql)
- [20260406160300_password_reset_tokens.sql](/Users/ramonoliveira/Downloads/Servosapp/servos/sql/migrations/20260406160300_password_reset_tokens.sql)

Script consolidado para aplicar tudo de uma vez no SQL Editor:

- [sql/communications.sql](/Users/ramonoliveira/Downloads/Servosapp/servos/sql/communications.sql)

Esse pacote cobre:

- `schedule_chats`
- `member_invitations`
- `password_reset_tokens`
- realtime de `messages` e `schedule_chats`
- índices
- constraints básicas
- permissões compatíveis com a arquitetura atual do app

Os arquivos [sql/schedule_chats.sql](/Users/ramonoliveira/Downloads/Servosapp/servos/sql/schedule_chats.sql), [sql/member_invitations.sql](/Users/ramonoliveira/Downloads/Servosapp/servos/sql/member_invitations.sql) e [sql/password_reset_tokens.sql](/Users/ramonoliveira/Downloads/Servosapp/servos/sql/password_reset_tokens.sql) continuam disponíveis como versões separadas.

## Stack

- **Next.js 14** — App Router + TypeScript
- **Tailwind CSS** — Design system com tokens da marca
- **bcryptjs** — Hashing real de senhas
- **localStorage** — Banco local (dev)
- **Supabase** — Banco de produção (preparado)

## Cor da Marca

| Token | Hex | Uso |
|-------|-----|-----|
| Brand | `#F4532A` | Cor principal, CTAs, destaques |
| Brand Deep | `#D94420` | Hover, ênfase |
| Brand Light | `#FFF0EC` | Backgrounds suaves |
| Dark | `#171717` | Textos, sidebar |

## Estrutura

```
src/
  types/             — Tipos TypeScript (20+ interfaces)
  lib/
    auth/            — Password hashing (bcryptjs), session, RBAC
    db/              — localStorage adapter + seed data
    ai/              — Motor IA com 9 fatores de scoring
    email/           — Email de boas-vindas (HTML template)
    utils/           — Helpers (cn, formatDate, getInitials, etc)
  hooks/             — useApp context provider
  components/
    ui/              — Modal, EmptyState, Skeleton, Avatar, etc
    shared/          — MemberEditModal
  app/
    login/           — Autenticação
    cadastro/        — Criação de conta + igreja
    onboarding/      — Wizard 6 etapas
    (app)/           — Rotas autenticadas
      dashboard/     — Dashboard por perfil
      escalas/       — Lista + criar (página completa) + detalhe
      minhas-escalas/— Visão do membro
      ministerios/   — CRUD + detalhe
      membros/       — Lista + convidar + detalhe + editar
      eventos/       — CRUD + detalhe
      calendario/    — Visão mensal
      notificacoes/  — Central lido/não-lido
      mensagens/     — Chat por ministério
      relatorios/    — Métricas e insights
      configuracoes/ — Igreja + dados
      perfil/        — Foto + senha + disponibilidade
```

## Perfis

| Perfil | Acesso |
|--------|--------|
| **Admin** | Tudo: ministérios, membros, escalas, eventos, relatórios, configs |
| **Líder** | Seu ministério: escalas, membros, mensagens, calendário |
| **Membro** | Suas escalas: confirmar/recusar, perfil, disponibilidade |

## Motor de IA

9 fatores com explicação transparente:
1. Disponibilidade semanal
2. Indisponibilidade por data
3. Status do membro (ativo/pausa/férias)
4. Rodízio justo
5. Taxa de confirmação
6. Carga recente
7. Vínculo de casal
8. Função compatível
9. Conflitos com outras escalas

## Funcionalidades

- Dashboard diferenciado por perfil (admin/líder/membro)
- Ministérios com múltiplos líderes e co-líderes
- Adicionar/remover membros do ministério
- Membros com foto de perfil, filtro por departamento
- Escalas em página completa com sugestão IA
- Adicionar/remover membros da escala
- Confirmação/recusa com motivo
- Substituição inteligente com sugestão automática
- Calendário mensal interativo
- Mensagens por ministério
- Notificações com lido/não-lido e links
- Relatórios (top servindo, menor confirmação, métricas)
- Email de boas-vindas com credenciais + versículo (1 Pedro 4:10)
- Onboarding guiado para novas igrejas (6 etapas)
- Perfil com upload de foto (base64) e troca de senha
- Ícones SVG outline na sidebar (13 ícones)
