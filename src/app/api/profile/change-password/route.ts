import { NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  userId: z.string().min(1),
  churchId: z.string().min(1),
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
  confirmPassword: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));

    if (!parsed.success) {
      return NextResponse.json({ error: "Dados invalidos para alterar senha." }, { status: 400 });
    }

    const { userId, churchId, currentPassword, newPassword, confirmPassword } = parsed.data;

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: "As senhas nao coincidem." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const { data: member, error: memberError } = await supabase
      .from("users")
      .select("id, church_id, active, password_hash")
      .eq("id", userId)
      .eq("church_id", churchId)
      .maybeSingle();

    if (memberError) throw memberError;
    if (!member?.active) {
      return NextResponse.json({ error: "Usuario nao encontrado." }, { status: 404 });
    }

    if (!verifyPassword(currentPassword, member.password_hash)) {
      return NextResponse.json({ error: "Senha atual incorreta." }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from("users")
      .update({
        password_hash: hashPassword(newPassword),
        must_change_password: false,
      })
      .eq("id", userId)
      .eq("church_id", churchId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API profile/change-password error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao alterar senha." },
      { status: 500 }
    );
  }
}
