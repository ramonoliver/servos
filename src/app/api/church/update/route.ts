import { NextResponse } from "next/server";
import { z } from "zod";
import { can } from "@/lib/auth/permissions";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  actorId: z.string().min(1),
  churchId: z.string().min(1),
  name: z.string().trim().min(1),
  city: z.string().trim().default(""),
});

export async function POST(req: Request) {
  try {
    const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados invalidos para atualizar a igreja." }, { status: 400 });
    }

    const { actorId, churchId, name, city } = parsed.data;
    const supabase = getSupabaseServerClient();

    const { data: actor, error: actorError } = await supabase
      .from("users")
      .select("id, role, church_id, active")
      .eq("id", actorId)
      .eq("church_id", churchId)
      .maybeSingle();

    if (actorError) throw actorError;
    if (!actor?.active || !can(actor.role, "settings.edit")) {
      return NextResponse.json({ error: "Sem permissao para atualizar configuracoes." }, { status: 403 });
    }

    const { error } = await supabase
      .from("churches")
      .update({
        name,
        city,
      })
      .eq("id", churchId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API church/update error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao atualizar a igreja." },
      { status: 500 }
    );
  }
}
