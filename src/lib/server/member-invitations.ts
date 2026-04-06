import { sendWhatsAppInvite, sendWelcomeEmail } from "@/lib/email/send";
import {
  buildWhatsAppInvitePreview,
  createInviteTrackingToken,
  getInviteOpenTrackingUrl,
} from "@/lib/invitations";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { genId } from "@/lib/utils/helpers";

type DeliveryInput = {
  to: string;
  phone?: string | null;
  memberName: string;
  churchName: string;
  tempPassword: string;
  userId?: string;
  churchId?: string;
  invitedByUserId?: string | null;
};

export async function deliverMemberInvitation(input: DeliveryInput) {
  const { to, phone, memberName, churchName, tempPassword, userId, churchId, invitedByUserId } = input;
  const now = new Date().toISOString();
  const trackingToken = createInviteTrackingToken();
  let trackingEnabled = Boolean(userId && churchId);
  let invitationId: string | null = null;

  if (trackingEnabled) {
    try {
      const supabase = getSupabaseServerClient();
      invitationId = genId();

      const { error } = await supabase.from("member_invitations").insert({
        id: invitationId,
        church_id: churchId,
        user_id: userId,
        invited_by_user_id: invitedByUserId || null,
        email: to,
        phone: phone || null,
        tracking_token: trackingToken,
        email_status: "pending",
        whatsapp_status: phone ? "pending" : "skipped",
        sent_at: now,
        created_at: now,
      });

      if (error) {
        trackingEnabled = false;
        invitationId = null;
        console.error("Erro ao registrar convite:", error);
      }
    } catch (error) {
      trackingEnabled = false;
      invitationId = null;
      console.error("Erro ao preparar tracking do convite:", error);
    }
  }

  let emailStatus: "sent" | "failed" = "sent";
  let emailError: string | null = null;

  try {
    await sendWelcomeEmail({
      to,
      memberName,
      churchName,
      tempPassword,
      trackingPixelUrl: trackingEnabled
        ? getInviteOpenTrackingUrl(trackingToken)
        : undefined,
    });
  } catch (error) {
    emailStatus = "failed";
    emailError = error instanceof Error ? error.message : "Falha ao enviar email";
  }

  const whatsapp = await sendWhatsAppInvite({
    to: phone || "",
    memberName,
    churchName,
    tempPassword,
    email: to,
  });

  if (trackingEnabled && invitationId) {
    const supabase = getSupabaseServerClient();
    await supabase
      .from("member_invitations")
      .update({
        email_status: emailStatus,
        email_error: emailError,
        whatsapp_status: whatsapp.status,
        whatsapp_error: whatsapp.error,
      })
      .eq("id", invitationId);
  }

  return {
    success: emailStatus === "sent" || whatsapp.status === "sent",
    invitationId,
    trackingEnabled,
    email: {
      status: emailStatus,
      error: emailError,
    },
    whatsapp: {
      ...whatsapp,
      preview:
        whatsapp.status === "skipped"
          ? buildWhatsAppInvitePreview({
              memberName,
              churchName,
              tempPassword,
              email: to,
            })
          : null,
    },
  };
}
