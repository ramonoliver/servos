# Servos — Pessoas & Cuidado Pastoral

**Data:** 2026-05-27  
**Status:** Rascunho para validacao do usuario  
**Escopo:** Novos modulos pastorais do Servos App  
**Regra critica:** nao alterar Supabase online nesta fase

---

## 1. Objetivo

Expandir o Servos App com uma camada pastoral centrada em pessoas, mantendo a identidade visual V2 ja aprovada.

Os novos modulos devem reforcar:

- menos burocracia, mais cuidado com pessoas
- acompanhamento humano e organizado
- simplicidade para lideres no mobile
- uma evolucao natural do produto atual

Esta implementacao nao deve criar uma nova identidade visual, novo design system ou uma experiencia de ERP corporativo.

---

## 2. Restricoes desta fase

Enquanto o produto atual estiver online:

- nao criar migrations aplicadas no Supabase remoto
- nao alterar tabelas online
- nao modificar dados reais
- nao publicar em producao
- nao comitar ate validarmos localmente

Tudo que depender de banco novo deve primeiro funcionar com:

- tipos TypeScript locais
- dados mockados
- componentes reutilizaveis
- rotas locais
- validacao visual e funcional no ambiente local

Depois da validacao local, sera criada uma etapa separada para schema SQL, migrations, revisao, commit e publicacao.

---

## 3. Principios de design

Manter os principios da spec V2:

- sidebar clara em `#F7F7F5`
- fundo geral `#FAFAF8`
- superficies brancas
- laranja da marca `#F4532A` apenas para destaques e acoes importantes
- tipografia atual: Outfit + DM Sans
- cards, botoes, badges, inputs e empty states ja existentes
- layout leve, limpo e escaneavel

Evitar:

- dashboards financeiros
- excesso de graficos
- tabelas densas como ERP
- linguagem punitiva
- formularios longos sem contexto pastoral

Priorizar:

- leitura humana
- historico cronologico
- acoes rapidas
- estados vazios acolhedores
- mobile first
- microinteracoes suaves dentro do estilo atual

---

## 4. Arquitetura conceitual

O centro do sistema passa a ser a pessoa.

Toda entidade nova deve se relacionar com uma pessoa:

- pessoa -> celula
- pessoa -> ministerio
- pessoa -> escala
- pessoa -> reuniao
- pessoa -> timeline pastoral
- pessoa -> acompanhamento
- pessoa -> pedido de oracao
- pessoa -> alerta pastoral
- pessoa -> relacionamentos com liderancas e membros

O modulo atual de `Membros` sera tratado como base existente. A nova area `Pessoas` amplia esse conceito para membros, visitantes, voluntarios, lideres, pastores e discipuladores.

---

## 5. Navegacao e sidebar

Atualizar a sidebar mantendo o estilo V2.

### Itens existentes

- Inicio
- Escalas
- Ministerios
- Membros
- Eventos
- Calendario
- Notificacoes
- Ranking
- Mensagens
- Relatorios

### Nova secao: Pessoas & Cuidado

- Pessoas
- Celulas
- Acompanhamentos
- Pedidos de Oracao
- Timeline Pastoral
- Alertas

### Nova secao: Gestao Pastoral

- CRM Pastoral
- Dashboard Pastoral
- Relatorios Pastorais

### Nova secao: Comunicacao

- Comunicacao
- Enquetes

### Secao Ministerios

Mantem a lista dinamica de ministerios ja existente:

- Producao
- Louvor
- Midia
- Boas Vindas
- SkyKids
- Ver todos os ministerios

### Regras visuais da sidebar

- nao mudar marca ou layout base
- usar separadores sutis entre secoes
- usar label uppercase pequeno para secoes
- usar badge `Novo` apenas durante introducao dos modulos
- preservar comportamento colapsavel
- manter mobile com bottom tab bar e menu "Mais"

---

## 6. Modulo Pessoas

### Objetivo

Centralizar todos os perfis humanos da igreja em uma estrutura unica.

