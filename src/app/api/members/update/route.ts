import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiActor } from "@/lib/auth/api-session";
import { can } from "@/lib/auth/permissions";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { genId } from "@/lib/utils/helpers";

const selectedDepartmentSchema = z.object({
  department_id: z.string().min(1),
  function_name: z.string().default(""),
  function_names: z.array(z.string().trim().min(1)).default([]),
});

const bodySchema = z.object({
  memberId: z.string().min(1),
  updates: z.object({
    name: z.string().trim().min(1),
    email: z.string().trim().email(),
    phone: z.string().trim().default(""),
    role: z.enum(["admin", "leader", "member"]),
    status: z.enum(["active", "inactive", "paused", "vacation"]),
    spouse_id: z.string().nullable(),
  }),
  selectedDepartments: z.array(selectedDepartmentSchema).default([]),
  spouseId: z.string().default(""),
});

export async function POST(req: Request) {
  try {
    const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));

    if (!parsed.success) {
      return NextResponse.json({ error: "Dados invalidos para atualizar membro." }, { status: 400 });
    }

    const { actor, session, errorResponse } = await requireApiActor(req);
    if (errorResponse) return errorResponse;

    const actorId = session!.user_id;
    const churchId = session!.church_id;
    const { memberId, updates, selectedDepartments, spouseId } = parsed.data;
    const supabase = getSupabaseServerClient();

    const { data: member, error: memberError } = await supabase
        .from("users")
        .select("id, church_id, spouse_id, active, role")
        .eq("id", memberId)
        .eq("church_id", churchId)
        .maybeSingle();
    if (memberError) throw memberError;

    if (!actor?.active || !can(actor.role, "member.edit")) {
      return NextResponse.json({ error: "Sem permissao para editar membros." }, { status: 403 });
    }

    if (!member) {
      return NextResponse.json({ error: "Membro nao encontrado." }, { status: 404 });
    }

    if (!member.active && actor.role !== "admin") {
      return NextResponse.json({ error: "Somente administradores podem editar membros desativados." }, { status: 403 });
    }

    const departmentIds = selectedDepartments.map((dept) => dept.department_id);
    if (actor.role === "leader") {
      const [{ data: allowedDepartments, error: departmentsError }, { data: currentDepartmentLinks, error: currentLinksError }] =
        await Promise.all([
          supabase
            .from("departments")
            .select("id, leader_ids, co_leader_ids")
            .eq("church_id", churchId),
          supabase
            .from("department_members")
            .select("department_id")
            .eq("user_id", memberId),
        ]);

      if (departmentsError) throw departmentsError;
      if (currentLinksError) throw currentLinksError;

      const allowedIds = (allowedDepartments || [])
        .filter(
          (department) =>
            (department.leader_ids || []).includes(actorId) ||
            (department.co_leader_ids || []).includes(actorId)
        )
        .map((department) => department.id);

      const currentDepartmentIds = (currentDepartmentLinks || []).map((item) => item.department_id);
      const hasForbiddenCurrentDepartment = currentDepartmentIds.some(
        (departmentId) => !allowedIds.includes(departmentId)
      );
      const hasForbiddenSelectedDepartment = departmentIds.some(
        (departmentId) => !allowedIds.includes(departmentId)
      );

      if (hasForbiddenCurrentDepartment || hasForbiddenSelectedDepartment) {
        return NextResponse.json(
          { error: "Sem permissao para alterar ministerios fora da sua lideranca." },
          { status: 403 }
        );
      }

      if (member.role !== "member" || updates.role !== "member") {
        return NextResponse.json(
          { error: "Lideres so podem editar membros comuns." },
          { status: 403 }
        );
      }
    }

    if (actor.role === "leader" && member.id === actorId) {
      return NextResponse.json(
        { error: "Use a tela de perfil para editar os seus proprios dados." },
        { status: 400 }
      );
    }

    const normalizedEmail = updates.email.trim().toLowerCase();
    const { data: existingEmailUser, error: existingEmailError } = await supabase
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .neq("id", memberId)
      .maybeSingle();

    if (existingEmailError) throw existingEmailError;
    if (existingEmailUser) {
      return NextResponse.json({ error: "Ja existe outro membro com este email." }, { status: 409 });
    }

    if (spouseId) {
      const { data: spouse, error: spouseError } = await supabase
        .from("users")
        .select("id, church_id, active")
        .eq("id", spouseId)
        .eq("church_id", churchId)
        .maybeSingle();

      if (spouseError) throw spouseError;
      if (!spouse?.active) {
        return NextResponse.json({ error: "Conjuge informado nao foi encontrado." }, { status: 404 });
      }
    }

    const { error: updateUserError } = await supabase
      .from("users")
      .update({
        ...updates,
        email: normalizedEmail,
        spouse_id: spouseId || null,
      })
      .eq("id", memberId)
      .eq("church_id", churchId);

    if (updateUserError) throw updateUserError;

    const { error: deleteDMError } = await supabase
      .from("department_members")
      .delete()
      .eq("user_id", memberId);

    if (deleteDMError) throw deleteDMError;

    if (selectedDepartments.length > 0) {
      const payload = selectedDepartments.map((dept) => {
        const normalizedFunctionNames = dept.function_names.map((value) => value.trim()).filter(Boolean);
        const primaryFunction = normalizedFunctionNames[0] || dept.function_name.trim();
        const mergedFunctionNames = primaryFunction
          ? [...new Set([primaryFunction, ...normalizedFunctionNames])]
          : normalizedFunctionNames;
        return {
        id: genId(),
        department_id: dept.department_id,
        user_id: memberId,
        function_name: primaryFunction,
        function_names: mergedFunctionNames,
        joined_at: new Date().toISOString(),
      };
      });

      const { error: insertDMError } = await supabase
        .from("department_members")
        .insert(payload);

      if (insertDMError) throw insertDMError;
    }

    if (spouseId && spouseId !== member.spouse_id) {
      const { error: spouseSetError } = await supabase
        .from("users")
        .update({ spouse_id: memberId })
        .eq("id", spouseId)
        .eq("church_id", churchId);

      if (spouseSetError) {
        console.error("Erro ao vincular conjuge:", spouseSetError);
      }
    }

    if (!spouseId && member.spouse_id) {
      const { error: spouseClearError } = await supabase
        .from("users")
        .update({ spouse_id: null })
        .eq("id", member.spouse_id)
        .eq("church_id", churchId);

      if (spouseClearError) {
        console.error("Erro ao desvincular conjuge:", spouseClearError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API members/update error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao atualizar membro." },
      { status: 500 }
    );
  }
}
