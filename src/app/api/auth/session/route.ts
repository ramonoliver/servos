import { NextResponse } from "next/server";
import { getSessionFromCookieHeader } from "@/lib/auth/server-session";

export async function GET(req: Request) {
  const session = getSessionFromCookieHeader(req.headers.get("cookie"));
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({ authenticated: true, session });
}
