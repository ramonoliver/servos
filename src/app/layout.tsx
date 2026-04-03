import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Servos - Organize. Sirva. Viva o proposito.",
  description: "Sistema de gestao de voluntarios para igrejas.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-bg text-ink">{children}</body>
    </html>
  );
}
