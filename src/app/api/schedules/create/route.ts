import { NextResponse } from "next/server";
import { z } from "zod";
import { can } from "@/lib/auth/permissions";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { genId } from "@/lib/utils/helpers";

const bodySchema = z.object({
  actorId: z.string().min(1),
  churchId: z.string().min(1),
  eventId: z.string().min(1),
  departmentId: z.string().min(1),
  date: z.string().min(1),
  time: z.string().min(1),
  arrivalTime: z.string().default(""),
  instructions: z.string().default(""),
  publish: z.boolean(),
  selectedIds: z.array(z.string()).default([]),
});

export async function POST(req: Request) {
  try {
    const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados invalidos para criar escala." }, { status: 400 });
    }

    const {
      actorId,
      churchId,
      eventId,
      departmentId,
      date,
      time,
      arrivalTime,
      instructions,
      publish,
      selectedIds,
    } = parsed.data;

    const supabase = getSupabaseServerClient();

    const [{ data: actor, error: actorError }, { data: department, error: departmentError }, { data: event, error: eventError }] =
      await Promise.all([
        supabase
          .from("users")
          .select("id, role, church_id, active")
          .eq("id", actorId)
          .eq("church_id", churchId)
          .maybeSingle(),
        supabase
          .from("departments")
          .select("id, church_id, leader_ids, co_leader_ids")
          .eq("id", departmentId)
          .eq("church_id", churchId)
          .maybeSingle(),
        supabase
          .from("events")
          .select("id, church_id, active")
          .eq("id", eventId)
          .eq("church_id", churchId)
          .maybeSingle(),
      ]);

    if (actorError) throw actorError;
    if (departmentError) throw departmentError;
    if (eventError) throw eventError;

    if (!actor?.active || !can(actor.role, "schedule.create", { departmentId, userDepartmentIds: [departmentId] })) {
      return NextResponse.json({ error: "Sem permissao para criar escalas." }, { status: 403 });
    }

    if (actor.role === "leader") {
      const canManageDepartment =
        (department?.leader_ids || []).includes(actorId) ||
        (department?.co_leader_ids || []).includes(actorId);
      if (!canManageDepartment) {
        return NextResponse.json({ error: "Sem permissao para criar escala neste ministerio." }, { status: 403 });
      }
    }

    if (!department || !event?.active) {
      return NextResponse.json({ error: "Evento ou ministerio nao encontrado." }, { status: 404 });
    }

    const { data: departmentLinks, error: departmentLinksError } = await supabase
      .from("department_members")
      .select("user_id, function_name")
      .eq("department_id", departmentId);

    if (departmentLinksError) throw departmentLinksError;

    const linkMap = new Map((departmentLinks || []).map((link) => [link.user_id, link.function_name || ""]));
    const validSelectedIds = selectedIds.filter((userId) => linkMap.has(userId));

    const now = new Date().toISOString();
    const scheduleId = genId();

    const { error: scheduleError } = await supabase.from("schedules").insert({
      id: scheduleId,
      church_id: churchId,
      event_id: eventId,
      department_id: departmentId,
      date,
      time,
      arrival_time: arrivalTime,
      status: publish ? "active" : "draft",
      instructions,
      notes: "",
      published: publish,
      created_by: actorId,
      created_at: now,
    });

    if (scheduleError) throw scheduleError;

    if (validSelectedIds.length > 0) {
      const payload = validSelectedIds.map((userId) => ({
        id: genId(),
        schedule_id: scheduleId,
        user_id: userId,
        function_name: linkMap.get(userId) || "",
        status: "pending",
        decline_reason: "",
        substitute_id: null,
        substitute_for: null,
        is_reserve: false,
        responded_at: null,
        notified_at: now,
      }));

      const { error: scheduleMembersError } = await supabase
        .from("schedule_members")
        .insert(payload);

      if (scheduleMembersError) throw scheduleMembersError;
    }

    return NextResponse.json({ success: true, scheduleId });
  } catch (error) {
    console.error("API schedules/create error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao criar escala." },
      { status: 500 }
    );
  }
}
