import "server-only";
import { Resend } from "resend";

type WelcomeEmailInput = {
  to: string;
  memberName: string;
  churchName: string;
  tempPassword: string;
};

type ScheduleReminderInput = {
  to: string;
  memberName: string;
  eventName: string;
  date: string;
  time: string;
  departmentName: string;
};

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail({
  to,
  memberName,
  churchName,
  tempPassword,
}: WelcomeEmailInput) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY não configurada. E-mail não enviado.");
    return { data: null, error: "missing_api_key" };
  }

  const from = process.env.EMAIL_FROM || "Servos <onboarding@resend.dev>";

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
      <h2>Bem-vindo ao Servos</h2>
      <p>Olá, <strong>${memberName}</strong>!</p>
      <p>Você foi convidado para participar da igreja <strong>${churchName}</strong> no Servos.</p>
      <p>Seus dados de acesso:</p>
      <div style="background:#f3f4f6;padding:16px;border-radius:12px;">
        <p style="margin:0 0 8px;"><strong>E-mail:</strong> ${to}</p>
        <p style="margin:0;"><strong>Senha temporária:</strong> ${tempPassword}</p>
      </div>
      <p style="margin-top:16px;">No primeiro acesso, altere sua senha.</p>
      <p>Que Deus abençoe seu servir 🙏</p>
    </div>
  `;

  return resend.emails.send({
    from,
    to,
    subject: "Seu acesso ao Servos",
    html,
  });
}

export async function sendScheduleReminderEmail({
  to,
  memberName,
  eventName,
  date,
  time,
  departmentName,
}: ScheduleReminderInput) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY não configurada. E-mail não enviado.");
    return { data: null, error: "missing_api_key" };
  }

  const from = process.env.EMAIL_FROM || "Servos <onboarding@resend.dev>";

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
      <h2>Lembrete de Escala</h2>
      <p>Olá, <strong>${memberName}</strong>!</p>
      <p>Você está escalado para servir:</p>

      <div style="background:#f3f4f6;padding:16px;border-radius:12px;">
        <p style="margin:0 0 8px;"><strong>Evento:</strong> ${eventName}</p>
        <p style="margin:0 0 8px;"><strong>Data:</strong> ${date}</p>
        <p style="margin:0 0 8px;"><strong>Horário:</strong> ${time}</p>
        <p style="margin:0;"><strong>Ministério:</strong> ${departmentName}</p>
      </div>

      <p style="margin-top:16px;">Confirme sua presença no app 🙏</p>
      <p>Que Deus abençoe seu servir!</p>
    </div>
  `;

  return resend.emails.send({
    from,
    to,
    subject: "Lembrete de escala - Servos",
    html,
  });
}