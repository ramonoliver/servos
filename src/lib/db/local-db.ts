"use client";

import { getSeedData } from "./seed-data";
import { verifyPassword } from "@/lib/auth/password";
import type { User } from "@/types";

const STORAGE_KEY = "servos_db";

type TableName = keyof ReturnType<typeof getSeedData>;

class LocalDB {
  private data: Record<string, any[]> | null = null;

  private load(): Record<string, any[]> {
    if (typeof window === "undefined") return getSeedData() as any;
    if (this.data) return this.data;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.data = JSON.parse(stored);
        return this.data!;
      }
    } catch {}
    this.data = JSON.parse(JSON.stringify(getSeedData()));
    this.save();
    return this.data!;
  }

  private save(): void {
    if (typeof window === "undefined") return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data)); } catch {}
  }

  reset(): void {
    this.data = JSON.parse(JSON.stringify(getSeedData()));
    this.save();
  }

  // === CRUD ===

  getAll<T = any>(table: string): T[] {
    return (this.load()[table] || []) as T[];
  }

  getById<T = any>(table: string, id: string): T | null {
    return this.getAll<T>(table).find((r: any) => r.id === id) || null;
  }

  getWhere<T = any>(table: string, filter: Record<string, any>): T[] {
    return this.getAll<T>(table).filter((r: any) => {
      for (const [k, v] of Object.entries(filter)) {
        if (r[k] !== v) return false;
      }
      return true;
    });
  }

  insert<T = any>(table: string, record: any): T {
    const data = this.load();
    if (!record.id) record.id = "id_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
    if (!record.created_at) record.created_at = new Date().toISOString();
    if (!data[table]) data[table] = [];
    data[table].push(record);
    this.save();
    return record as T;
  }

  update<T = any>(table: string, id: string, updates: Partial<T>): T | null {
    const data = this.load();
    const arr = data[table] || [];
    const idx = arr.findIndex((r: any) => r.id === id);
    if (idx === -1) return null;
    arr[idx] = { ...arr[idx], ...updates };
    this.save();
    return arr[idx] as T;
  }

  delete(table: string, id: string): boolean {
    const data = this.load();
    if (!data[table]) return false;
    data[table] = data[table].filter((r: any) => r.id !== id);
    this.save();
    return true;
  }

  deleteWhere(table: string, filter: Record<string, any>): number {
    const data = this.load();
    if (!data[table]) return 0;
    const before = data[table].length;
    data[table] = data[table].filter((r: any) => {
      for (const [k, v] of Object.entries(filter)) {
        if (r[k] === v) return false;
      }
      return true;
    });
    this.save();
    return before - data[table].length;
  }

  // === Auth helpers ===

  getUserByEmail(email: string): User | null {
    return this.getAll<User>("users").find(u => u.email === email.toLowerCase()) || null;
  }

  verifyUserPassword(email: string, password: string): User | null {
    const user = this.getUserByEmail(email);
    if (!user) return null;
    if (!verifyPassword(password, user.password_hash)) return null;
    return user;
  }
}

// Singleton
let instance: LocalDB | null = null;
export function getDB(): LocalDB {
  if (!instance) instance = new LocalDB();
  return instance;
}
