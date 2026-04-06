import { NextResponse } from "next/server";
import { z } from "zod";
import { can } from "@/lib/auth/permissions";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { genId } from "@/lib/utils/helpers";

const postSchema = z.object({
  actorId: z.string().min(1),
  churchId: z.string().min(1),
  scheduleId: z.string().min(1),
  userId: z.string().min(1),
});

const deleteSchema = z.object({
  actorId: z.string().min(1),
  churchId: z.string().min(1),
  scheduleId: z.string().min(1),
  scheduleMemberId: z.string().min(1),
});

const patchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("respond"),
    actorId: z.string().min(1),
    churchId: z.string().min(1),
    scheduleMemberId: z.string().min(1),
    status: z.enum(["confirmed", "declined"]),
    declineReason: z.string().default(""),
  }),
  z.object({
    action: z.literal("substitute"),
    actorId: z.string().min(1),
    churchId: z.string().min(1),
    scheduleId: z.string().min(1),
    declinedScheduleMemberId: z.string().min(1),
    substituteId: z.string().min(1),
  }),
]);

async function getScheduleContext(scheduleId: string, churchId: string) {
  const supabase = getSupabaseServerClient();
  const { data: schedule, error } = await supabase
    .from("schedules")
    .select("id, church_id, department_id")
    .eq("id", scheduleId)
    .eq("church_id", churchId)
    .maybeSingle();

  if (error) throw error;
  return schedule;
}

async function canManageSchedule(params: { actorId: string; churchId: string; scheduleId: string }) {
  const { actorId, churchId, scheduleId } = params;
  const supabase = getSupabaseServerClient();
  const [actorResult, schedule] = await Promise.all([
    supabase
      .from("users")
      .select("id, role, church_id, active")
      .eq("id", actorId)
      .eq("church_id", churchId)
      .maybeSingle(),
    getScheduleContext(scheduleId, churchId),
  ]);

  if (actorResult.error) throw actorResult.error;
  const actor = actorResult.data;
  if (!actor?.active || !schedule) return { allowed: false, schedule: null };

  if (!can(actor.role, "schedule.edit", { departmentId: schedule.department_id, userDepartmentIds: [schedule.department_id] })) {
    return { allowed: false, schedule };
  }

  if (actor.role === "leader") {
    const { data: department, error: departmentError } = await supabase
      .from("departments")
      .select("id, leader_ids, co_leader_ids")
      .eq("id", schedule.department_id)
      .eq("church_id", churchId)
      .maybeSingle();

    if (departmentError) throw departmentError;

    const managesDepartment =
      (department?.leader_ids || []).includes(actorId) ||
      (department?.co_leader_ids || []).includes(actorId);

    if (!managesDepartment) return { allowed: false, schedule };
  }

  return { allowed: true, schedule };
}

