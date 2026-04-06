import { Suspense } from "react";
import ResetPasswordClient from "./reset-password-client";

export default function RedefinirSenhaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-bg px-4 text-sm text-ink-muted">Carregando...</div>}>
      <ResetPasswordClient />
    </Suspense>
  );
}
