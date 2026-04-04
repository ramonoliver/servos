import { NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/email/send";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { to, memberName, churchName, tempPassword } = body;

    if (!to || !memberName || !churchName || !tempPassword) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await sendWelcomeEmail({
      to,
      memberName,
      churchName,
      tempPassword,
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("API send-welcome-email error:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}