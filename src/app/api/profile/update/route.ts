import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiActor } from "@/lib/auth/api-session";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const bodySchema = z.object({
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

    const { actor, session, errorResponse } = await requireApiActor(req, { select: "id, church_id, active" });
    if (errorResponse) return errorResponse;

    const { name, phone, availability, photoUrl } = parsed.data;
    const supabase = getSupabaseServerClient();
    if (!actor?.active) {
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
      .eq("id", actor.id)
      .eq("church_id", session!.church_id)
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