### Dados basicos

- foto/avatar
- nome completo
- telefone
- email
- data de nascimento
- genero
- estado civil
- endereco
- instagram

### Dados igreja

- data de chegada
- membro
- visitante
- voluntario
- lider
- pastor
- batizado
- em discipulado
- participa de celula
- ministerios vinculados

### Tags inteligentes

Exemplos iniciais:

- Novo convertido
- Em acompanhamento
- Lideranca
- Louvor
- Kids
- Casais
- Jovens
- Visitante
- Consolidado

As tags devem:

- ser coloridas
- permitir multiplas tags
- aparecer na listagem e no perfil
- possuir busca e filtros
- usar cores suaves, sem poluir a interface

### Listagem

Criar uma pagina `/pessoas` com:

- busca rapida
- filtros por tipo e tag
- agrupamentos simples
- avatar
- status
- tags
- cargo/funcao
- celula quando existir
- ministerios vinculados

Filtros iniciais:

- membros
- visitantes
- lideres
- voluntarios
- pessoas sem celula
- pessoas em acompanhamento
- novos convertidos

### Perfil da pessoa

Criar rota `/pessoas/[id]` com:

- header com avatar, nome, funcao, tags, ministerios e celula
- acoes rapidas
- tabs:
  - Visao geral
  - Timeline
  - Celulas
  - Ministerios
  - Escalas
  - Acompanhamentos
  - Pedidos de oracao
  - Observacoes

---

## 7. Perfis e permissoes

Evoluir permissoes sem criar granularidade tecnica excessiva.

### Perfis previstos

- Admin Geral: acesso total
- Pastor: dashboards pastorais, acompanhamento geral e visualizacao ampla
- Lider de Departamento: membros do departamento, escalas, comunicacao e voluntarios
- Lider de Celula: propria celula, membros, reunioes, feedbacks e acompanhamento
- Membro: perfil pessoal, escalas, pedidos de oracao e confirmacoes

### UX

- configuracao simples
- linguagem clara
- evitar matriz complexa de permissoes
- usar presets por perfil

### Implementacao inicial local

Nesta fase, ampliar os tipos e helpers de permissao em TypeScript, mas sem alterar schema remoto.

---

## 8. Modulo Celulas

### Rota principal

Criar `/celulas`.

### Cadastro de celula

Campos:

- nome
- foto/capa
- descricao
- lider
- co-lider
- supervisor
- endereco
- dia da semana
- horario
- quantidade maxima
- publico alvo
- status

### Listagem

A pagina deve ter:

- busca
- filtros
- cards modernos
- quantidade de membros
- lider responsavel
- dia/horario
- indicador de saude da celula

### Tela da celula

Criar `/celulas/[id]` com:

- capa
- nome
- lider
- quantidade de membros
- endereco
- dia/horario
- tabs:
  - Visao geral
  - Membros
  - Reunioes
  - Timeline
  - Saude
  - Pedidos de oracao

---

## 9. Membros da celula

Dentro de cada celula:

- adicionar membro
- remover membro
- alterar status
- marcar visitante
- marcar ativo
- marcar em acompanhamento

UX:

- mobile first
- poucos cliques
- touch friendly
- acoes inline
- listas simples com avatar e status

---

## 10. Reunioes de celula

### Criar reuniao

Campos:

- data
- horario
- tema
- palavra ministrada
- observacoes

### Presenca

Registrar:

- quem foi
- quem faltou
- visitantes
- primeira visita

### UX de presenca

- toggles rapidos
- botoes grandes em mobile
- selecao simplificada
- feedback visual imediato

### Efeitos previstos

Quando a presenca for registrada:

- gerar evento na timeline pastoral
- atualizar frequencia
- atualizar saude da celula
- possivelmente gerar alerta pastoral

Nesta fase, esses efeitos serao simulados localmente com dados mockados.

---

## 11. Feedback da reuniao

Apos cada reuniao, o lider registra um feedback pastoral.

### Campo: Como foi a reuniao?

