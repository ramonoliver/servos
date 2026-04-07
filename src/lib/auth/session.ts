import type { Session, User } from "@/types";

const SESSION_KEY = "servos_session";
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

export function createSession(user: User, token?: string): Session {
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
  if (typeof window !== "undefined") {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
  return session;
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: Session = JSON.parse(raw);
    if (session.expires_at < Date.now()) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_KEY);
    void fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
  }
}

export function updateSession(updates: Partial<Session>): void {
  const current = getSession();
  if (!current) return;
  const updated = { ...current, ...updates };
  if (typeof window !== "undefined") {
    localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
  }
}