export async function POST(req: Request) {
  try {
    const parsed = postSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados invalidos para adicionar membro a escala." }, { status: 400 });
    }

    const { actorId, churchId, scheduleId, userId } = parsed.data;
    const supabase = getSupabaseServerClient();
    const { allowed, schedule } = await canManageSchedule({ actorId, churchId, scheduleId });

    if (!allowed || !schedule) {
      return NextResponse.json({ error: "Sem permissao para editar esta escala." }, { status: 403 });
    }

    const [{ data: targetMember, error: targetMemberError }, { data: departmentLink, error: departmentLinkError }, { data: existingMember, error: existingMemberError }] =
      await Promise.all([
        supabase
          .from("users")
          .select("id, church_id, active")
          .eq("id", userId)
          .eq("church_id", churchId)
          .maybeSingle(),
        supabase
          .from("department_members")
          .select("user_id, function_name")
          .eq("department_id", schedule.department_id)
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("schedule_members")
          .select("id")
          .eq("schedule_id", scheduleId)
          .eq("user_id", userId)
          .maybeSingle(),
      ]);

    if (targetMemberError) throw targetMemberError;
    if (departmentLinkError) throw departmentLinkError;
    if (existingMemberError) throw existingMemberError;

    if (!targetMember?.active || !departmentLink) {
      return NextResponse.json({ error: "Membro nao elegivel para esta escala." }, { status: 404 });
    }

    if (existingMember) {
      return NextResponse.json({ error: "Este membro ja esta na escala." }, { status: 409 });
    }

    const { error } = await supabase.from("schedule_members").insert({
      id: genId(),
      schedule_id: scheduleId,
      user_id: userId,
      function_name: departmentLink.function_name || "",
      status: "pending",
      decline_reason: "",
      substitute_id: null,
      substitute_for: null,
      is_reserve: false,
      responded_at: null,
      notified_at: new Date().toISOString(),
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API schedule-members POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao adicionar membro a escala." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const parsed = deleteSchema.safeParse({
      actorId: url.searchParams.get("actorId"),
      churchId: url.searchParams.get("churchId"),
      scheduleId: url.searchParams.get("scheduleId"),
      scheduleMemberId: url.searchParams.get("scheduleMemberId"),
    });

    if (!parsed.success) {
      return NextResponse.json({ error: "Dados invalidos para remover membro da escala." }, { status: 400 });
    }

    const { actorId, churchId, scheduleId, scheduleMemberId } = parsed.data;
    const supabase = getSupabaseServerClient();
    const { allowed } = await canManageSchedule({ actorId, churchId, scheduleId });

    if (!allowed) {
      return NextResponse.json({ error: "Sem permissao para editar esta escala." }, { status: 403 });
    }

    const { error } = await supabase
      .from("schedule_members")
      .delete()
      .eq("id", scheduleMemberId)
      .eq("schedule_id", scheduleId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API schedule-members DELETE error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao remover membro da escala." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados invalidos para atualizar membro da escala." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    if (parsed.data.action === "respond") {
      const { actorId, churchId, scheduleMemberId, status, declineReason } = parsed.data;
      const { data: scheduleMember, error: scheduleMemberError } = await supabase
        .from("schedule_members")
        .select("id, user_id")
        .eq("id", scheduleMemberId)
        .maybeSingle();

      if (scheduleMemberError) throw scheduleMemberError;
      if (!scheduleMember) {
        return NextResponse.json({ error: "Participacao na escala nao encontrada." }, { status: 404 });
      }

      if (scheduleMember.user_id !== actorId) {
        return NextResponse.json({ error: "Sem permissao para responder esta escala." }, { status: 403 });
      }

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
        .from("schedule_members")
        .update({
          status,
          decline_reason: status === "declined" ? declineReason : "",
          responded_at: new Date().toISOString(),
        })
        .eq("id", scheduleMemberId);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    const { actorId, churchId, scheduleId, declinedScheduleMemberId, substituteId } = parsed.data;
    const { allowed, schedule } = await canManageSchedule({ actorId, churchId, scheduleId });

    if (!allowed || !schedule) {
      return NextResponse.json({ error: "Sem permissao para editar esta escala." }, { status: 403 });
    }

    const [{ data: declinedMember, error: declinedMemberError }, { data: substituteLink, error: substituteLinkError }, { data: existingSubstitute, error: existingSubstituteError }] =
      await Promise.all([
        supabase
          .from("schedule_members")
          .select("id, user_id, function_name, status, substitute_id")
          .eq("id", declinedScheduleMemberId)
          .eq("schedule_id", scheduleId)
          .maybeSingle(),
        supabase
          .from("department_members")
          .select("user_id, function_name")
          .eq("department_id", schedule.department_id)
          .eq("user_id", substituteId)
          .maybeSingle(),
        supabase
          .from("schedule_members")
          .select("id")
          .eq("schedule_id", scheduleId)
          .eq("user_id", substituteId)
          .maybeSingle(),
      ]);

    if (declinedMemberError) throw declinedMemberError;
    if (substituteLinkError) throw substituteLinkError;
    if (existingSubstituteError) throw existingSubstituteError;

    if (!declinedMember || declinedMember.status !== "declined") {
      return NextResponse.json({ error: "Membro recusado nao encontrado." }, { status: 404 });
    }

    if (!substituteLink) {
      return NextResponse.json({ error: "Substituto nao elegivel para este ministerio." }, { status: 404 });
    }

    if (existingSubstitute) {
      return NextResponse.json({ error: "Este substituto ja esta na escala." }, { status: 409 });
    }

    const { error: insertError } = await supabase.from("schedule_members").insert({
      id: genId(),
      schedule_id: scheduleId,
      user_id: substituteId,
      function_name: substituteLink.function_name || declinedMember.function_name,
      status: "pending",
      decline_reason: "",
      substitute_id: null,
      substitute_for: declinedMember.user_id,
      is_reserve: false,
      responded_at: null,
      notified_at: new Date().toISOString(),
    });

    if (insertError) throw insertError;

    const { error: updateError } = await supabase
      .from("schedule_members")
      .update({ substitute_id: substituteId })
      .eq("id", declinedScheduleMemberId)
      .eq("schedule_id", scheduleId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API schedule-members PATCH error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao atualizar membro da escala." },
      { status: 500 }
    );
  }
}
