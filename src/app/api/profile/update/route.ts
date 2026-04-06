import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  userId: z.string().min(1),
  churchId: z.string().min(1),
  name: z.string().trim().min(1),
  phone: z.string().trim().default(""),
  availability: z.array(z.boolean()).length(7),
  photoUrl: z.string().nullable(),
});

export async function POST(req: Request) {
  try {
    const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));

    if (!parsed.success) {
      return NextResponse.json({ error: "Dados invalidos para atualizar perfil." }, { status: 400 });
    }

    const { userId, churchId, name, phone, availability, photoUrl } = parsed.data;
    const supabase = getSupabaseServerClient();

    const { data: member, error: memberError } = await supabase
      .from("users")
      .select("id, church_id, active")
      .eq("id", userId)
      .eq("church_id", churchId)
      .maybeSingle();

    if (memberError) throw memberError;
    if (!member?.active) {
      return NextResponse.json({ error: "Usuario nao encontrado." }, { status: 404 });
    }

    const updates = {
      name,
      phone,
      availability,
      photo_url: photoUrl,
    };

    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update(updates)
      .eq("id", userId)
      .eq("church_id", churchId)
      .select("*")
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("API profile/update error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao atualizar perfil." },
      { status: 500 }
    );
  }
}
