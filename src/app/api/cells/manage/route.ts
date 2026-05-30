import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiActor } from "@/lib/auth/api-session";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { genId } from "@/lib/utils/helpers";

const healthSchema = z.object({
  frequency: z.number().min(0).max(100),
  communion: z.number().min(0).max(100),
  participation: z.number().min(0).max(100),
  growth: z.number().min(0).max(100),
  engagement: z.number().min(0).max(100),
  care: z.number().min(0).max(100),
});

const cellDataSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().default(""),
  cover_color: z.string().default("#FF6B57"),
  leader_id: z.string().nullable().default(null),
  co_leader_id: z.string().nullable().default(null),
  supervisor_id: z.string().nullable().default(null),
  address: z.string().default(""),
  week_day: z.string().default(""),
  time: z.string().default(""),
  max_members: z.number().int().min(0).default(12),
  audience: z.string().default(""),
  status: z.enum(["active", "paused", "multiplying"]).default("active"),
  health: healthSchema.optional(),
});

const bodySchema = z.object({
  mode: z.enum(["create", "update", "delete"]),
  cellId: z.string().optional(),
  data: cellDataSchema.optional(),
  memberIds: z.array(z.string()).default([]),
});

export async function POST(req: Request) {
  try {
    const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos para gerenciar célula." }, { status: 400 });
    }

    const { actor, session, errorResponse } = await requireApiActor(req);
    if (errorResponse) return errorResponse;

    const churchId = session!.church_id;
    const { mode, cellId, data, memberIds } = parsed.data;
    const supabase = getSupabaseServerClient();

    if (!actor?.active) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }
    if (actor.role === "member") {
      return NextResponse.json({ error: "Sem permissão para gerenciar células." }, { status: 403 });
    }

    // unique member ids excluding the leaders (leaders are members implicitly)
    const memberRows = (cellTargetId: string) => {
      const leaders = [data?.leader_id, data?.co_leader_id].filter(Boolean) as string[];
      const unique = Array.from(new Set([...leaders, ...memberIds]));
      const now = new Date().toISOString();
      return unique.map((uid) => ({
        id: genId(),
        cell_id: cellTargetId,
        user_id: uid,
        status: "active",
        joined_at: now,
      }));
    };

    if (mode === "create") {
      if (!data) {
        return NextResponse.json({ error: "Dados da célula são obrigatórios." }, { status: 400 });
      }
      const newId = genId();
      const { error } = await supabase.from("cells").insert({
        id: newId,
        church_id: churchId,
        ...data,
        created_at: new Date().toISOString(),
      });
      if (error) throw error;

      const rows = memberRows(newId);
      if (rows.length > 0) {
        const { error: cmError } = await supabase.from("cell_members").insert(rows);
        if (cmError) throw cmError;
      }
      return NextResponse.json({ success: true, id: newId });
    }

    if (!cellId) {
      return NextResponse.json({ error: "Célula não informada." }, { status: 400 });
    }

    const { data: cell, error: cellError } = await supabase
      .from("cells")
      .select("id, church_id")
      .eq("id", cellId)
      .eq("church_id", churchId)
      .maybeSingle();
    if (cellError) throw cellError;
    if (!cell) {
      return NextResponse.json({ error: "Célula não encontrada." }, { status: 404 });
    }

    if (mode === "update") {
      if (!data) {
        return NextResponse.json({ error: "Dados da célula são obrigatórios." }, { status: 400 });
      }
      const { error } = await supabase
        .from("cells")
        .update(data)
        .eq("id", cellId)
        .eq("church_id", churchId);
      if (error) throw error;

      // replace member set
      const { error: delError } = await supabase.from("cell_members").delete().eq("cell_id", cellId);
      if (delError) throw delError;
      const rows = memberRows(cellId);
      if (rows.length > 0) {
        const { error: cmError } = await supabase.from("cell_members").insert(rows);
        if (cmError) throw cmError;
      }
      return NextResponse.json({ success: true });
    }

    // delete
    const { error: delMembersError } = await supabase.from("cell_members").delete().eq("cell_id", cellId);
    if (delMembersError) throw delMembersError;
    const { error: delCellError } = await supabase
      .from("cells")
      .delete()
      .eq("id", cellId)
      .eq("church_id", churchId);
    if (delCellError) throw delCellError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API cells/manage error:", error);
    const message = error instanceof Error ? error.message : "Falha ao gerenciar célula.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
