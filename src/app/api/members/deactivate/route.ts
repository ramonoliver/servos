import { NextResponse } from "next/server";
import { z } from "zod";
import { can } from "@/lib/auth/permissions";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  actorId: z.string().min(1),
  targetUserId: z.string().min(1),
  churchId: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));

    if (!parsed.success) {
      return NextResponse.json({ error: "Dados invalidos para remover membro." }, { status: 400 });
    }

    const { actorId, targetUserId, churchId } = parsed.data;
    if (actorId === targetUserId) {
      return NextResponse.json({ error: "Voce nao pode remover a propria conta." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const [{ data: actor, error: actorError }, { data: target, error: targetError }] = await Promise.all([
      supabase
        .from("users")
        .select("id, role, church_id, active")
        .eq("id", actorId)
        .eq("church_id", churchId)
        .maybeSingle(),
      supabase
        .from("users")
        .select("id, church_id, spouse_id, active")
        .eq("id", targetUserId)
        .eq("church_id", churchId)
        .maybeSingle(),
    ]);

    if (actorError) throw actorError;
    if (targetError) throw targetError;

    if (!actor?.active || !can(actor.role, "member.remove")) {
      return NextResponse.json({ error: "Sem permissao para remover membros." }, { status: 403 });
    }

    if (!target?.active) {
      return NextResponse.json({ error: "Membro nao encontrado." }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from("users")
      .update({ active: false })
      .eq("id", targetUserId)
      .eq("church_id", churchId);

    if (updateError) throw updateError;

    if (target.spouse_id) {
      const { error: spouseError } = await supabase
        .from("users")
        .update({ spouse_id: null })
        .eq("id", target.spouse_id)
        .eq("church_id", churchId);

      if (spouseError) {
        console.error("Erro ao limpar conjuge:", spouseError);
      }
    }

    const { error: deleteDeptMemberError } = await supabase
      .from("department_members")
      .delete()
      .eq("user_id", targetUserId);

    if (deleteDeptMemberError) {
      console.error("Erro ao remover vinculos de departamento:", deleteDeptMemberError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API members/deactivate error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao remover membro." },
      { status: 500 }
    );
  }
}
