"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { createSession } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import Link from "next/link";
import type { User } from "@/types";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      const { data: user, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("email", normalizedEmail)
        .single();

      if (userError || !user) {
        setError("Email ou senha incorretos.");
        setLoading(false);
        return;
      }

      const isValidPassword = verifyPassword(password, user.password_hash);

      if (!isValidPassword) {
        setError("Email ou senha incorretos.");
        setLoading(false);
        return;
      }

      createSession(user as User);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Erro ao entrar.");
      setLoading(false);
      return;
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-[400px]">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand to-brand-deep flex items-center justify-center shadow-lg shadow-brand/30 mb-5">
            <svg viewBox="0 0 180 201" fill="none" width="30" height="34" xmlns="http://www.w3.org/2000/svg"><path d="M74.97 48.53c9.53.03 32.73 17.37 41.45 23.66 26.31 18.98 55.86 31.69 59.08 67.85 1.16 14.63-3.07 27.67-11.64 37.82-13.36 17.09-37.81 24.46-57.27 16.06-18.41-8.6-14.96-12.85-33.77-2.56C57.86 200.4 36.23 197.68 22.15 185.8c-5.7-5.86-9.68-10.73-11.54-19.78a38.26 38.26 0 014.23-30.06c2.34-3.74 6.94-6.88 11.24-7.8 10.76-2.07 20.59 8.98 28.06 14.38 7.74 5.69 15.62 10.67 22.83 15.45 9.06 5.87 20.07 10.68 31.87 8.05 12.34-3.03 23.13-13.74 25.18-27.28 4.01-25.93-21.95-35.26-38.77-47.17-10.62-7.58-39.16-21.78-27.39-37.97 3.2-3.97 5.9-5.24 10.65-6.09z" fill="rgba(255,255,255,.85)"/><path d="M49.85.99c7.01-1.42 16.82.42 23.6 2.83 7.04 2.51 16.36 9.86 23.94 8.67 7.83-1.17 14.56-8.2 22.63-9.87 12.3-3.2 25.7-2.72 36.94 3.52 9.52 5.29 16.59 14.09 19.69 23.53 4.97 17.27-2.97 47.83-27.4 40.58-3.61-1.07-8.72-5.67-12.07-7.84-13.39-8.72-26.22-18.36-39.88-26.65-9.6-5.83-22.83-8.68-33.79-5.86-8.82 2.43-15.46 8.38-19.78 15.64-4.73 8.67-4.78 16.61-2.16 24.83 5.67 15.16 24.97 23.2 37.52 31.06 10.28 7.14 40.88 21.48 28.6 37.38-2.57 3.29-6.34 5.42-10.49 5.94-9.79 1.19-24.89-12.07-32.24-17.01-13.06-8.86-25.9-18.72-38.67-28.05C-17.03 75.29-2.73 7.24 49.85.99z" fill="rgba(255,255,255,.85)"/></svg>
          </div>
          <h1 className="font-display text-3xl mb-1">Servos</h1>
          <p className="text-sm text-ink-muted">Organize. Sirva. Viva o proposito.</p>
        </div>

        <div className="bg-white rounded-2xl border border-border-soft shadow-lg p-8">
          <h2 className="font-display text-2xl text-center mb-1">Entrar</h2>
          <p className="text-sm text-ink-muted text-center mb-6">Acesse sua conta.</p>

          {error && (
            <div className="bg-danger-light text-danger text-sm px-4 py-3 rounded-[10px] mb-4 border border-danger/10">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="input-label">Email</label>
              <input
                type="email"
                className="input-field"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="mb-6">
              <label className="input-label">Senha</label>
              <input
                type="password"
                className="input-field"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary w-full py-3 text-base">
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <div className="flex items-center gap-4 my-5">
            <div className="flex-1 h-px bg-border-soft" />
            <span className="text-xs text-ink-faint">ou</span>
            <div className="flex-1 h-px bg-border-soft" />
          </div>

          <Link href="/cadastro" className="btn btn-secondary w-full py-3 text-base justify-center">
            Criar conta
          </Link>
        </div>

        <div className="mt-6 bg-brand-glow border border-brand-light rounded-xl px-5 py-4 text-center">
          <p className="text-xs font-semibold text-brand mb-1">Demo</p>
          <p className="text-xs text-ink-muted">
            Email: <strong className="text-ink">ramon@servosapp.com</strong> &middot; Senha:{" "}
            <strong className="text-ink">servos2026</strong>
          </p>
        </div>
      </div>
    </div>
  );
}