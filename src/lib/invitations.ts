import { randomBytes } from "crypto";

export type InviteDeliveryStatus = "sent" | "failed" | "skipped";

export function createInviteTrackingToken() {
  return randomBytes(24).toString("hex");
}

export function getAppBaseUrl() {
  const explicitUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  const vercelUrl = process.env.VERCEL_URL;

  if (explicitUrl) {
    return explicitUrl.startsWith("http") ? explicitUrl : `https://${explicitUrl}`;
  }

  if (vercelUrl) {
    return `https://${vercelUrl}`;
  }

  return "http://localhost:3000";
}

export function getInviteOpenTrackingUrl(token: string) {
  return `${getAppBaseUrl()}/api/member-invitations/open/${token}`;
}

export function normalizePhoneForWhatsApp(phone: string) {
  const digits = phone.replace(/\D/g, "");

  if (!digits) return "";
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith("55")) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

export function buildWhatsAppInvitePreview(params: {
  memberName: string;
  churchName: string;
  tempPassword: string;
  email: string;
}) {
  const { memberName, churchName, tempPassword, email } = params;

  return [
    `Oi, ${memberName}!`,
    `Voce foi convidado(a) para acessar o Servos em ${churchName}.`,
    `Login: ${email}`,
    `Senha temporaria: ${tempPassword}`,
    "No primeiro acesso, altere sua senha.",
  ].join("\n");
}

export function formatInviteOpenedAt(openedAt?: string | null) {
  if (!openedAt) return "";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(openedAt));
}

export function formatInviteDate(value?: string | null) {
  if (!value) return "";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatPhoneInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}
