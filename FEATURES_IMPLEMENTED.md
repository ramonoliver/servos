# 📋 Implementação - Notificações de Escala e Menções em Chat

## 1️⃣ Notificações Quando Membro é Adicionado à Escala

### Backend: `/api/schedule-members/route.ts`

Quando um líder adiciona um usuário a uma escala, agora o sistema:
- Envia notificação push via Firebase
- Cria notificação no sistema com botão direto para a escala

**Detalhes da notificação:**
- Título: "Adicionado à escala"
- Mensagem: Inclui nome da escala, nome do evento e data
- Link direto: Abre a página da escala quando clicado
- Tipo: `confirmation`

**Implementação:**
```typescript
// Após adicionar membro à escala
await sendUserNotification({
  userId,
  churchId,
  title: "Adicionado à escala",
  body: `Você foi adicionado à escala "${schedule}" do evento "${event}" em ${date}.`,
  actionUrl: `/escalas/${scheduleId}`,
  type: "confirmation",
});
```

---

## 2️⃣ Menções em Chat com @usuario

### Frontend: Novo componente `MentionInput`

**Localização:** `src/components/ui/mention-input.tsx`

**Funcionalidades:**
- Ao digitar `@`, aparece lista de usuários mencionáveis
- Filtragem automática enquanto você digita (ex: `@jo` mostra João)
- Click para selecionar ou Enter para confirmar
- Autocomplete com avatar do usuário

**Usuários mencionáveis:**
- Todos os participantes da escala
- Líderes do ministério

### Backend: Processamento de Menções

**Localização:** `/api/schedule-chats/route.ts`

**Funcionalidade `processMentions()`:**
1. Detecta padrão `@usuario` na mensagem
2. Busca usuários mencionáveis da escala
3. Envia notificação para cada usuário mencionado

**Detalhes da notificação:**
- Título: "Você foi mencionado"
- Mensagem: "{Nome do usuário} te mencionou em uma mensagem no chat da escala."
- Link direto: Abre o chat da escala
- Tipo: `info`

**Exemplo:**
```
@João está aqui? @Maria vem também?
→ João recebe notificação
→ Maria recebe notificação
```

---

## 🔌 Integração na Página de Escala

**Arquivo:** `src/app/(app)/escalas/[id]/page.tsx`

O campo de mensagem foi substituído de um `<input>` simples para o novo componente `<MentionInput>`:

**Antes:**
```jsx
<input 
  value={chatMsg}
  onChange={setChatMsg}
  placeholder="Mensagem para a equipe..."
/>
```

**Depois:**
```jsx
<MentionInput
  value={chatMsg}
  onChange={setChatMsg}
  onSend={sendChat}
  placeholder="Digite @ para mencionar alguém..."
  disabled={!chatAvailable || sendingChat || !canAccessScheduleChat}
  scheduleId={schedule.id}
  churchId={user.church_id}
/>
```

---

## 🎯 Fluxo de Funcionamento

### Adicionar Membro à Escala:
```
1. Líder clica "Adicionar Membro"
2. Seleciona um usuário
3. POST /api/schedule-members
   └─ Sistema envia notificação push + in-app
4. Usuário recebe notificação: "Adicionado à escala"
5. Clica e abre detalhes da escala
```

### Mencionar Alguém no Chat:
```
1. Usuário escreve "@Jo" no chat
2. MentionInput sugere "João", "Joseph", etc
3. Clica em João
4. Mensagem fica: "@João está aqui?"
5. POST /api/schedule-chats
   └─ Sistema detecta @João
   └─ Envia notificação para João
6. João recebe: "Você foi mencionado"
7. Clica e abre o chat
```

---

## 📱 Experiência do Usuário

### Notificações Recebidas:
- **Push**: Ativa na área de notificações do navegador/dispositivo
- **In-app**: Aparece na seção de notificações do Servos
- **Link direto**: Clica na notificação e já abre a página relevante

### Chat Melhorado:
- Descobrir quem está disponível com `@`
- Avisos personalizados quando mencionado
- Não perd mais mensagens importantes

---

## 🛠️ Configuração

Nenhuma configuração adicional necessária! O sistema:
- ✅ Detecta automaticamente participantes da escala
- ✅ Busca líderes do ministério
- ✅ Envia notificações se Firebase estiver configurado
- ✅ Graciosamente degrada se tabelas não existirem

---

## 📊 Tabelas Envolvidas

- `schedule_members` - Membros da escala
- `schedule_chats` - Mensagens do chat
- `notifications` - Notificações no sistema
- `push_tokens` - Tokens para notificações push
- `users` - Dados dos usuários
- `departments` - Informações dos ministérios

---

## ✨ Próximos Passos Opcionais

Para melhorar ainda mais:
- [ ] Histórico de menções recebidas
- [ ] Configurar quem pode ser mencionado (apenas participantes vs líderes)
- [ ] Editing de mensagens com menções preservadas
- [ ] Notificações em tempo real com audio/vibração customizada