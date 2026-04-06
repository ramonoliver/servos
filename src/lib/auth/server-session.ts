import { createHmac, timingSafeEqual } from "crypto";
import type { Session, User } from "@/types";

export const AUTH_COOKIE_NAME = "servos_auth";
const SEVEN_DAYS = 7 * 24 * 60 * 60;

function getSessionSecret() {
  return (
    process.env.AUTH_SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "servos-dev-session-secret"
  );
}

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

export function createSessionPayload(user: User): Session {
  return {
    user_id: user.id,
    church_id: user.church_id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatar_color: user.avatar_color,
    expires_at: Date.now() + SEVEN_DAYS * 1000,
  };
}

export function encodeSessionToken(session: Session) {
  const payload = toBase64Url(JSON.stringify(session));
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export function decodeSessionToken(token?: string | null): Session | null {
  if (!token) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expectedSignature = sign(payload);
  const receivedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    receivedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(receivedBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const session = JSON.parse(fromBase64Url(payload)) as Session;
    if (!session?.user_id || !session?.church_id || session.expires_at < Date.now()) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function buildSessionCookie(token: string) {
  return `${AUTH_COOKIE_NAME}=${token}; Path=/; Max-Age=${SEVEN_DAYS}; HttpOnly; SameSite=Lax`;
}

export function buildClearSessionCookie() {
  return `${AUTH_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`;
}

export function getSessionFromCookieHeader(cookieHeader?: string | null) {
  if (!cookieHeader) return null;
  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${AUTH_COOKIE_NAME}=`));

  if (!cookie) return null;
  return decodeSessionToken(cookie.slice(AUTH_COOKIE_NAME.length + 1));
}
