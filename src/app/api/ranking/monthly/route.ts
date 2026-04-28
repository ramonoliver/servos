import { NextResponse } from "next/server";
import { requireApiActor } from "@/lib/auth/api-session";
import { getMonthlyRanking, refreshMonthlyRanking } from "@/lib/server/ranking-service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { actor, errorResponse } = await requireApiActor(req);
    if (errorResponse) return errorResponse;
    if (!actor) {
      return NextResponse.json({ error: "Usuario nao autenticado." }, { status: 401 });
    }

    const url = new URL(req.url);
    const month = url.searchParams.get("month") || new Date().toISOString().slice(0, 7);
    const departmentId = url.searchParams.get("departmentId") || undefined;

    const ranking = await getMonthlyRanking(actor.church_id, month, departmentId);
    if (!departmentId) {
      void refreshMonthlyRanking(actor.church_id, month).catch((error) => {
        console.error("Falha ao atualizar cache de ranking:", error);
      });
    }
    return NextResponse.json({ success: true, ranking, month });
  } catch (error) {
    console.error("API ranking/monthly error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao buscar ranking." },
      { status: 500 }
    );
  }
}
