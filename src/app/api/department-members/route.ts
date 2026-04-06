import { NextResponse } from "next/server";
import { z } from "zod";
import { can } from "@/lib/auth/permissions";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { genId } from "@/lib/utils/helpers";

const postSchema = z.object({
  actorId: z.string().min(1),
  churchId: z.string().min(1),
  departmentId: z.string().min(1),
  userId: z.string().min(1),
  functionName: z.string().default(""),
});

const deleteSchema = z.object({
  actorId: z.string().min(1),
  churchId: z.string().min(1),
  departmentId: z.string().min(1),
  departmentMemberId: z.string().min(1),
});

async function canManageDepartmentMember(params: {
  actorId: string;
  churchId: string;
  departmentId: string;
}) {
  const { actorId, churchId, departmentId } = params;
  const supabase = getSupabaseServerClient();

  const [{ data: actor }, { data: department }] = await Promise.all([
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
  ]);

  if (!actor?.active || !department) return false;
  if (!can(actor.role, "member.edit", { departmentId, userDepartmentIds: [departmentId] })) {
    return false;
  }

  if (actor.role === "admin") return true;
  if ((department.leader_ids || []).includes(actorId)) return true;
  if ((department.co_leader_ids || []).includes(actorId)) return true;

  return false;
}

export async function POST(req: Request) {
  try {
    const parsed = postSchema.safeParse(await req.json().catch(() => ({})));

    if (!parsed.success) {
      return NextResponse.json({ error: "Dados invalidos para adicionar membro." }, { status: 400 });
    }

    const { actorId, churchId, departmentId, userId, functionName } = parsed.data;
    const supabase = getSupabaseServerClient();

    const allowed = await canManageDepartmentMember({ actorId, churchId, departmentId });
    if (!allowed) {
      return NextResponse.json({ error: "Sem permissao para alterar este ministerio." }, { status: 403 });
    }

    const [{ data: member, error: memberError }, { data: existingLink, error: existingLinkError }] =
      await Promise.all([
        supabase
          .from("users")
          .select("id, church_id, active")
          .eq("id", userId)
          .eq("church_id", churchId)
          .maybeSingle(),
        supabase
          .from("department_members")
          .select("id")
          .eq("department_id", departmentId)
          .eq("user_id", userId)
          .maybeSingle(),
      ]);

    if (memberError) throw memberError;
    if (existingLinkError) throw existingLinkError;

    if (!member?.active) {
      return NextResponse.json({ error: "Membro nao encontrado." }, { status: 404 });
    }

    if (existingLink) {
      return NextResponse.json({ error: "Este membro ja esta no ministerio." }, { status: 409 });
    }

    const { error } = await supabase.from("department_members").insert({
      id: genId(),
      department_id: departmentId,
      user_id: userId,
      function_name: functionName.trim(),
      joined_at: new Date().toISOString(),
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API department-members POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao adicionar membro ao ministerio." },
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
      departmentId: url.searchParams.get("departmentId"),
      departmentMemberId: url.searchParams.get("departmentMemberId"),
    });

    if (!parsed.success) {
      return NextResponse.json({ error: "Dados invalidos para remover membro." }, { status: 400 });
    }

    const { actorId, churchId, departmentId, departmentMemberId } = parsed.data;
    const supabase = getSupabaseServerClient();

    const allowed = await canManageDepartmentMember({ actorId, churchId, departmentId });
    if (!allowed) {
      return NextResponse.json({ error: "Sem permissao para alterar este ministerio." }, { status: 403 });
    }

    const { data: departmentMember, error: departmentMemberError } = await supabase
      .from("department_members")
      .select("id, department_id")
      .eq("id", departmentMemberId)
      .eq("department_id", departmentId)
      .maybeSingle();

    if (departmentMemberError) throw departmentMemberError;
    if (!departmentMember) {
      return NextResponse.json({ error: "Vinculo do ministerio nao encontrado." }, { status: 404 });
    }

    const { error } = await supabase
      .from("department_members")
      .delete()
      .eq("id", departmentMemberId)
      .eq("department_id", departmentId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API department-members DELETE error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao remover membro do ministerio." },
      { status: 500 }
    );
  }
}
