import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiActor } from "@/lib/auth/api-session";
import { can } from "@/lib/auth/permissions";
import { genId } from "@/lib/utils/helpers";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const REST = `${SUPABASE_URL}/rest/v1`;
const headers = {
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "return=minimal",
};

async function dbGet(table: string, filter: string) {
  const res = await fetch(`${REST}/${table}?${filter}`, { headers, cache: "no-store" });
  if (!res.ok) throw new Error(`${table} GET failed: ${res.status}`);
  return res.json();
}

async function dbPost(table: string, body: object) {
  const res = await fetch(`${REST}/${table}`, { method: "POST", headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const msg = await res.text().catch(() => String(res.status));
    throw new Error(`${table} INSERT failed: ${msg}`);
  }
}

async function dbPatch(table: string, filter: string, body: object) {
  const res = await fetch(`${REST}/${table}?${filter}`, { method: "PATCH", headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const msg = await res.text().catch(() => String(res.status));
    throw new Error(`${table} UPDATE failed: ${msg}`);
  }
}

async function dbDelete(table: string, filter: string) {
  const res = await fetch(`${REST}/${table}?${filter}`, { method: "DELETE", headers });
  if (!res.ok) {
    const msg = await res.text().catch(() => String(res.status));
    throw new Error(`${table} DELETE failed: ${msg}`);
  }
}

const departmentDataSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().default(""),
  icon: z.string().min(1),
  color: z.string().min(1),
  function_names: z.array(z.string().trim().min(1)).default([]),
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

      const newDeptId = genId();
      const now = new Date().toISOString();

      await dbPost("departments", {
        id: newDeptId,
        church_id: churchId,
        ...data,
        active: true,
        created_at: now,
      });

      const leaderIds: string[] = data.leader_ids ?? [];
      if (leaderIds.length > 0) {
        const memberRows = leaderIds.map((userId) => ({
          id: genId(),
          department_id: newDeptId,
          user_id: userId,
          function_name: "Líder",
          function_names: ["Líder"],
          joined_at: now,
        }));
        await dbPost("department_members", memberRows);
      }

      return NextResponse.json({ success: true });
    }

    if (!departmentId) {
      return NextResponse.json({ error: "Ministerio nao informado." }, { status: 400 });
    }

    const rows = await dbGet("departments", `select=id,church_id&id=eq.${departmentId}&church_id=eq.${churchId}`);
    if (!rows.length) {
      return NextResponse.json({ error: "Ministerio nao encontrado." }, { status: 404 });
    }

    if (mode === "update") {
      if (!data) {
        return NextResponse.json({ error: "Dados do ministerio sao obrigatorios." }, { status: 400 });
      }
      await dbPatch("departments", `id=eq.${departmentId}&church_id=eq.${churchId}`, data);
      return NextResponse.json({ success: true });
    }

    await dbDelete("department_members", `department_id=eq.${departmentId}`);
    await dbDelete("departments", `id=eq.${departmentId}&church_id=eq.${churchId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API departments/manage error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao gerenciar ministerio." },
      { status: 500 }
    );
  }
}
