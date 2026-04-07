import { NextResponse } from "next/server";
import { decodeSessionToken, getSessionFromCookieHeader } from "@/lib/auth/server-session";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type RequireActorOptions = {
  select?: string;
};

export function requireApiSession(req: Request) {
  const session =
    getSessionFromCookieHeader(req.headers.get("cookie")) ||
    decodeSessionToken(req.headers.get("x-servos-auth"));

  if (!session) {
    return {
      session: null,
      errorResponse: NextResponse.json({ error: "Sessao expirada. Entre novamente." }, { status: 401 }),
    };
  }

  return { session, errorResponse: null };
}

export async function requireApiActor(req: Request, options: RequireActorOptions = {}) {
  const { session, errorResponse } = requireApiSession(req);
  if (!session) {
    return { session: null, actor: null, errorResponse };
  }

  const supabase = getSupabaseServerClient();
  const { data: actor, error } = await supabase
    .from("users")
    .select(options.select || "id, role, church_id, active")
    .eq("id", session.user_id)
    .eq("church_id", session.church_id)
    .maybeSingle();

  if (error) {
    return {
      session,
      actor: null,
      errorResponse: NextResponse.json({ error: error.message }, { status: 500 }),
    };
  }

  if (!actor) {
    return {
      session,
      actor: null,
      errorResponse: NextResponse.json({ error: "Usuario autenticado nao encontrado." }, { status: 401 }),
    };
  }

  return { session, actor, errorResponse: null };
}
