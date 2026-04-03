"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getDB } from "@/lib/db/local-db";
import { getSession, clearSession, createSession } from "@/lib/auth/session";
import { can, type Action } from "@/lib/auth/permissions";
import type { User, Church, Department, Session } from "@/types";

interface AppContextType {
  user: User;
  session: Session;
  church: Church;
  departments: Department[];
  userDeptIds: string[];
  toast: (msg: string) => void;
  canDo: (action: Action, deptId?: string) => boolean;
  refresh: () => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSessionState] = useState<Session | null>(null);
  const [church, setChurch] = useState<Church | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [userDeptIds, setUserDeptIds] = useState<string[]>([]);
  const [toastMsg, setToastMsg] = useState("");
  const [loading, setLoading] = useState(true);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3200);
  }, []);

  const refresh = useCallback(() => {
    const s = getSession();
    if (!s) { router.replace("/login"); return; }
    const db = getDB();
    const u = db.getById<User>("users", s.user_id);
    if (!u) { clearSession(); router.replace("/login"); return; }
    const c = db.getById<Church>("churches", u.church_id);
    const depts = db.getWhere<Department>("departments", { church_id: u.church_id });
    // Departments where this user is leader or co-leader
    const leadDeptIds = depts.filter(d =>
      (d.leader_ids || []).includes(u.id) || (d.co_leader_ids || []).includes(u.id)
    ).map(d => d.id);
    setUser(u);
    setSessionState(s);
    setChurch(c!);
    setDepartments(depts);
    setUserDeptIds(leadDeptIds);
    setLoading(false);
  }, [router]);

  const logout = useCallback(() => {
    clearSession();
    router.replace("/login");
  }, [router]);

  const canDo = useCallback((action: Action, deptId?: string) => {
    if (!user) return false;
    return can(user.role, action, { departmentId: deptId, userDepartmentIds: userDeptIds });
  }, [user, userDeptIds]);

  useEffect(() => { refresh(); }, [refresh]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-brand-deep animate-pulse" />
          <span className="font-display text-lg text-ink-muted">Carregando...</span>
        </div>
      </div>
    );
  }

  if (!user || !session || !church) return null;

  return (
    <AppContext.Provider value={{ user, session, church, departments, userDeptIds, toast, canDo, refresh, logout }}>
      {children}
      {/* Toast */}
      <div
        className="fixed bottom-7 left-1/2 z-50 pointer-events-none"
        style={{
          transform: `translateX(-50%) translateY(${toastMsg ? 0 : 80}px)`,
          opacity: toastMsg ? 1 : 0,
          transition: "all 0.4s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        <div className="bg-ink text-white px-6 py-3 rounded-full text-sm font-semibold shadow-lg whitespace-nowrap flex items-center gap-2">
          {toastMsg}
        </div>
      </div>
    </AppContext.Provider>
  );
}
