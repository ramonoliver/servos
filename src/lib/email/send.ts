import nodemailer from "nodemailer";

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

const host = process.env.BREVO_SMTP_HOST || "smtp-relay.brevo.com";
const port = Number(process.env.BREVO_SMTP_PORT || 587);
const user = process.env.BREVO_SMTP_USER;
const pass = process.env.BREVO_SMTP_PASS;
const from = process.env.EMAIL_FROM || "Servos <noreply@seudominio.com>";

function getTransporter() {
  if (!user || !pass) {
    throw new Error("Brevo SMTP não configurado. Defina BREVO_SMTP_USER e BREVO_SMTP_PASS.");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

export async function sendWelcomeEmail({
  to,
  memberName,
  churchName,
  tempPassword,
}: WelcomeEmailInput) {
  const transporter = getTransporter();

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

  return transporter.sendMail({
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
  const transporter = getTransporter();

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

  return transporter.sendMail({
    from,
    to,
    subject: "Lembrete de escala - Servos",
    html,
  });
}