// ─── Notification Channel ────────────────────────────────────────────────────

export type NotificationChannel = "email" | "sms" | "whatsapp" | "push";

// ─── Notification Types ───────────────────────────────────────────────────────

export enum NotificationType {
  // Escalas
  SCHEDULE_ASSIGNED       = "SCHEDULE_ASSIGNED",
  SCHEDULE_REMINDER       = "SCHEDULE_REMINDER",
  SCHEDULE_UPDATED        = "SCHEDULE_UPDATED",
  SCHEDULE_CANCELLED      = "SCHEDULE_CANCELLED",

  // Ministérios
  MINISTRY_INVITE         = "MINISTRY_INVITE",
  MINISTRY_ANNOUNCEMENT   = "MINISTRY_ANNOUNCEMENT",

  // Células
  CELL_ANNOUNCEMENT       = "CELL_ANNOUNCEMENT",

  // Geral
  GENERAL_ANNOUNCEMENT    = "GENERAL_ANNOUNCEMENT",
  AVAILABILITY_REQUEST    = "AVAILABILITY_REQUEST",

  // Conta
  WELCOME                 = "WELCOME",
  PASSWORD_RESET          = "PASSWORD_RESET",
}

// ─── Payloads per type ────────────────────────────────────────────────────────

export interface ScheduleAssignedPayload {
  ministryName: string;
  date: string;
  time: string;
  eventName?: string;
  location?: string;
}

export interface ScheduleReminderPayload {
  ministryName: string;
  date: string;
  time: string;
  eventName?: string;
}

export interface ScheduleUpdatedPayload {
  ministryName: string;
  date?: string;
  time?: string;
  changeDescription?: string;
}

export interface ScheduleCancelledPayload {
  ministryName: string;
  date: string;
  reason?: string;
}

export interface MinistryInvitePayload {
  ministryName: string;
  inviterName: string;
  churchName: string;
}

export interface MinistryAnnouncementPayload {
  ministryName: string;
  title: string;
  body: string;
}

export interface CellAnnouncementPayload {
  cellName: string;
  title: string;
  body: string;
}

export interface GeneralAnnouncementPayload {
  title: string;
  body: string;
  churchName?: string;
}

export interface AvailabilityRequestPayload {
  period: string;
  deadline?: string;
  requesterName?: string;
}

export interface WelcomePayload {
  memberName: string;
  churchName: string;
  loginUrl?: string;
}

export interface PasswordResetPayload {
  memberName: string;
  resetUrl: string;
  churchName?: string;
}

export type NotificationPayload =
  | ScheduleAssignedPayload
  | ScheduleReminderPayload
  | ScheduleUpdatedPayload
  | ScheduleCancelledPayload
  | MinistryInvitePayload
  | MinistryAnnouncementPayload
  | CellAnnouncementPayload
  | GeneralAnnouncementPayload
  | AvailabilityRequestPayload
  | WelcomePayload
  | PasswordResetPayload;

// ─── Send input ───────────────────────────────────────────────────────────────

export interface SendNotificationInput {
  userId: string;
  channels: NotificationChannel[];
  type: NotificationType;
  payload: NotificationPayload;
  /** Override recipient — skip user lookup (e.g. transactional) */
  overrideTo?: {
    phone?: string;
    email?: string;
    name?: string;
  };
}

// ─── Channel result ───────────────────────────────────────────────────────────

export type NotificationStatus = "sent" | "failed" | "skipped" | "pending";

export interface ChannelResult {
  status: NotificationStatus;
  messageId?: string;
  error?: string;
}

export interface SendNotificationResult {
  success: boolean;
  sms?: ChannelResult;
  email?: ChannelResult;
  whatsapp?: ChannelResult;
  push?: ChannelResult;
  errors: string[];
}

// ─── Log row (mirrors notifications_log table) ────────────────────────────────

export interface NotificationLogRow {
  id?: string;
  user_id: string;
  type: string;
  channels: string[];
  sms_status?: NotificationStatus;
  email_status?: NotificationStatus;
  sms_error?: string;
  email_error?: string;
  payload: Record<string, unknown>;
  created_at?: string;
  sent_at?: string;
}
