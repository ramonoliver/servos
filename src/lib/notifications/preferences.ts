/**
 * preferences.ts
 * Notification preferences — per-user opt-in/opt-out controls.
 * Stored in the `notification_preferences` column on the `users` table
 * (JSONB). Falls back to sensible defaults if not set.
 */

import { NotificationType } from "./notification-types";
import type { NotificationChannel } from "./notification-types";

// ─── Structure ────────────────────────────────────────────────────────────────

export interface NotificationPreferences {
  /** Master switches per channel */
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
  push: boolean;

  /** Per-type opt-outs */
  scheduleReminders: boolean;
  ministryInvites: boolean;
  ministryAnnouncements: boolean;
  cellAnnouncements: boolean;
  generalAnnouncements: boolean;
  availabilityRequests: boolean;
}

export const DEFAULT_PREFERENCES: NotificationPreferences = {
  email: true,
  sms: true,
  whatsapp: false,
  push: true,

  scheduleReminders: true,
  ministryInvites: true,
  ministryAnnouncements: true,
  cellAnnouncements: true,
  generalAnnouncements: true,
  availabilityRequests: true,
};

// ─── Merge with defaults ──────────────────────────────────────────────────────

/**
 * Merges stored preferences with defaults so missing keys are always populated.
 */
export function mergePreferences(
  stored: Partial<NotificationPreferences> | null | undefined
): NotificationPreferences {
  return { ...DEFAULT_PREFERENCES, ...(stored ?? {}) };
}

// ─── Guard functions ──────────────────────────────────────────────────────────

/**
 * Returns true if the user wants to receive this notification type at all
 * (regardless of channel).
 */
export function isTypeAllowed(
  prefs: NotificationPreferences,
  type: NotificationType
): boolean {
  switch (type) {
    case NotificationType.SCHEDULE_ASSIGNED:
    case NotificationType.SCHEDULE_UPDATED:
    case NotificationType.SCHEDULE_CANCELLED:
      return true; // always send — critical operational info
    case NotificationType.SCHEDULE_REMINDER:
      return prefs.scheduleReminders;
    case NotificationType.MINISTRY_INVITE:
      return prefs.ministryInvites;
    case NotificationType.MINISTRY_ANNOUNCEMENT:
      return prefs.ministryAnnouncements;
    case NotificationType.CELL_ANNOUNCEMENT:
      return prefs.cellAnnouncements;
    case NotificationType.GENERAL_ANNOUNCEMENT:
      return prefs.generalAnnouncements;
    case NotificationType.AVAILABILITY_REQUEST:
      return prefs.availabilityRequests;
    case NotificationType.WELCOME:
    case NotificationType.PASSWORD_RESET:
      return true; // transactional — never skip
    default:
      return true;
  }
}

/**
 * Filters the requested channels down to the ones the user has enabled.
 */
export function filterAllowedChannels(
  requested: NotificationChannel[],
  prefs: NotificationPreferences
): NotificationChannel[] {
  const channelEnabled: Record<NotificationChannel, boolean> = {
    email:    prefs.email,
    sms:      prefs.sms,
    whatsapp: prefs.whatsapp,
    push:     prefs.push,
  };
  return requested.filter((ch) => channelEnabled[ch] === true);
}
