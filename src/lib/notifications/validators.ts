/**
 * validators.ts
 * Input validation helpers for the notifications layer.
 * Pure functions — no side effects, no imports from providers.
 */

// ─── Phone ────────────────────────────────────────────────────────────────────

const E164_REGEX = /^\+[1-9]\d{6,14}$/;

/**
 * Validates that a phone number is already in E.164 format.
 */
export function isValidE164(phone: string): boolean {
  return E164_REGEX.test(phone.trim());
}

/**
 * Normalizes a Brazilian phone number to E.164.
 * Accepts formats like:
 *   (85) 99999-9999
 *   85999999999
 *   +5585999999999
 *
 * Returns null if normalization is not possible.
 */
export function normalizePhoneNumber(raw: string | null | undefined): string | null {
  if (!raw) return null;

  // Strip everything except digits and leading +
  const cleaned = raw.trim().replace(/[\s\-().]/g, "");

  // Already E.164
  if (E164_REGEX.test(cleaned)) return cleaned;

  const digitsOnly = cleaned.replace(/\D/g, "");

  // Brazilian mobile: 11 digits → prepend country code
  if (digitsOnly.length === 11) return `+55${digitsOnly}`;

  // Brazilian with country code: 13 digits starting with 55
  if (digitsOnly.length === 13 && digitsOnly.startsWith("55")) return `+${digitsOnly}`;

  // 10-digit landline fallback
  if (digitsOnly.length === 10) return `+55${digitsOnly}`;

  return null;
}

// ─── Email ────────────────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return EMAIL_REGEX.test(email.trim().toLowerCase());
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// ─── Payload ─────────────────────────────────────────────────────────────────

/**
 * Sanitizes a string to prevent template injection / HTML injection.
 */
export function sanitizeString(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .trim();
}

/**
 * Sanitizes all string values in a plain record shallowly.
 */
export function sanitizePayload(
  payload: Record<string, unknown>
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(payload).map(([k, v]) => [
      k,
      typeof v === "string" ? sanitizeString(v) : v,
    ])
  );
}
