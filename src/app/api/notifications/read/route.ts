import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  actorId: z.string().min(1),
  churchId: z.string().min(1),
  notificationIds: z.array(z.string()).min(1),
});

export async function POST(req: Request) {
  try {
    const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados invalidos para marcar notificacoes." }, { status: 400 });
    }

    const { actorId, churchId, notificationIds } = parsed.data;
    const supabase = getSupabaseServerClient();

    const { data: actor, error: actorError } = await supabase
      .from("users")
      .select("id, church_id, active")
      .eq("id", actorId)
      .eq("church_id", churchId)
      .maybeSingle();

    if (actorError) throw actorError;
    if (!actor?.active) {
      return NextResponse.json({ error: "Usuario nao encontrado." }, { status: 404 });
    }

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", actorId)
      .in("id", notificationIds);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API notifications/read error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao marcar notificacoes." },
      { status: 500 }
    );
  }
}
