import { NextResponse } from "next/server";
import { generateTempPassword, hashPassword } from "@/lib/auth/password";
import { sendWhatsAppInvite, sendWelcomeEmail } from "@/lib/email/send";
import {
  buildWhatsAppInvitePreview,
  createInviteTrackingToken,
  getInviteOpenTrackingUrl,
} from "@/lib/invitations";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { genId } from "@/lib/utils/helpers";
import type { User } from "@/types";

type ResendInviteBody = {
  userId?: string;
  churchId?: string;
  churchName?: string;
  invitedByUserId?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as ResendInviteBody;
    const { userId, churchId, churchName, invitedByUserId } = body;

    if (!userId || !churchId || !churchName) {
      return NextResponse.json(
        { error: "userId, churchId and churchName are required." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();
    const { data: member, error: memberError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .eq("church_id", churchId)
      .maybeSingle();

    if (memberError) throw memberError;

    if (!member) {
      return NextResponse.json({ error: "Member not found." }, { status: 404 });
    }

    const typedMember = member as User;
    const tempPassword = generateTempPassword();
    const now = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("users")
      .update({
        password_hash: hashPassword(tempPassword),
        must_change_password: true,
      })
      .eq("id", typedMember.id);

    if (updateError) throw updateError;

    const trackingToken = createInviteTrackingToken();
    const invitationId = genId();
    let trackingEnabled = true;

    const { error: inviteInsertError } = await supabase
      .from("member_invitations")
      .insert({
        id: invitationId,
        church_id: churchId,
        user_id: typedMember.id,
        invited_by_user_id: invitedByUserId || null,
        email: typedMember.email,
        phone: typedMember.phone || null,
        tracking_token: trackingToken,
        email_status: "pending",
        whatsapp_status: typedMember.phone ? "pending" : "skipped",
        sent_at: now,
        created_at: now,
      });

    if (inviteInsertError) {
      trackingEnabled = false;
      console.error("Erro ao registrar convite reenviado:", inviteInsertError);
    }

    let emailStatus: "sent" | "failed" = "sent";
    let emailError: string | null = null;

    try {
      await sendWelcomeEmail({
        to: typedMember.email,
        memberName: typedMember.name,
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

    const whatsappResult = await sendWhatsAppInvite({
      to: typedMember.phone || "",
      memberName: typedMember.name,
      churchName,
      tempPassword,
      email: typedMember.email,
    });

    if (trackingEnabled) {
      await supabase
        .from("member_invitations")
        .update({
          email_status: emailStatus,
          email_error: emailError,
          whatsapp_status: whatsappResult.status,
          whatsapp_error: whatsappResult.error,
        })
        .eq("id", invitationId);
    }

    return NextResponse.json({
      success: emailStatus === "sent" || whatsappResult.status === "sent",
      tempPassword,
      invitationId: trackingEnabled ? invitationId : null,
      trackingEnabled,
      email: {
        status: emailStatus,
        error: emailError,
      },
      whatsapp: {
        ...whatsappResult,
        preview:
          whatsappResult.status === "skipped"
            ? buildWhatsAppInvitePreview({
                memberName: typedMember.name,
                churchName,
                tempPassword,
                email: typedMember.email,
              })
            : null,
      },
    });
  } catch (error) {
    console.error("API resend member invitation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to resend invite" },
      { status: 500 }
    );
  }
}
