import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { genId } from "@/lib/utils/helpers";

const getSchema = z.object({
  scheduleId: z.string().min(1),
  churchId: z.string().min(1),
});

const postSchema = z.object({
  scheduleId: z.string().min(1),
  churchId: z.string().min(1),
  senderId: z.string().min(1),
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

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const parsed = getSchema.safeParse({
      scheduleId: url.searchParams.get("scheduleId"),
      churchId: url.searchParams.get("churchId"),
    });

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid query params." }, { status: 400 });
    }

    const { scheduleId, churchId } = parsed.data;
    const supabase = getSupabaseServerClient();

    const allowed = await ensureScheduleBelongsToChurch(scheduleId, churchId);
    if (!allowed) {
      return NextResponse.json({ error: "Schedule not found." }, { status: 404 });
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

    const { scheduleId, churchId, senderId, content } = parsed.data;
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
