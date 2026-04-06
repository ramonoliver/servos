"use client";

import { useState } from "react";
import Link from "next/link";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setStatus("error");
        setMessage(data?.error || "Não foi possível processar sua solicitação.");
        return;
      }

      setStatus("success");
      setMessage("Se existir uma conta com esse email, enviamos um link seguro para redefinir a senha.");
    } catch (error) {
      console.error("Erro ao solicitar redefinição:", error);
      setStatus("error");
      setMessage("Não foi possível processar sua solicitação.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-[420px] bg-white rounded-2xl border border-border-soft shadow-lg p-8">
        <h1 className="font-display text-2xl mb-2 text-center">Esqueci minha senha</h1>
        <p className="text-sm text-ink-muted text-center mb-6">
          Informe seu email para receber um link seguro de redefinição.
        </p>

        <div className="rounded-xl border border-brand-light bg-brand-glow px-4 py-3 text-xs text-ink-muted leading-relaxed mb-4">
          O link expira em pouco tempo por segurança. Se o email não chegar, confira sua caixa de spam ou solicite novamente.
        </div>

        {message && (
          <div
            className={`text-sm px-4 py-3 rounded-[10px] mb-4 border ${
              status === "success"
                ? "bg-success-light text-success border-success/10"
                : "bg-danger-light text-danger border-danger/10"
            }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="input-label">Email</label>
            <input
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>

          <button type="submit" disabled={status === "loading"} className="btn btn-primary w-full py-3">
            {status === "loading" ? "Enviando..." : "Receber link de redefinição"}
          </button>
        </form>

        <div className="mt-5 text-center">
          <Link href="/login" className="text-sm font-semibold text-brand hover:underline">
            Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  );
}
