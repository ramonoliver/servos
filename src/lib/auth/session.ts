import type { Session, User } from "@/types";

const SESSION_KEY = "servos_session";
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

export function createSession(user: User, token?: string): Session {
  // Legacy shape kept for older call sites; auth is now cookie-based.
  const session: Session = {
    user_id: user.id,
    church_id: user.church_id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatar_color: user.avatar_color,
    photo_url: user.photo_url,
    token,
    expires_at: Date.now() + SEVEN_DAYS,
  };
  return session;
}

export function getSession(): Session | null {
  return null;
}

export function clearSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_KEY);
    void fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
  }
}

export function updateSession(updates: Partial<Session>): void {
  void updates;
}
