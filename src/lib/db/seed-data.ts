import { hashPassword } from "@/lib/auth/password";

export function getSeedData() {
  const pw = hashPassword("servos2026");
  const now = new Date().toISOString();

  return {
    churches: [
      { id: "c1", name: "Igreja Batista Central", city: "Fortaleza", state: "CE", created_at: now },
    ],
    users: [
      { id: "u1", church_id: "c1", email: "ramon@servosapp.com", password_hash: pw, name: "Ramon Oliver", phone: "(85) 99999-0000", role: "admin", status: "active", avatar_color: "#7B9E87", photo_url: null, spouse_id: null, availability: [true,true,true,true,true,true,true], total_schedules: 24, confirm_rate: 96, must_change_password: false, last_served_at: "2026-03-16T18:00:00Z", notes: "", active: true, joined_at: "2025-01-15T00:00:00Z", created_at: now },
      { id: "u2", church_id: "c1", email: "marcos@teste.com", password_hash: pw, name: "Marcos Lima", phone: "(85) 98888-5678", role: "leader", status: "active", avatar_color: "#9E7B8B", photo_url: null, spouse_id: "u3", availability: [true,false,true,false,true,true,true], total_schedules: 20, confirm_rate: 90, must_change_password: false, last_served_at: "2026-03-16T18:00:00Z", notes: "", active: true, joined_at: "2025-02-01T00:00:00Z", created_at: now },
      { id: "u3", church_id: "c1", email: "ana@teste.com", password_hash: pw, name: "Ana Lima", phone: "(85) 97777-9012", role: "member", status: "active", avatar_color: "#A08B7B", photo_url: null, spouse_id: "u2", availability: [true,false,true,false,true,true,true], total_schedules: 18, confirm_rate: 92, must_change_password: false, last_served_at: "2026-03-16T18:00:00Z", notes: "", active: true, joined_at: "2025-02-01T00:00:00Z", created_at: now },
      { id: "u4", church_id: "c1", email: "lucas@teste.com", password_hash: pw, name: "Lucas Ferreira", phone: "(85) 96666-3456", role: "member", status: "active", avatar_color: "#7B8B9E", photo_url: null, spouse_id: null, availability: [false,false,false,false,true,true,true], total_schedules: 22, confirm_rate: 88, must_change_password: false, last_served_at: "2026-03-09T18:00:00Z", notes: "", active: true, joined_at: "2025-03-10T00:00:00Z", created_at: now },
      { id: "u5", church_id: "c1", email: "juliana@teste.com", password_hash: pw, name: "Juliana Costa", phone: "(85) 95555-7890", role: "member", status: "active", avatar_color: "#9E907B", photo_url: null, spouse_id: null, availability: [false,true,true,true,false,true,true], total_schedules: 16, confirm_rate: 85, must_change_password: false, last_served_at: null, notes: "", active: true, joined_at: "2025-04-01T00:00:00Z", created_at: now },
      { id: "u6", church_id: "c1", email: "paulo@teste.com", password_hash: pw, name: "Paulo Mendes", phone: "(85) 94444-1234", role: "member", status: "active", avatar_color: "#8B7B9E", photo_url: null, spouse_id: null, availability: [true,true,true,true,true,false,true], total_schedules: 14, confirm_rate: 78, must_change_password: false, last_served_at: null, notes: "", active: true, joined_at: "2025-05-15T00:00:00Z", created_at: now },
      { id: "u7", church_id: "c1", email: "daniel@teste.com", password_hash: pw, name: "Daniel Souza", phone: "(85) 93333-5678", role: "member", status: "active", avatar_color: "#8BA07B", photo_url: null, spouse_id: null, availability: [false,false,true,false,false,true,true], total_schedules: 19, confirm_rate: 94, must_change_password: false, last_served_at: "2026-03-16T18:00:00Z", notes: "", active: true, joined_at: "2025-03-20T00:00:00Z", created_at: now },
      { id: "u8", church_id: "c1", email: "camila@teste.com", password_hash: pw, name: "Camila Alves", phone: "(85) 92222-9012", role: "member", status: "active", avatar_color: "#7B9E95", photo_url: null, spouse_id: null, availability: [true,true,true,true,true,true,false], total_schedules: 12, confirm_rate: 80, must_change_password: false, last_served_at: null, notes: "", active: true, joined_at: "2025-06-01T00:00:00Z", created_at: now },
    ],
    departments: [
      { id: "d1", church_id: "c1", name: "Louvor", description: "Ministerio de louvor e adoracao", icon: "music", color: "#D4A574", leader_ids: ["u2"], co_leader_ids: ["u1"], active: true, created_at: now },
      { id: "d2", church_id: "c1", name: "Midia", description: "Fotografia, video e transmissao", icon: "camera", color: "#7B8B9E", leader_ids: ["u1"], co_leader_ids: [], active: true, created_at: now },
      { id: "d3", church_id: "c1", name: "Recepcao", description: "Acolhimento e recepcao de visitantes", icon: "heart", color: "#7B9E87", leader_ids: ["u1"], co_leader_ids: [], active: true, created_at: now },
    ],
    department_members: [
      { id: "dm1", department_id: "d1", user_id: "u1", function_name: "Vocal", joined_at: now },
      { id: "dm2", department_id: "d1", user_id: "u2", function_name: "Guitarra", joined_at: now },
      { id: "dm3", department_id: "d1", user_id: "u3", function_name: "Vocal", joined_at: now },
      { id: "dm4", department_id: "d1", user_id: "u4", function_name: "Bateria", joined_at: now },
      { id: "dm5", department_id: "d1", user_id: "u5", function_name: "Teclado", joined_at: now },
      { id: "dm6", department_id: "d1", user_id: "u6", function_name: "Baixo", joined_at: now },
      { id: "dm7", department_id: "d1", user_id: "u7", function_name: "Vocal", joined_at: now },
      { id: "dm8", department_id: "d1", user_id: "u8", function_name: "Vocal", joined_at: now },
    ],
    events: [
      { id: "e1", church_id: "c1", name: "Culto de Domingo", description: "Celebracao dominical", type: "recurring", icon: "church", location: "Templo principal", base_time: "18:00", instructions: "", recurrence: "weekly", active: true, created_at: now },
      { id: "e2", church_id: "c1", name: "Culto de Quarta", description: "Culto de meio de semana", type: "recurring", icon: "church", location: "Templo principal", base_time: "19:30", instructions: "", recurrence: "weekly", active: true, created_at: now },
      { id: "e3", church_id: "c1", name: "Espetaculo de Pascoa", description: "Apresentacao especial de Pascoa", type: "special", icon: "cross", location: "Templo principal", base_time: "19:00", instructions: "Ensaio extra no sabado anterior", recurrence: "once", active: true, created_at: now },
      { id: "e4", church_id: "c1", name: "Culto de Mulheres", description: "Encontro mensal feminino", type: "special", icon: "flower", location: "Salao social", base_time: "19:00", instructions: "", recurrence: "monthly", active: true, created_at: now },
    ],
    schedules: [
      { id: "s1", church_id: "c1", event_id: "e1", department_id: "d1", date: "2026-03-29", time: "18:00", arrival_time: "17:00", status: "active", instructions: "Chegar 1h antes para passagem de som", notes: "", published: true, created_by: "u1", created_at: now },
      { id: "s2", church_id: "c1", event_id: "e2", department_id: "d1", date: "2026-04-01", time: "19:30", arrival_time: "18:30", status: "active", instructions: "", notes: "", published: true, created_by: "u1", created_at: now },
      { id: "s3", church_id: "c1", event_id: "e3", department_id: "d1", date: "2026-04-05", time: "19:00", arrival_time: "17:00", status: "draft", instructions: "Ensaio geral sabado 04/04 as 14h", notes: "Evento especial - verificar figurino", published: false, created_by: "u1", created_at: now },
    ],
    schedule_members: [
      { id: "sm1", schedule_id: "s1", user_id: "u1", function_name: "Vocal", status: "confirmed", decline_reason: "", substitute_id: null, substitute_for: null, is_reserve: false, responded_at: now, notified_at: now },
      { id: "sm2", schedule_id: "s1", user_id: "u2", function_name: "Guitarra", status: "confirmed", decline_reason: "", substitute_id: null, substitute_for: null, is_reserve: false, responded_at: now, notified_at: now },
      { id: "sm3", schedule_id: "s1", user_id: "u3", function_name: "Vocal", status: "confirmed", decline_reason: "", substitute_id: null, substitute_for: null, is_reserve: false, responded_at: now, notified_at: now },
      { id: "sm4", schedule_id: "s1", user_id: "u4", function_name: "Bateria", status: "confirmed", decline_reason: "", substitute_id: null, substitute_for: null, is_reserve: false, responded_at: now, notified_at: now },
      { id: "sm5", schedule_id: "s1", user_id: "u5", function_name: "Teclado", status: "pending", decline_reason: "", substitute_id: null, substitute_for: null, is_reserve: false, responded_at: null, notified_at: now },
      { id: "sm6", schedule_id: "s1", user_id: "u6", function_name: "Baixo", status: "pending", decline_reason: "", substitute_id: null, substitute_for: null, is_reserve: false, responded_at: null, notified_at: now },
      { id: "sm7", schedule_id: "s1", user_id: "u7", function_name: "Vocal", status: "confirmed", decline_reason: "", substitute_id: null, substitute_for: null, is_reserve: false, responded_at: now, notified_at: now },
      { id: "sm8", schedule_id: "s1", user_id: "u8", function_name: "Vocal", status: "declined", decline_reason: "Viagem em familia", substitute_id: null, substitute_for: null, is_reserve: false, responded_at: now, notified_at: now },
      { id: "sm9", schedule_id: "s2", user_id: "u1", function_name: "Vocal", status: "confirmed", decline_reason: "", substitute_id: null, substitute_for: null, is_reserve: false, responded_at: now, notified_at: now },
      { id: "sm10", schedule_id: "s2", user_id: "u2", function_name: "Guitarra", status: "confirmed", decline_reason: "", substitute_id: null, substitute_for: null, is_reserve: false, responded_at: now, notified_at: now },
      { id: "sm11", schedule_id: "s2", user_id: "u5", function_name: "Teclado", status: "confirmed", decline_reason: "", substitute_id: null, substitute_for: null, is_reserve: false, responded_at: now, notified_at: now },
      { id: "sm12", schedule_id: "s2", user_id: "u7", function_name: "Vocal", status: "confirmed", decline_reason: "", substitute_id: null, substitute_for: null, is_reserve: false, responded_at: now, notified_at: now },
      { id: "sm13", schedule_id: "s2", user_id: "u3", function_name: "Vocal", status: "confirmed", decline_reason: "", substitute_id: null, substitute_for: null, is_reserve: false, responded_at: now, notified_at: now },
    ],
    schedule_slots: [
      { id: "sl1", schedule_id: "s1", function_name: "Vocal", quantity: 4, filled: 3 },
      { id: "sl2", schedule_id: "s1", function_name: "Guitarra", quantity: 1, filled: 1 },
      { id: "sl3", schedule_id: "s1", function_name: "Bateria", quantity: 1, filled: 1 },
      { id: "sl4", schedule_id: "s1", function_name: "Teclado", quantity: 1, filled: 1 },
      { id: "sl5", schedule_id: "s1", function_name: "Baixo", quantity: 1, filled: 1 },
    ],
    unavailable_dates: [],
    notifications: [
      { id: "n1", user_id: "u1", church_id: "c1", title: "Amanha e dia de servir!", body: "Voce esta escalado para o Culto de Domingo as 18h no Ministerio de Louvor.", icon: "bell", type: "reminder", read: false, action_url: "/escalas/s1", created_at: now },
      { id: "n2", user_id: "u1", church_id: "c1", title: "Marcos confirmou presenca", body: "Marcos Lima confirmou para o Culto de Quarta (01/04).", icon: "check", type: "confirmation", read: false, action_url: "/escalas/s2", created_at: now },
      { id: "n3", user_id: "u1", church_id: "c1", title: "Camila nao podera servir", body: "Camila Alves recusou o Culto de Domingo. Motivo: Viagem em familia.", icon: "alert", type: "substitution", read: false, action_url: "/escalas/s1", created_at: now },
      { id: "n4", user_id: "u1", church_id: "c1", title: "2 membros pendentes", body: "Juliana Costa e Paulo Mendes ainda nao confirmaram a escala de domingo.", icon: "alert", type: "alert", read: true, action_url: "/escalas/s1", created_at: now },
    ],
    messages: [
      { id: "m1", department_id: "d1", sender_id: "u2", content: "Pessoal, ensaio sabado as 16h! Repertorio novo.", created_at: new Date(Date.now() - 7200000).toISOString() },
      { id: "m2", department_id: "d1", sender_id: "u1", content: "Perfeito, Marcos! Estarei la.", created_at: new Date(Date.now() - 6000000).toISOString() },
      { id: "m3", department_id: "d1", sender_id: "u3", content: "Vou levar o novo microfone pra testar.", created_at: new Date(Date.now() - 3600000).toISOString() },
    ],
    audit_log: [],
    onboarding_progress: [
      { id: "op1", church_id: "c1", completed_steps: ["church","profile","department","member","event","schedule"], completed: true, created_at: now },
    ],
  };
}