- Muito boa
- Boa
- Normal
- Dificil

### Ambiente espiritual

- presenca de Deus
- comunhao
- participacao
- conexao

### Necessidades identificadas

- pessoas precisando cuidado
- pedidos de oracao
- conflitos
- acompanhamento necessario

### Observacoes

Campo livre para percepcoes pastorais.

UX deve parecer humana e acolhedora, nao um formulario empresarial.

---

## 12. Saude da celula

Criar uma visao simples dentro da celula.

Indicadores:

- frequencia
- comunhao
- participacao
- crescimento
- engajamento
- acompanhamento

Representacao visual:

- barras leves
- badges
- cards pequenos
- mensagens interpretativas

Evitar graficos corporativos e comparacoes frias.

---

## 13. CRM Pastoral

Criar `/crm-pastoral`.

Objetivo:

- centralizar historico pastoral
- acompanhamentos
- observacoes
- evolucao espiritual
- relacionamentos

Experiencia:

- lista de pessoas em cuidado
- filtros por prioridade/status/tag
- painel de detalhe com timeline e proxima acao
- linguagem de cuidado, nao de cobranca

---

## 14. Timeline Pastoral

Criar `/timeline-pastoral` e tambem timeline embutida no perfil da pessoa e celula.

Inspiracoes:

- Linear Activity
- Notion Timeline
- Slack Activity

Eventos iniciais:

- visitou culto
- entrou em celula
- iniciou discipulado
- faltou reunioes
- entrou em ministerio
- pedido de oracao
- acompanhamento realizado
- ausencia recorrente
- troca de lideranca
- confirmacao de escala

Requisitos:

- cronologica
- filtravel
- icones/status
- agrupamento por data
- legivel no mobile

---

## 15. Acompanhamento pastoral

Criar `/acompanhamentos`.

Funcionalidades:

- criar acompanhamento
- registrar observacoes
- definir responsavel
- definir prioridade
- acompanhar evolucao
- registrar retorno

Status:

- Em aberto
- Em andamento
- Finalizado

Prioridades:

- baixa
- media
- alta

---

## 16. Alertas inteligentes

Criar `/alertas`.

Alertas iniciais:

- pessoa sem acompanhamento
- visitante recorrente
- faltou varias reunioes
- faltou escalas
- novo convertido sem discipulado
- lider sobrecarregado

Tom de voz:

- ajuda pastoral
- sugestao de cuidado
- sem linguagem de cobranca

Exemplo:

> Ana faltou nas ultimas reunioes da celula. Talvez seja um bom momento para alguem entrar em contato.

---

## 17. Dashboard Pastoral

Criar `/dashboard-pastoral`.

Informacoes:

- visitantes recentes
- pessoas em acompanhamento
- pessoas se afastando
- crescimento de celulas
- pedidos de oracao
- frequencia geral
- lideres ativos

Formato:

- cards acolhedores
- lista de prioridades pastorais
- atalhos para contato/acompanhamento
- sem aparencia financeira ou corporativa

---

## 18. Relacionamentos

Criar estrutura conceitual para relacionamentos:

- pessoa -> discipulador
- pessoa -> lider de celula
- pessoa -> pastor responsavel
- pessoa -> conjuge/familia
- pessoa -> ministerios
- pessoa -> liderancas

Na UI, exibir relacionamentos como uma secao simples no perfil da pessoa.

---

## 19. Estados vazios

Todos os novos modulos devem ter empty states premium.

Exemplos:

- sem reunioes
- sem membros na celula
- sem pedidos de oracao
- sem acompanhamentos
- sem alertas

Tom:

- acolhedor
- orientado para proxima acao
- visual leve

---

## 20. Mobile

Prioridade alta.

Todas as telas precisam funcionar bem em:

- iPhone
- Android
- telas pequenas

Regras:

- acoes principais visiveis
- botoes touch friendly
- listas escaneaveis
- formularios curtos
- drawers ou sheets para acoes rapidas
- evitar tabelas horizontais

