import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiActor } from "@/lib/auth/api-session";
import { can } from "@/lib/auth/permissions";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  targetUserId: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));

    if (!parsed.success) {
      return NextResponse.json({ error: "Dados invalidos para remover membro." }, { status: 400 });
    }

    const { actor, session, errorResponse } = await requireApiActor(req);
    if (errorResponse) return errorResponse;

    const actorId = session!.user_id;
    const churchId = session!.church_id;
    const { targetUserId } = parsed.data;
    if (actorId === targetUserId) {
      return NextResponse.json({ error: "Voce nao pode remover a propria conta." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const { data: target, error: targetError } = await supabase
        .from("users")
        .select("id, church_id, spouse_id, active")
        .eq("id", targetUserId)
        .eq("church_id", churchId)
        .maybeSingle();
    if (targetError) throw targetError;

    if (!actor?.active || !can(actor.role, "member.remove")) {
      return NextResponse.json({ error: "Sem permissao para remover membros." }, { status: 403 });
    }

    if (!target?.active) {
      return NextResponse.json({ error: "Membro nao encontrado." }, { status: 404 });
    }

    if (actor.role === "admin") {
      if (target.spouse_id) {
        const { error: spouseCleanupError } = await supabase
          .from("users")
          .update({ spouse_id: null })
          .eq("id", target.spouse_id)
          .eq("church_id", churchId);

        if (spouseCleanupError) throw spouseCleanupError;
      }

      const { data: departments } = await supabase
        .from("departments")
        .select("id, leader_ids, co_leader_ids")
        .eq("church_id", churchId);

      for (const department of departments || []) {
        const nextLeaderIds = (department.leader_ids || []).filter((id: string) => id !== targetUserId);
        const nextCoLeaderIds = (department.co_leader_ids || []).filter((id: string) => id !== targetUserId);

        if (
          nextLeaderIds.length !== (department.leader_ids || []).length ||
          nextCoLeaderIds.length !== (department.co_leader_ids || []).length
        ) {
          const { error: deptUpdateError } = await supabase
            .from("departments")
            .update({
              leader_ids: nextLeaderIds,
              co_leader_ids: nextCoLeaderIds,
            })
            .eq("id", department.id)
            .eq("church_id", churchId);

          if (deptUpdateError) throw deptUpdateError;
        }
      }

      const cleanupTasks = [
        supabase.from("member_invitations").delete().eq("user_id", targetUserId).eq("church_id", churchId),
        supabase.from("password_reset_tokens").delete().eq("user_id", targetUserId).eq("church_id", churchId),
        supabase.from("notifications").delete().eq("user_id", targetUserId).eq("church_id", churchId),
        supabase.from("unavailable_dates").delete().eq("user_id", targetUserId).eq("church_id", churchId),
        supabase.from("department_members").delete().eq("user_id", targetUserId),
        supabase.from("messages").delete().eq("sender_id", targetUserId),
        supabase.from("schedule_chats").delete().eq("sender_id", targetUserId),
        supabase.from("schedule_members").delete().eq("user_id", targetUserId),
        supabase.from("schedule_members").update({ substitute_id: null }).eq("substitute_id", targetUserId),
        supabase.from("schedule_members").update({ substitute_for: null }).eq("substitute_for", targetUserId),
      ];

      const cleanupResults = await Promise.all(cleanupTasks);
      const cleanupError = cleanupResults.find((result) => result.error)?.error;
      if (cleanupError) throw cleanupError;

      const { error: deleteUserError } = await supabase
        .from("users")
        .delete()
        .eq("id", targetUserId)
        .eq("church_id", churchId);

      if (deleteUserError) throw deleteUserError;

      return NextResponse.json({ success: true, mode: "hard_delete" });
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

    return NextResponse.json({ success: true, mode: "deactivate" });
  } catch (error) {
    console.error("API members/deactivate error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao remover membro." },
      { status: 500 }
    );
  }
}
