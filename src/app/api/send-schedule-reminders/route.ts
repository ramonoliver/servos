import { NextResponse } from "next/server";
import { requireApiActor } from "@/lib/auth/api-session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { sendScheduleReminderAlerts } from "@/lib/server/schedule-notifications";

type RouteBody = {
  scheduleId?: string;
};

export async function POST(req: Request) {
  try {
    const { actor, session, errorResponse } = await requireApiActor(req);
    if (errorResponse) return errorResponse;

    if (!actor || (actor.role !== "admin" && actor.role !== "leader")) {
      return NextResponse.json({ error: "Sem permissao para enviar lembretes." }, { status: 403 });
    }

    const supabase = getSupabaseServerClient();
    const body = (await req.json().catch(() => ({}))) as RouteBody;
    const { scheduleId } = body;
    const churchId = session!.church_id;
    const actorId = session!.user_id;

    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);

    let scheduleQuery = supabase
      .from("schedules")
      .select("*")
      .eq("church_id", churchId)
      .eq("status", "active");

    if (scheduleId) {
      scheduleQuery = scheduleQuery.eq("id", scheduleId);
    } else {
      const start = now.toISOString().split("T")[0];
      const end = tomorrow.toISOString().split("T")[0];
      scheduleQuery = scheduleQuery.gte("date", start).lte("date", end);
    }

    const { data: schedules, error: schedulesError } = await scheduleQuery;

    if (schedulesError) throw schedulesError;

    let visibleSchedules = schedules || [];

    if (actor.role === "leader" && visibleSchedules.length > 0) {
      const departmentIds = [...new Set(visibleSchedules.map((schedule) => schedule.department_id))];
      const { data: departments, error: departmentsError } = await supabase
        .from("departments")
        .select("id, leader_ids, co_leader_ids")
        .eq("church_id", churchId)
        .in("id", departmentIds);

      if (departmentsError) throw departmentsError;

      const allowedDepartmentIds = new Set(
        (departments || [])
          .filter(
            (department) =>
              (department.leader_ids || []).includes(actorId) ||
              (department.co_leader_ids || []).includes(actorId)
          )
          .map((department) => department.id)
      );

      visibleSchedules = visibleSchedules.filter((schedule) =>
        allowedDepartmentIds.has(schedule.department_id)
      );
    }

    if (!visibleSchedules || visibleSchedules.length === 0) {
      return NextResponse.json({ success: true, sentCount: 0, failedCount: 0, sent: [], failed: [] });
    }

    const sent: Array<{ scheduleId: string; channel: "email" | "sms"; count: number }> = [];
    const failed: Array<{ scheduleId: string; userId: string; channel: "email" | "sms"; error: string }> = [];
    let emailSentCount = 0;
    let smsSentCount = 0;
    let emailSkippedCount = 0;
    let smsSkippedCount = 0;

    for (const sched of visibleSchedules) {
      const delivery = await sendScheduleReminderAlerts({
        churchId,
        scheduleId: sched.id,
        onlyPending: true,
      });

      emailSentCount += delivery.email.sent;
      smsSentCount += delivery.sms.sent;
      emailSkippedCount += delivery.email.skipped;
      smsSkippedCount += delivery.sms.skipped;

      if (delivery.email.sent > 0) {
        sent.push({ scheduleId: sched.id, channel: "email", count: delivery.email.sent });
      }
      if (delivery.sms.sent > 0) {
        sent.push({ scheduleId: sched.id, channel: "sms", count: delivery.sms.sent });
      }

      failed.push(...delivery.failed.map((item) => ({ scheduleId: sched.id, ...item })));
    }

    return NextResponse.json({
      success: true,
      sentCount: emailSentCount + smsSentCount,
      emailSentCount,
      smsSentCount,
      emailSkippedCount,
      smsSkippedCount,
      failedCount: failed.length,
      sent,
      failed,
    });
  } catch (error) {
    console.error("Erro no envio de lembretes:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erro ao enviar lembretes",
      },
      { status: 500 }
    );
  }
}
