import { NextResponse } from "next/server";
import { generateTempPassword, hashPassword } from "@/lib/auth/password";
import { deliverMemberInvitation } from "@/lib/server/member-invitations";
import { getSupabaseServerClient } from "@/lib/supabase/server";
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

    const { error: updateError } = await supabase
      .from("users")
      .update({
        password_hash: hashPassword(tempPassword),
        must_change_password: true,
      })
      .eq("id", typedMember.id);

    if (updateError) throw updateError;

    const delivery = await deliverMemberInvitation({
      to: typedMember.email,
      phone: typedMember.phone || "",
      memberName: typedMember.name,
      churchName,
      tempPassword,
      userId: typedMember.id,
      churchId,
      invitedByUserId,
    });

    return NextResponse.json({
      success: delivery.success,
      tempPassword,
      ...delivery,
    });
  } catch (error) {
    console.error("API resend member invitation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to resend invite" },
      { status: 500 }
    );
  }
}
