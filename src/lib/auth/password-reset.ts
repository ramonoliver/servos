import { createHash, randomBytes } from "crypto";

const PASSWORD_RESET_TTL_MINUTES = 60;

export function createPasswordResetToken() {
  return randomBytes(32).toString("hex");
}

export function hashPasswordResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function getPasswordResetExpiryDate() {
  return new Date(Date.now() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000).toISOString();
}

export function isPasswordResetExpired(expiresAt?: string | null) {
  if (!expiresAt) return true;
  return new Date(expiresAt).getTime() <= Date.now();
}
