import { NextResponse } from "next/server";
import { z } from "zod";
import { can } from "@/lib/auth/permissions";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  actorId: z.string().min(1),
  scheduleId: z.string().min(1),
  churchId: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));

    if (!parsed.success) {
      return NextResponse.json({ error: "Dados invalidos para excluir escala." }, { status: 400 });
    }

    const { actorId, scheduleId, churchId } = parsed.data;
    const supabase = getSupabaseServerClient();

    const [{ data: actor, error: actorError }, { data: schedule, error: scheduleError }] = await Promise.all([
      supabase
        .from("users")
        .select("id, role, church_id, active")
        .eq("id", actorId)
        .eq("church_id", churchId)
        .maybeSingle(),
      supabase
        .from("schedules")
        .select("id, church_id")
        .eq("id", scheduleId)
        .eq("church_id", churchId)
        .maybeSingle(),
    ]);

    if (actorError) throw actorError;
    if (scheduleError) throw scheduleError;

    if (!actor?.active || !can(actor.role, "schedule.delete")) {
      return NextResponse.json({ error: "Sem permissao para excluir escalas." }, { status: 403 });
    }

    if (!schedule) {
      return NextResponse.json({ error: "Escala nao encontrada." }, { status: 404 });
    }

    const { error: deleteMembersError } = await supabase
      .from("schedule_members")
      .delete()
      .eq("schedule_id", scheduleId);

    if (deleteMembersError) throw deleteMembersError;

    const { error: deleteSlotsError } = await supabase
      .from("schedule_slots")
      .delete()
      .eq("schedule_id", scheduleId);

    if (deleteSlotsError) throw deleteSlotsError;

    const { error: deleteChatError } = await supabase
      .from("schedule_chats")
      .delete()
      .eq("schedule_id", scheduleId);

    if (deleteChatError) {
      console.error("Erro ao excluir chat da escala:", deleteChatError);
    }

    const { error: deleteScheduleError } = await supabase
      .from("schedules")
      .delete()
      .eq("id", scheduleId)
      .eq("church_id", churchId);

    if (deleteScheduleError) throw deleteScheduleError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API schedules/delete error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao excluir escala." },
      { status: 500 }
    );
  }
}
