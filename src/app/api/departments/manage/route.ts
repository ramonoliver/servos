import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiActor } from "@/lib/auth/api-session";
import { can } from "@/lib/auth/permissions";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { genId } from "@/lib/utils/helpers";

const departmentDataSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().default(""),
  icon: z.string().min(1),
  color: z.string().min(1),
  leader_ids: z.array(z.string()).default([]),
  co_leader_ids: z.array(z.string()).default([]),
});

const bodySchema = z.object({
  mode: z.enum(["create", "update", "delete"]),
  departmentId: z.string().optional(),
  data: departmentDataSchema.optional(),
});

export async function POST(req: Request) {
  try {
    const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados invalidos para gerenciar ministerio." }, { status: 400 });
    }

    const { actor, session, errorResponse } = await requireApiActor(req);
    if (errorResponse) return errorResponse;

    const churchId = session!.church_id;
    const { mode, departmentId, data } = parsed.data;
    const supabase = getSupabaseServerClient();
    if (!actor?.active) {
      return NextResponse.json({ error: "Usuario nao encontrado." }, { status: 404 });
    }

    const requiredAction =
      mode === "create" ? "department.create" : mode === "update" ? "department.edit" : "department.delete";

    if (!can(actor.role, requiredAction)) {
      return NextResponse.json({ error: "Sem permissao para gerenciar ministerios." }, { status: 403 });
    }

    if (mode === "create") {
      if (!data) {
        return NextResponse.json({ error: "Dados do ministerio sao obrigatorios." }, { status: 400 });
      }

      const { error } = await supabase.from("departments").insert({
        id: genId(),
        church_id: churchId,
        ...data,
        active: true,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (!departmentId) {
      return NextResponse.json({ error: "Ministerio nao informado." }, { status: 400 });
    }

    const { data: department, error: departmentError } = await supabase
      .from("departments")
      .select("id, church_id")
      .eq("id", departmentId)
      .eq("church_id", churchId)
      .maybeSingle();

    if (departmentError) throw departmentError;
    if (!department) {
      return NextResponse.json({ error: "Ministerio nao encontrado." }, { status: 404 });
    }

    if (mode === "update") {
      if (!data) {
        return NextResponse.json({ error: "Dados do ministerio sao obrigatorios." }, { status: 400 });
      }

      const { error } = await supabase
        .from("departments")
        .update(data)
        .eq("id", departmentId)
        .eq("church_id", churchId);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    const { error: deleteDMError } = await supabase
      .from("department_members")
      .delete()
      .eq("department_id", departmentId);

    if (deleteDMError) throw deleteDMError;

    const { error: deleteDepartmentError } = await supabase
      .from("departments")
      .delete()
      .eq("id", departmentId)
      .eq("church_id", churchId);

    if (deleteDepartmentError) throw deleteDepartmentError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API departments/manage error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao gerenciar ministerio." },
      { status: 500 }
    );
  }
}
