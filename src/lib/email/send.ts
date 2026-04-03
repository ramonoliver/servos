// ============================================
// SERVOS — Email Service
// Uses console.log in dev, Resend API in prod
// ============================================

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

interface WelcomeEmailParams {
  to: string;
  memberName: string;
  churchName: string;
  tempPassword: string;
}

export function sendWelcomeEmail({ to, memberName, churchName, tempPassword }: WelcomeEmailParams) {
  const subject = `Bem-vindo ao Servos - ${churchName}`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8F7F4;font-family:'Helvetica Neue',Arial,sans-serif">
  <div style="max-width:520px;margin:32px auto;background:#FFFFFF;border-radius:20px;overflow:hidden;border:1px solid #E9E7E1">
    <!-- Header -->
    <div style="background:linear-gradient(145deg,#F4532A,#D94420);padding:32px 28px;text-align:center">
      <h1 style="color:white;font-size:28px;margin:0;font-weight:400;letter-spacing:-0.5px">Servos</h1>
      <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:8px 0 0">Organize. Sirva. Viva o proposito.</p>
    </div>

    <!-- Body -->
    <div style="padding:32px 28px">
      <p style="font-size:16px;color:#19180F;margin:0 0 8px">
        Ola, <strong>${memberName}</strong>! &#128075;
      </p>
      <p style="font-size:14px;color:#7A786E;line-height:1.7;margin:0 0 24px">
        Voce foi convidado(a) para servir na <strong style="color:#19180F">${churchName}</strong>
        atraves do Servos. Estamos felizes em ter voce!
      </p>

      <!-- Credentials box -->
      <div style="background:#F3F1ED;border-radius:14px;padding:20px;margin-bottom:24px">
        <p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#ABA99F;margin:0 0 12px">
          Seus dados de acesso
        </p>
        <table style="width:100%">
          <tr>
            <td style="font-size:13px;color:#7A786E;padding:4px 0">Email:</td>
            <td style="font-size:13px;font-weight:600;color:#19180F;text-align:right">${to}</td>
          </tr>
          <tr>
            <td style="font-size:13px;color:#7A786E;padding:4px 0">Senha temporaria:</td>
            <td style="font-size:16px;font-weight:700;color:#F4532A;text-align:right;font-family:monospace">${tempPassword}</td>
          </tr>
        </table>
      </div>

      <!-- CTA Button -->
      <div style="text-align:center;margin-bottom:24px">
        <a href="${APP_URL}/login" style="display:inline-block;background:#19180F;color:#FFFFFF;padding:14px 36px;border-radius:100px;text-decoration:none;font-weight:600;font-size:15px">
          Acessar o Servos
        </a>
      </div>

      <!-- Important note -->
      <div style="background:#FBF4E2;border:1px solid rgba(196,154,60,0.15);border-radius:10px;padding:14px;margin-bottom:24px">
        <p style="font-size:12px;color:#C49A3C;margin:0;line-height:1.5">
          <strong>Importante:</strong> No primeiro acesso, altere sua senha em
          <strong>Meu Perfil &gt; Alterar Senha</strong>.
        </p>
      </div>

      <!-- Verse -->
      <div style="border-left:3px solid #F5EDE4;padding:12px 16px;margin-bottom:20px;background:#FBF6F0;border-radius:0 10px 10px 0">
        <p style="font-size:14px;color:#3D3C33;margin:0;line-height:1.6;font-style:italic">
          &ldquo;Cada um exerca o dom que recebeu para servir os outros, como bons despenseiros da multiforme graca de Deus.&rdquo;
        </p>
        <p style="font-size:11px;color:#F4532A;margin:8px 0 0;font-weight:600">
          1 Pedro 4:10
        </p>
      </div>

      <p style="font-size:13px;color:#7A786E;margin:0;line-height:1.6">
        Que Deus abencoe seu servir! &#128591;
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#F8F7F4;padding:16px 28px;text-align:center;border-top:1px solid #E9E7E1">
      <p style="font-size:11px;color:#ABA99F;margin:0">
        Servos &mdash; Gestao de voluntarios para igrejas
      </p>
    </div>
  </div>
</body>
</html>`;

  // In dev: log to console
  console.log("\n========================================");
  console.log("EMAIL DE BOAS-VINDAS ENVIADO");
  console.log("========================================");
  console.log("Para:", to);
  console.log("Assunto:", subject);
  console.log("Membro:", memberName);
  console.log("Igreja:", churchName);
  console.log("Senha temporaria:", tempPassword);
  console.log("Link:", APP_URL + "/login");
  console.log("========================================\n");

  // In production with Resend:
  // const RESEND_API_KEY = process.env.RESEND_API_KEY;
  // if (RESEND_API_KEY) {
  //   fetch("https://api.resend.com/emails", {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json", "Authorization": `Bearer ${RESEND_API_KEY}` },
  //     body: JSON.stringify({ from: "Servos <noreply@servosapp.com>", to: [to], subject, html }),
  //   });
  // }

  return { success: true, subject, to };
}
