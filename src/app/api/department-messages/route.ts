import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSession } from "@/lib/auth/api-session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { genId } from "@/lib/utils/helpers";

const getSchema = z.object({
  departmentId: z.string().min(1),
});

const postSchema = z.object({
  departmentId: z.string().min(1),
  content: z.string().trim().min(1).max(2000),
});

async function canAccessDepartmentMessages(params: {
  departmentId: string;
  churchId: string;
  userId: string;
}) {
  const { departmentId, churchId, userId } = params;
  const supabase = getSupabaseServerClient();

  const [{ data: member }, { data: department }, { data: departmentMember }] = await Promise.all([
    supabase
      .from("users")
      .select("id, role, church_id, active")
      .eq("id", userId)
      .eq("church_id", churchId)
      .maybeSingle(),
    supabase
      .from("departments")
      .select("id, church_id, leader_ids, co_leader_ids")
      .eq("id", departmentId)
      .eq("church_id", churchId)
      .maybeSingle(),
    supabase
      .from("department_members")
      .select("id")
      .eq("department_id", departmentId)
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  if (!member?.active || !department) return false;
  if (member.role === "admin") return true;
  if ((department.leader_ids || []).includes(userId)) return true;
  if ((department.co_leader_ids || []).includes(userId)) return true;

  return Boolean(departmentMember);
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const parsed = getSchema.safeParse({
      departmentId: url.searchParams.get("departmentId"),
    });

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid query params." }, { status: 400 });
    }

    const { session, errorResponse } = requireApiSession(req);
    if (!session) return errorResponse!;

    const { departmentId } = parsed.data;
    const churchId = session.church_id;
    const supabase = getSupabaseServerClient();

    const canAccess = await canAccessDepartmentMessages({
      departmentId,
      churchId,
      userId: session.user_id,
    });

    if (!canAccess) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("department_id", departmentId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, messages: data || [] });
  } catch (error) {
    console.error("API department-messages GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load department messages" },
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

    const { departmentId, content } = parsed.data;
    const churchId = session.church_id;
    const senderId = session.user_id;
    const supabase = getSupabaseServerClient();

    const canAccess = await canAccessDepartmentMessages({
      departmentId,
      churchId,
      userId: senderId,
    });

    if (!canAccess) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const message = {
      id: genId(),
      department_id: departmentId,
      sender_id: senderId,
      content,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("messages")
      .insert(message)
      .select("*")
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ success: true, message: data || message });
  } catch (error) {
    console.error("API department-messages POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send department message" },
      { status: 500 }
    );
  }
}
