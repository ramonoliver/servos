/**
 * sms-provider.ts
 * Twilio SMS provider — server-side only.
 * Never import this file in client components.
 */

import twilio from "twilio";
import type { ChannelResult } from "./notification-types";
import { isValidE164, normalizePhoneNumber } from "./validators";

// ─── Singleton ────────────────────────────────────────────────────────────────

let _client: ReturnType<typeof twilio> | null = null;

function getTwilioClient(): ReturnType<typeof twilio> {
  if (_client) return _client;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error(
      "Twilio credentials are not configured (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN)."
    );
  }

  _client = twilio(accountSid, authToken);
  return _client;
}

// ─── Send SMS ─────────────────────────────────────────────────────────────────

export interface SendSmsInput {
  to: string;
  body: string;
}

/**
 * Sends an SMS via Twilio.
 * Priority: Messaging Service SID → Phone Number fallback.
 */
export async function sendSms(input: SendSmsInput): Promise<ChannelResult> {
  if (process.env.NOTIFICATIONS_SMS_ENABLED !== "true") {
    return { status: "skipped", error: "SMS notifications are disabled." };
  }

  const normalized = normalizePhoneNumber(input.to);
  if (!normalized || !isValidE164(normalized)) {
    return { status: "skipped", error: `Invalid phone number: ${input.to}` };
  }

  const body = input.body.trim();
  if (!body) {
    return { status: "failed", error: "SMS body cannot be empty." };
  }

  // Truncate to Twilio's 1600-char SMS limit
  const safeBbody = body.length > 1600 ? body.slice(0, 1597) + "..." : body;

  try {
    const client = getTwilioClient();
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    let message: { sid: string };

    if (messagingServiceSid) {
      // ── Primary: Messaging Service SID ─────────────────────────────────────
      message = await client.messages.create({
        to: normalized,
        body: safeBbody,
        messagingServiceSid,
      });
    } else if (fromNumber) {
      // ── Fallback: direct phone number ───────────────────────────────────────
      message = await client.messages.create({
        to: normalized,
        from: fromNumber,
        body: safeBbody,
      });
    } else {
      return {
        status: "failed",
        error:
          "No Twilio sender configured (TWILIO_MESSAGING_SERVICE_SID or TWILIO_PHONE_NUMBER).",
      };
    }

    return { status: "sent", messageId: message.sid };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    // Never log the full error object — it may contain credentials in stack traces
    console.error("[sms-provider] send failed:", errorMessage);
    return { status: "failed", error: errorMessage };
  }
}
