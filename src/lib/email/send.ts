import nodemailer from "nodemailer";
import {
  buildWhatsAppInvitePreview,
  normalizePhoneForWhatsApp,
} from "@/lib/invitations";

type WelcomeEmailInput = {
  to: string;
  memberName: string;
  churchName: string;
  tempPassword: string;
  trackingPixelUrl?: string;
};

type ScheduleReminderInput = {
  to: string;
  memberName: string;
  eventName: string;
  date: string;
  time: string;
  departmentName: string;
};

type PasswordResetInput = {
  to: string;
  memberName: string;
  resetUrl: string;
  churchName?: string;
};

const host = process.env.BREVO_SMTP_HOST || "smtp-relay.brevo.com";
const port = Number(process.env.BREVO_SMTP_PORT || 587);
const user = process.env.BREVO_SMTP_USER;
const pass = process.env.BREVO_SMTP_PASS;
const from = process.env.EMAIL_FROM || "Servos <noreply@seudominio.com>";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

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
  trackingPixelUrl,
}: WelcomeEmailInput) {
  const transporter = getTransporter();
  const safeMemberName = escapeHtml(memberName);
  const safeChurchName = escapeHtml(churchName);
  const safeEmail = escapeHtml(to);
  const safePassword = escapeHtml(tempPassword);

  const html = `
    <div style="margin:0;padding:24px;background:#f4efe7;font-family:Georgia,'Times New Roman',serif;color:#24170f;">
      <div style="max-width:640px;margin:0 auto;background:#fffdf8;border:1px solid #eadfcd;border-radius:28px;overflow:hidden;box-shadow:0 20px 50px rgba(67,41,19,.08);">
        <div style="padding:32px 32px 24px;background:linear-gradient(135deg,#f4e4c9 0%,#f7efe3 55%,#fffdf8 100%);border-bottom:1px solid #eadfcd;">
          <div style="font-size:12px;letter-spacing:.28em;text-transform:uppercase;color:#8a6441;font-family:Arial,sans-serif;font-weight:700;">Servos</div>
          <h1 style="margin:14px 0 10px;font-size:34px;line-height:1.05;font-weight:700;color:#24170f;">Seu convite chegou</h1>
          <p style="margin:0;font-size:16px;line-height:1.7;color:#5e4632;">${safeMemberName}, voce foi convidado(a) para entrar no Servos e servir com <strong>${safeChurchName}</strong>.</p>
        </div>

        <div style="padding:28px 32px 10px;">
          <div style="background:#2f241c;border-radius:24px;padding:24px 24px 20px;color:#fff7ef;">
            <div style="font-size:11px;letter-spacing:.22em;text-transform:uppercase;opacity:.72;font-family:Arial,sans-serif;font-weight:700;">Acesso inicial</div>
            <div style="margin-top:16px;">
              <div style="font-size:12px;opacity:.72;margin-bottom:6px;font-family:Arial,sans-serif;">Email</div>
              <div style="font-size:18px;font-weight:700;line-height:1.4;">${safeEmail}</div>
            </div>
            <div style="margin-top:18px;">
              <div style="font-size:12px;opacity:.72;margin-bottom:6px;font-family:Arial,sans-serif;">Senha temporaria</div>
              <div style="display:inline-block;background:#fff7ef;color:#2f241c;padding:10px 14px;border-radius:14px;font-size:24px;font-weight:700;letter-spacing:.08em;">${safePassword}</div>
            </div>
          </div>

          <div style="padding:22px 2px 4px;">
            <p style="margin:0 0 10px;font-size:15px;line-height:1.8;color:#4d3a2b;">No primeiro acesso, troque sua senha para manter a conta segura.</p>
            <p style="margin:0;font-size:15px;line-height:1.8;color:#4d3a2b;">Se voce recebeu este email por engano, basta ignorar a mensagem.</p>
          </div>
        </div>

        <div style="padding:18px 32px 28px;border-top:1px solid #eadfcd;background:#fffcf6;">
          <p style="margin:0;font-size:13px;line-height:1.7;color:#8a6441;font-family:Arial,sans-serif;">Que Deus abencoe seu servir. Nos vemos no app.</p>
        </div>
      </div>
      ${
        trackingPixelUrl
          ? `<img src="${trackingPixelUrl}" alt="" width="1" height="1" style="display:block;width:1px;height:1px;border:0;opacity:0;" />`
          : ""
      }
    </div>
  `;

  return transporter.sendMail({
    from,
    to,
    subject: `Seu acesso ao ${churchName} no Servos`,
    html,
    text: [
      `Ola, ${memberName}!`,
      `Voce foi convidado(a) para acessar o Servos em ${churchName}.`,
      `Email: ${to}`,
      `Senha temporaria: ${tempPassword}`,
      "No primeiro acesso, altere sua senha.",
    ].join("\n"),
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

export async function sendPasswordResetEmail({
  to,
  memberName,
  resetUrl,
  churchName,
}: PasswordResetInput) {
  const transporter = getTransporter();
  const safeMemberName = escapeHtml(memberName);
  const safeChurchName = churchName ? escapeHtml(churchName) : "sua igreja";
  const safeResetUrl = escapeHtml(resetUrl);

  const html = `
    <div style="margin:0;padding:24px;background:#f4efe7;font-family:Georgia,'Times New Roman',serif;color:#24170f;">
      <div style="max-width:640px;margin:0 auto;background:#fffdf8;border:1px solid #eadfcd;border-radius:28px;overflow:hidden;box-shadow:0 20px 50px rgba(67,41,19,.08);">
        <div style="padding:32px;background:linear-gradient(135deg,#f4e4c9 0%,#f7efe3 55%,#fffdf8 100%);border-bottom:1px solid #eadfcd;">
          <div style="font-size:12px;letter-spacing:.28em;text-transform:uppercase;color:#8a6441;font-family:Arial,sans-serif;font-weight:700;">Servos</div>
          <h1 style="margin:14px 0 10px;font-size:34px;line-height:1.05;font-weight:700;color:#24170f;">Redefina sua senha</h1>
          <p style="margin:0;font-size:16px;line-height:1.7;color:#5e4632;">${safeMemberName}, recebemos um pedido para redefinir o seu acesso em <strong>${safeChurchName}</strong>.</p>
        </div>
        <div style="padding:28px 32px;">
          <div style="background:#2f241c;border-radius:24px;padding:24px;color:#fff7ef;">
            <div style="font-size:12px;opacity:.72;margin-bottom:10px;font-family:Arial,sans-serif;">Use o botao abaixo para criar uma nova senha com seguranca.</div>
            <a href="${safeResetUrl}" style="display:inline-block;background:#fff7ef;color:#2f241c;padding:12px 18px;border-radius:14px;font-size:15px;font-weight:700;text-decoration:none;">Redefinir senha</a>
          </div>
          <p style="margin:18px 0 0;font-size:15px;line-height:1.8;color:#4d3a2b;">Se o botao nao funcionar, copie este link no navegador:</p>
          <p style="margin:8px 0 0;font-size:14px;line-height:1.7;color:#8a6441;word-break:break-all;">${safeResetUrl}</p>
          <p style="margin:14px 0 0;font-size:15px;line-height:1.8;color:#4d3a2b;">Esse link expira em pouco tempo. Se voce nao solicitou a alteracao, ignore este email.</p>
        </div>
      </div>
    </div>
  `;

  return transporter.sendMail({
    from,
    to,
    subject: "Redefinicao de senha - Servos",
    html,
    text: [
      `Ola, ${memberName}!`,
      `Recebemos um pedido para redefinir seu acesso em ${churchName || "sua igreja"}.`,
      `Abra este link para redefinir sua senha: ${resetUrl}`,
      "Se voce nao solicitou a alteracao, ignore esta mensagem.",
    ].join("\n"),
  });
}

type WhatsAppInviteInput = {
  to: string;
  memberName: string;
  churchName: string;
  tempPassword: string;
  email: string;
};

export async function sendWhatsAppInvite({
  to,
  memberName,
  churchName,
  tempPassword,
  email,
}: WhatsAppInviteInput): Promise<{ status: "sent" | "failed" | "skipped"; error: string | null }> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME;
  const languageCode = process.env.WHATSAPP_TEMPLATE_LANGUAGE_CODE || "pt_BR";
  const normalizedPhone = normalizePhoneForWhatsApp(to);

  if (!normalizedPhone) {
    return { status: "skipped", error: "Membro sem telefone para WhatsApp." };
  }

  if (!accessToken || !phoneNumberId || !templateName) {
    return {
      status: "skipped",
      error: "WhatsApp Cloud API nao configurada. Defina WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID e WHATSAPP_TEMPLATE_NAME.",
    };
  }

  const response = await fetch(
    `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: normalizedPhone,
        type: "template",
        template: {
          name: templateName,
          language: { code: languageCode },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: memberName },
                { type: "text", text: churchName },
                { type: "text", text: email },
                { type: "text", text: tempPassword },
              ],
            },
          ],
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    return {
      status: "failed",
      error: errorText || "Falha ao enviar WhatsApp.",
    };
  }

  return { status: "sent", error: null };
}
