import { NextResponse } from "next/server";
import { buildClearSessionCookie } from "@/lib/auth/server-session";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.headers.append("Set-Cookie", buildClearSessionCookie());
  return response;
}