---

## 21. Microinteracoes

Adicionar transicoes suaves respeitando o produto atual.

Possibilidades:

- hover refinado
- loading elegante
- feedback visual ao salvar
- entrada suave de drawers/sheets
- mudanca de status com animacao discreta

Observacao: o projeto ainda nao possui `framer-motion` instalado. Antes de usar, validar se vale adicionar a dependencia ou se transicoes CSS bastam para a primeira fase.

---

## 22. Estrategia tecnica sem Supabase remoto

### Fase local

Criar:

- tipos TypeScript dos novos dominios
- dados mockados em arquivo local
- componentes de apresentacao
- rotas Next.js
- filtros client-side
- simulacao de timeline, alertas e saude da celula

Nao criar:

- migrations aplicadas
- chamadas reais para tabelas inexistentes
- escrita em Supabase remoto
- alteracoes em dados de usuarios reais

### Fase de banco futura

Depois de validado localmente:

- desenhar schema SQL
- revisar relacionamentos
- criar migrations
- testar em ambiente local/staging
- validar rollback
- comitar
- publicar

---

## 23. Rotas previstas

Novas rotas:

- `/pessoas`
- `/pessoas/[id]`
- `/celulas`
- `/celulas/[id]`
- `/acompanhamentos`
- `/pedidos-oracao`
- `/timeline-pastoral`
- `/alertas`
- `/crm-pastoral`
- `/dashboard-pastoral`
- `/relatorios-pastorais`
- `/comunicacao`
- `/enquetes`

Rotas existentes preservadas:

- `/dashboard`
- `/escalas`
- `/ministerios`
- `/membros`
- `/eventos`
- `/calendario`
- `/notificacoes`
- `/rankings`
- `/mensagens`
- `/relatorios`
- `/configuracoes`
- `/perfil`

---

## 24. Componentes previstos

Reutilizar componentes atuais:

- `Avatar`
- `EmptyState`
- `Skeleton`
- `StatCard`
- `RoleBadge`
- `ActionDrawer`
- `SplitView`
- `InlineSearch`
- `MultiSelect`
- `SidebarV2`
- `BottomTabBar`

Criar novos componentes apenas quando necessario:

- `PersonTag`
- `PersonCard`
- `PersonHeader`
- `PastoralTimeline`
- `TimelineEventItem`
- `CellCard`
- `CellHealthSummary`
- `AttendanceToggleList`
- `PastoralFeedbackForm`
- `PastoralAlertCard`
- `CareCaseCard`
- `RelationshipList`

---

## 25. Ordem de implementacao proposta

### Etapa 1: Fundacao local e navegacao

- atualizar sidebar com novas secoes
- criar tipos dos novos dominios
- criar mocks locais
- criar rotas base
- criar empty states
- garantir mobile sem regressao

### Etapa 2: Pessoas

- listagem `/pessoas`
- filtros e tags
- perfil `/pessoas/[id]`
- tabs principais
- timeline embutida mockada

### Etapa 3: Celulas

- listagem `/celulas`
- detalhe `/celulas/[id]`
- membros da celula
- reunioes mockadas
- presenca mobile first

### Etapa 4: Cuidado pastoral

- acompanhamentos
- CRM Pastoral
- alertas
- dashboard pastoral
- timeline geral

### Etapa 5: Banco e publicacao

- schema SQL
- migrations
- testes locais/staging
- commit
- deploy

---

## 26. Validacao antes de commit

Antes de commit:

- build local passa
- TypeScript sem erros
- rotas novas carregam
- sidebar desktop e mobile revisadas
- fluxos principais testados localmente
- nenhum endpoint real tenta acessar tabela inexistente
- nenhuma migration aplicada no Supabase online

---

## 27. Resultado esperado

O usuario final deve sentir:

> Esse sistema realmente ajuda nossa igreja a cuidar melhor das pessoas.

A experiencia final deve parecer:

- moderna
- humana
- simples
- organizada
- pastoral
- integrada ao Servos atual

