# Modelo de papéis de células (redes, casais, permissões)

Status: **desenho aprovado nas decisões-chave (2026-05-30)** — pronto para implementar em fases.

## Decisões travadas
1. **Liderança em par/casais** → listas: `cells.leader_ids[]` e `cells.co_leader_ids[]` (igual aos ministérios).
2. **Supervisão por grupo** → entidade **Redes/Setores** (`cell_networks`); supervisor enxerga a rede inteira; célula pertence a uma rede (`cells.network_id`).
3. **Pastor / Coordenação** → campo no usuário `users.cell_role` (`pastor` | `coordenacao` | null).
4. **Permissão** → papéis dão **visão + gestão conforme o nível** (não só leitura).

## Papéis e escopo

| Papel | Identidade (de onde vem) | Vê | Gerencia |
|---|---|---|---|
| **Admin global** | `users.role = 'admin'` | tudo | tudo (cells + redes + papéis) |
| **Pastor** | `users.cell_role = 'pastor'` | todas as células e redes | tudo de células/redes |
| **Coordenação** | `users.cell_role = 'coordenacao'` | todas as células e redes | criar/editar/excluir células e redes |
| **Supervisão** | é `supervisor` de uma rede (`cell_networks.supervisor_ids[]`) | células das suas redes | criar/editar células das suas redes; reuniões; **não** exclui |
| **Líder / Co-líder** | está em `cells.leader_ids[] / co_leader_ids[]` | a sua célula | editar a sua célula (dados, membros, reuniões, cuidado); **não** exclui |
| **Membro** | está em `cell_members` | a sua célula | só visualiza |

Hierarquia de visão: Admin/Pastor ⊇ Coordenação ⊇ Supervisão ⊇ Líder/Co-líder ⊇ Membro.

## Schema (mudanças)

### `users`
- `+ cell_role text` nullable — `'pastor' | 'coordenacao' | null`.

### `cell_networks` (nova) — Redes/Setores
- `id text pk`, `church_id text`, `name text`, `description text default ''`,
  `supervisor_ids text[] default '{}'` (suporta casal de supervisores),
  `color text default '#9B8CFB'`, `created_at timestamptz`.

### `cells` (alterar)
- `leader_id` → **`leader_ids text[]`**; `co_leader_id` → **`co_leader_ids text[]`**.
- `+ network_id text` nullable (FK lógica p/ `cell_networks`).
- `supervisor_id` deixa de ser usado (supervisão passa pela rede); manter a coluna por compat, mas ignorada.
- Migração de dados: `leader_ids := array[leader_id]` quando não nulo; idem co_leader.

## Regra de visibilidade (server-side em `/api/cells/list`)
Uma pessoa vê uma célula se **qualquer**:
- `users.role='admin'` ou `cell_role in ('pastor','coordenacao')` → todas da igreja;
- supervisiona a rede da célula: `cell.network_id` ∈ redes onde `me ∈ supervisor_ids`;
- `me ∈ cell.leader_ids ∪ co_leader_ids`;
- existe `cell_members(cell_id, me)`.

A mesma lógica calcula o conjunto visível para a **agenda**.

## Regra de gestão (server-side nas APIs de cells/meetings/care/networks)
- **Criar/excluir célula**: admin/pastor/coordenação (supervisor pode **criar** dentro da sua rede; excluir não).
- **Editar célula** (dados/membros): admin/pastor/coord; supervisor (na rede); líder/co-líder (a própria).
- **Reuniões + cuidado**: quem pode editar a célula.
- **Redes (CRUD) e atribuir `cell_role`**: admin/pastor/coordenação.

## Plano de implementação (fases)

- **5a — Fundação de dados + liderança em listas**
  - Migração: `cell_networks`, `users.cell_role`, `cells.leader_ids/co_leader_ids/network_id` + cópia de dados.
  - `cells/manage` e `CellForm`: líderes/co-líderes viram **MultiSelect**; campo de **rede**; atalho “incluir cônjuge”.
  - `cells/list` + agenda: visibilidade server-side pelo novo modelo.
- **5b — Redes/Setores (UI)**: tela para criar/editar redes, definir supervisores (par), e a qual rede cada célula pertence.
- **5c — Papéis (UI)**: atribuir `cell_role` (pastor/coordenação) às pessoas; ver supervisores; matriz de permissão aplicada na gestão.

## Decisões menores em aberto (resolver ao implementar)
- Supervisor pode **excluir** células da rede? (proposto: não)
- Coordenação pode atribuir `cell_role` a outras pessoas, ou só admin/pastor? (proposto: admin/pastor)
- Uma célula pode ficar **sem rede** (network_id null)? (proposto: sim — só admin/pastor/coord a veem até receber rede)
