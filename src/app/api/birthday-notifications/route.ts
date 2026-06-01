import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { sendUserNotification } from "@/lib/server/notification-service";

/**
 * POST /api/birthday-notifications
 *
 * Triggered daily by Vercel Cron (see vercel.json).
 * Finds all users whose birthday is today and notifies their cell leader.
 */
export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseServerClient();
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    // Use RPC function that queries birth_date by month/day
    const { data: birthdayUsers, error: birthdayError } = await supabase.rpc(
      "get_birthday_users",
      { p_month: month, p_day: day }
    );

    if (birthdayError) {
      console.error("Birthday query error:", birthdayError);
      return NextResponse.json({ error: birthdayError.message }, { status: 500 });
    }

    const users = (birthdayUsers ?? []) as Array<{ id: string; name: string; church_id: string }>;

    let notificationsSent = 0;

    for (const person of users) {
      // Find active cell membership
      const { data: membership } = await supabase
        .from("cell_members")
        .select("cell_id")
        .eq("user_id", person.id)
        .eq("status", "active")
        .maybeSingle();

      if (!membership?.cell_id) continue;

      // Find cell and its leader
      const { data: cell } = await supabase
        .from("cells")
        .select("leader_id, name")
        .eq("id", membership.cell_id)
        .maybeSingle();

      const leaderId = (cell as { leader_id?: string | null; name?: string } | null)?.leader_id;
      if (!leaderId || leaderId === person.id) continue;

      try {
        await sendUserNotification({
          userId: leaderId,
          churchId: person.church_id,
          title: "🎂 Aniversário hoje!",
          body: `${person.name} faz aniversário hoje. Que tal enviar uma mensagem de parabéns?`,
          actionUrl: `/membros/${person.id}`,
          type: "info",
        });
        notificationsSent++;
      } catch (err) {
        console.error(`Failed to notify leader for ${person.name}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      birthdayCount: users.length,
      notificationsSent,
    });
  } catch (error) {
    console.error("birthday-notifications error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    );
  }
}
