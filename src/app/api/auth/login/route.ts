import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionPayload, encodeSessionToken, buildSessionCookie } from "@/lib/auth/server-session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { User } from "@/types";

const bodySchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: "Credenciais invalidas." }, { status: 400 });
    }

    const { email, password } = parsed.data;
    const supabase = getSupabaseServerClient();

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email.trim().toLowerCase())
      .eq("active", true)
      .maybeSingle();

    if (error) throw error;
    if (!user || !verifyPassword(password, user.password_hash)) {
      return NextResponse.json({ error: "Email ou senha incorretos." }, { status: 401 });
    }

    const session = createSessionPayload(user);
    const token = encodeSessionToken(session);
    const clientUser = {
      id: user.id,
      church_id: user.church_id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar_color: user.avatar_color,
    } satisfies Pick<User, "id" | "church_id" | "email" | "name" | "role" | "avatar_color">;
    const response = NextResponse.json({ success: true, session, user: clientUser });
    response.headers.append("Set-Cookie", buildSessionCookie(token));
    return response;
  } catch (error) {
    console.error("API auth/login error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao entrar." },
      { status: 500 }
    );
  }
}
