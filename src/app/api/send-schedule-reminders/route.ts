import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendScheduleReminderEmail } from "@/lib/email/send";

type RouteBody = {
  scheduleId?: string;
};

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is required.");
  }

  if (!supabaseKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is required.");
  }

  return createClient(supabaseUrl, supabaseKey);
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const body = (await req.json().catch(() => ({}))) as RouteBody;
    const { scheduleId } = body;

    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);

    let scheduleQuery = supabase
      .from("schedules")
      .select("*")
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

    if (!schedules || schedules.length === 0) {
      return NextResponse.json({ success: true, sentCount: 0, failedCount: 0, sent: [], failed: [] });
    }

    const sent: Array<{ scheduleId: string; email: string }> = [];
    const failed: Array<{ scheduleId: string; email: string; error: string }> = [];

    for (const sched of schedules) {
      const [{ data: event }, { data: dept }, { data: members }] = await Promise.all([
        supabase.from("events").select("*").eq("id", sched.event_id).maybeSingle(),
        supabase.from("departments").select("*").eq("id", sched.department_id).maybeSingle(),
        supabase.from("schedule_members").select("*").eq("schedule_id", sched.id),
      ]);

      for (const sm of members || []) {
        const { data: user } = await supabase
          .from("users")
          .select("*")
          .eq("id", sm.user_id)
          .maybeSingle();

        if (!user?.email) continue;

        try {
          await sendScheduleReminderEmail({
            to: user.email,
            memberName: user.name,
            eventName: event?.name || "Evento",
            date: sched.date,
            time: sched.time,
            departmentName: dept?.name || "Ministério",
          });

          sent.push({ scheduleId: sched.id, email: user.email });
        } catch (error) {
          failed.push({
            scheduleId: sched.id,
            email: user.email,
            error: error instanceof Error ? error.message : "Erro desconhecido",
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      sentCount: sent.length,
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