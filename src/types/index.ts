// ============================================
// SERVUS v2 — Core Types
// ============================================

export type Role = "admin" | "leader" | "member";
export type UserStatus = "active" | "inactive" | "paused" | "vacation";
export type ScheduleStatus = "draft" | "active" | "cancelled" | "completed";
export type ConfirmStatus = "pending" | "confirmed" | "declined";
export type EventType = "recurring" | "special";
export type NotificationType = "info" | "reminder" | "confirmation" | "alert" | "welcome" | "substitution";

export interface Church {
  id: string;
  name: string;
  city: string;
  state: string;
  created_at: string;
}

export interface User {
  id: string;
  church_id: string;
  email: string;
  password_hash: string;
  name: string;
  phone: string;
  role: Role;
  status: UserStatus;
  avatar_color: string;
  photo_url: string | null;   // Profile photo URL or base64
  spouse_id: string | null;
  availability: boolean[]; // 7 days Mon-Sun
  total_schedules: number;
  confirm_rate: number;
  must_change_password: boolean;
  last_served_at: string | null;
  notes: string;
  active: boolean;
  joined_at: string;
  created_at: string;
}

export interface Department {
  id: string;
  church_id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  leader_ids: string[];      // Multiple leaders
  co_leader_ids: string[];   // Multiple co-leaders
  active: boolean;
  created_at: string;
}

export interface DepartmentMember {
  id: string;
  department_id: string;
  user_id: string;
  function_name: string; // "Vocal", "Guitarra", etc
  joined_at: string;
}

export interface Event {
  id: string;
  church_id: string;
  name: string;
  description: string;
  type: EventType;
  icon: string;
  location: string;
  base_time: string;
  instructions: string;
  recurrence: string; // "weekly" | "biweekly" | "monthly" | "once"
  active: boolean;
  created_at: string;
}

export interface Schedule {
  id: string;
  church_id: string;
  event_id: string;
  department_id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  arrival_time: string;
  status: ScheduleStatus;
  instructions: string;
  notes: string;
  published: boolean;
  created_by: string;
  created_at: string;
}

export interface ScheduleMember {
  id: string;
  schedule_id: string;
  user_id: string;
  function_name: string;
  status: ConfirmStatus;
  decline_reason: string;
  substitute_id: string | null;
  substitute_for: string | null;
  is_reserve: boolean;
  responded_at: string | null;
  notified_at: string | null;
}

export interface ScheduleSlot {
  id: string;
  schedule_id: string;
  function_name: string;
  quantity: number;
  filled: number;
}

export interface UnavailableDate {
  id: string;
  user_id: string;
  date: string;
  end_date: string | null;
  reason: string;
  type: "single" | "range" | "vacation";
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  church_id: string;
  title: string;
  body: string;
  icon: string;
  type: NotificationType;
  read: boolean;
  action_url: string;
  created_at: string;
}

export interface Message {
  id: string;
  department_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  church_id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, any>;
  created_at: string;
}

// ============================================
// Enriched types (joined data)
// ============================================

export interface EnrichedSchedule extends Schedule {
  event?: Event;
  department?: Department;
  members: (ScheduleMember & { user?: User })[];
  slots: ScheduleSlot[];
  confirmed_count: number;
  pending_count: number;
  declined_count: number;
}

export interface EnrichedMember extends User {
  departments: (DepartmentMember & { department?: Department })[];
  spouse?: User | null;
}

// ============================================
// AI Types
// ============================================

export interface ScoringReason {
  factor: string;
  label: string;
  impact: number;
  type: "positive" | "negative" | "neutral";
}

export interface MemberScore {
  member_id: string;
  score: number;
  available: boolean;
  reasons: ScoringReason[];
  alerts: string[];
}

// ============================================
// Session
// ============================================

export interface Session {
  user_id: string;
  church_id: string;
  email: string;
  name: string;
  role: Role;
  avatar_color: string;
  expires_at: number;
}
