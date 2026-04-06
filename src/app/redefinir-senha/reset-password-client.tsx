"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResetPasswordClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setStatus("error");
        setMessage(data?.error || "Nao foi possivel redefinir sua senha.");
        return;
      }

      setStatus("success");
      setMessage("Senha redefinida com sucesso. Voce ja pode entrar.");
      setTimeout(() => router.push("/login"), 1200);
    } catch (error) {
      console.error("Erro ao redefinir senha:", error);
      setStatus("error");
      setMessage("Nao foi possivel redefinir sua senha.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-[440px] bg-white rounded-2xl border border-border-soft shadow-lg p-8">
        <h1 className="font-display text-2xl mb-2 text-center">Criar nova senha</h1>
        <p className="text-sm text-ink-muted text-center mb-6">
          Escolha uma senha nova para voltar a acessar sua conta.
        </p>

        <div className="rounded-xl border border-brand-light bg-brand-glow px-4 py-3 text-xs text-ink-muted leading-relaxed mb-4">
          Escolha uma senha facil de lembrar para voce e dificil de adivinhar para outras pessoas.
        </div>

        {!token ? (
          <div className="bg-danger-light text-danger text-sm px-4 py-3 rounded-[10px] border border-danger/10">
            Link invalido. Solicite uma nova redefinicao de senha.
          </div>
        ) : (
          <>
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
                <label className="input-label">Nova senha</label>
                <input
                  type={showPasswords ? "text" : "password"}
                  className="input-field"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimo de 6 caracteres"
                  minLength={6}
                  required
                />
              </div>

              <div>
                <label className="input-label">Confirmar senha</label>
                <input
                  type={showPasswords ? "text" : "password"}
                  className="input-field"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  minLength={6}
                  required
                />
              </div>

              <button
                type="button"
                onClick={() => setShowPasswords((current) => !current)}
                className="text-sm font-semibold text-brand hover:underline"
              >
                {showPasswords ? "Ocultar senha" : "Ver senha"}
              </button>

              <button type="submit" disabled={status === "loading"} className="btn btn-primary w-full py-3">
                {status === "loading" ? "Redefinindo..." : "Salvar nova senha"}
              </button>
            </form>
          </>
        )}

        <div className="mt-5 text-center">
          <Link href="/login" className="text-sm font-semibold text-brand hover:underline">
            Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  );
}
