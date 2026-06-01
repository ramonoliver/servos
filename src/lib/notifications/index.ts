/**
 * notifications/index.ts
 * Public API for the notifications module.
 * Only import from this file — never import providers directly.
 */

export { sendNotification } from "./send-notification";
export { NotificationType } from "./notification-types";
export type {
  NotificationChannel,
  NotificationPayload,
  NotificationStatus,
  SendNotificationInput,
  SendNotificationResult,
  ChannelResult,
  ScheduleAssignedPayload,
  ScheduleReminderPayload,
  ScheduleUpdatedPayload,
  ScheduleCancelledPayload,
  MinistryInvitePayload,
  MinistryAnnouncementPayload,
  CellAnnouncementPayload,
  GeneralAnnouncementPayload,
  AvailabilityRequestPayload,
  WelcomePayload,
  PasswordResetPayload,
} from "./notification-types";
export type { NotificationPreferences } from "./preferences";
export { DEFAULT_PREFERENCES, mergePreferences } from "./preferences";
