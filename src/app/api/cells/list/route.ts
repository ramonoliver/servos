import { NextResponse } from "next/server";
import { requireApiActor } from "@/lib/auth/api-session";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { session, errorResponse } = await requireApiActor(req);
    if (errorResponse) return errorResponse;

    const churchId = session!.church_id;
    const supabase = getSupabaseServerClient();

    const { data: cells, error: cellsError } = await supabase
      .from("cells")
      .select("*")
      .eq("church_id", churchId)
      .order("created_at", { ascending: false });
    if (cellsError) throw cellsError;

    const cellIds = (cells || []).map((c: { id: string }) => c.id);
    const { data: cellMembers, error: cmError } = cellIds.length
      ? await supabase.from("cell_members").select("*").in("cell_id", cellIds)
      : { data: [], error: null };
    if (cmError) throw cmError;

    return NextResponse.json({ cells: cells || [], cellMembers: cellMembers || [] });
  } catch (error) {
    console.error("API cells/list error:", error);
    const message = error instanceof Error ? error.message : "Falha ao carregar células.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
