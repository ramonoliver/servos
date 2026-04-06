import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/auth/api-session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { genId } from "@/lib/utils/helpers";

const getSchema = z.object({
  scheduleId: z.string().min(1),
});

const postSchema = z.object({
  scheduleId: z.string().min(1),
  content: z.string().trim().min(1).max(2000),
});

async function ensureScheduleBelongsToChurch(scheduleId: string, churchId: string) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("schedules")
    .select("id, church_id")
    .eq("id", scheduleId)
    .eq("church_id", churchId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

async function canAccessScheduleChat(params: {
  scheduleId: string;
  churchId: string;
  userId: string;
}) {
  const { scheduleId, churchId, userId } = params;
  const supabase = getSupabaseServerClient();

  const [{ data: member }, { data: scheduleMember }] = await Promise.all([
    supabase
      .from("users")
      .select("id, role, church_id, active")
      .eq("id", userId)
      .eq("church_id", churchId)
      .maybeSingle(),
    supabase
      .from("schedule_members")
      .select("id")
      .eq("schedule_id", scheduleId)
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  if (!member?.active) return false;
  if (member.role === "admin" || member.role === "leader") return true;

  return Boolean(scheduleMember);
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const parsed = getSchema.safeParse({
      scheduleId: url.searchParams.get("scheduleId"),
    });

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid query params." }, { status: 400 });
    }

    const { session, errorResponse } = requireApiSession(req);
    if (!session) return errorResponse!;

    const { scheduleId } = parsed.data;
    const churchId = session.church_id;
    const supabase = getSupabaseServerClient();

    const allowed = await ensureScheduleBelongsToChurch(scheduleId, churchId);
    if (!allowed) {
      return NextResponse.json({ error: "Schedule not found." }, { status: 404 });
    }

    const canAccess = await canAccessScheduleChat({ scheduleId, churchId, userId: session.user_id });
    if (!canAccess) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("schedule_chats")
      .select("*")
      .eq("schedule_id", scheduleId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, messages: data || [] });
  } catch (error) {
    console.error("API schedule-chats GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load schedule chat" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = postSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
    }

    const { session, errorResponse } = requireApiSession(req);
    if (!session) return errorResponse!;

    const { scheduleId, content } = parsed.data;
    const churchId = session.church_id;
    const senderId = session.user_id;
    const supabase = getSupabaseServerClient();

    const [scheduleResult, senderResult] = await Promise.all([
      supabase
        .from("schedules")
        .select("id, church_id")
        .eq("id", scheduleId)
        .eq("church_id", churchId)
        .maybeSingle(),
      supabase
        .from("users")
        .select("id, church_id, active")
        .eq("id", senderId)
        .eq("church_id", churchId)
        .maybeSingle(),
    ]);

    if (scheduleResult.error) throw scheduleResult.error;
    if (senderResult.error) throw senderResult.error;

    if (!scheduleResult.data) {
      return NextResponse.json({ error: "Schedule not found." }, { status: 404 });
    }

    if (!senderResult.data?.active) {
      return NextResponse.json({ error: "Sender not allowed." }, { status: 403 });
    }

    const canAccess = await canAccessScheduleChat({
      scheduleId,
      churchId,
      userId: senderId,
    });

    if (!canAccess) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const message = {
      id: genId(),
      schedule_id: scheduleId,
      sender_id: senderId,
      content,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("schedule_chats")
      .insert(message)
      .select("*")
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ success: true, message: data || message });
  } catch (error) {
    console.error("API schedule-chats POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send chat message" },
      { status: 500 }
    );
  }
}
