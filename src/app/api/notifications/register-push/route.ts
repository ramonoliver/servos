import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiActor } from "@/lib/auth/api-session";
import { registerPushToken } from "@/lib/server/notification-service";

const bodySchema = z.object({
  token: z.string().min(1),
  platform: z.enum(["web", "android", "ios", "unknown"]).default("web"),
  deviceName: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados invalidos para registro de push." }, { status: 400 });
    }

    const { actor, errorResponse } = await requireApiActor(req);
    if (errorResponse) return errorResponse;
    if (!actor) {
      return NextResponse.json({ error: "Usuario nao autenticado." }, { status: 401 });
    }

    await registerPushToken({
      userId: actor.id,
      churchId: actor.church_id,
      token: parsed.data.token,
      platform: parsed.data.platform,
      deviceName: parsed.data.deviceName || null,
    });

    return NextResponse.json({ success: true, message: "Dispositivo registrado para notificações." });
  } catch (error) {
    console.error("API register-push error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao registrar push." },
      { status: 500 }
    );
  }
}
