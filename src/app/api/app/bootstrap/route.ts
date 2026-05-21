import { NextResponse } from "next/server";
import { requireApiActor } from "@/lib/auth/api-session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Church, Department, User } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { actor, session, errorResponse } = await requireApiActor(req, {
      select: "id, role, church_id, active",
    });
    if (errorResponse) return errorResponse;
    if (!actor?.active || !session) {
      return NextResponse.json({ error: "Usuario autenticado nao encontrado." }, { status: 401 });
    }

    const supabase = getSupabaseServerClient();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const restHeaders = {
      "apikey": supabaseKey,
      "Authorization": `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
    };

    const [{ data: user, error: userError }, { data: church, error: churchError }, deptsRes, { data: departmentLinks, error: linksError }] =
      await Promise.all([
        supabase.from("users").select("*").eq("id", session.user_id).eq("church_id", session.church_id).single(),
        supabase.from("churches").select("*").eq("id", session.church_id).single(),
        fetch(`${supabaseUrl}/rest/v1/departments?select=*&church_id=eq.${session.church_id}`, { headers: restHeaders, cache: "no-store" }),
        supabase.from("department_members").select("department_id").eq("user_id", session.user_id),
      ]);

    if (userError) throw userError;
    if (churchError) throw churchError;
    if (!deptsRes.ok) throw new Error(`departments fetch failed: ${deptsRes.status}`);
    if (linksError) throw linksError;

    const depts = await deptsRes.json();

    const allDepartments = (depts || []) as Department[];
    const currentUser = user as User;
    console.log("[bootstrap] user_id:", session.user_id, "church_id:", session.church_id, "role:", currentUser.role, "depts:", allDepartments.length, "names:", allDepartments.map(d => d.name));
    const leadDeptIds = allDepartments
      .filter(
        (department) =>
          (department.leader_ids || []).includes(currentUser.id) ||
          (department.co_leader_ids || []).includes(currentUser.id)
      )
      .map((department) => department.id);
    const memberDeptIds = ((departmentLinks || []) as Array<{ department_id: string }>).map(
      (link) => link.department_id
    );

    const visibleDepartments =
      currentUser.role === "admin"
        ? allDepartments
        : currentUser.role === "leader"
        ? allDepartments.filter((department) => leadDeptIds.includes(department.id))
        : allDepartments.filter((department) => memberDeptIds.includes(department.id));

    const permissionDeptIds =
      currentUser.role === "admin"
        ? allDepartments.map((department) => department.id)
        : currentUser.role === "leader"
        ? leadDeptIds
        : memberDeptIds;

    return NextResponse.json({
      success: true,
      session,
      user: currentUser,
      church: church as Church,
      departments: visibleDepartments,
      userDeptIds: permissionDeptIds,
    });
  } catch (error) {
    console.error("API app/bootstrap error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao carregar contexto do app." },
      { status: 500 }
    );
  }
}
