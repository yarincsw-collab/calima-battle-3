import { NextResponse } from "next/server";
import { chargeToken } from "@/lib/icredit";
import { findRegistration, updateRegistrationStatus } from "@/lib/googleSheets";

export const runtime = "nodejs";

/**
 * Admin-only endpoint. Charges a single registration's saved token.
 * Reads the registration from Google Sheets, charges via iCount, and
 * updates the sheet row to `charged` (or `payment_failed`).
 *
 *   POST /api/payment/charge
 *   Headers: x-admin-key: <ADMIN_API_KEY>
 *   Body:    { "registrationId": "..." }
 */
export async function POST(req: Request) {
  const adminKey = req.headers.get("x-admin-key");
  if (!process.env.ADMIN_API_KEY || adminKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { registrationId } = (await req.json().catch(() => ({}))) as { registrationId?: string };
  if (!registrationId) {
    return NextResponse.json({ error: "registrationId required" }, { status: 400 });
  }

  const reg = await findRegistration(registrationId);
  if (!reg) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (reg.paymentStatus === "charged") {
    return NextResponse.json({ ok: true, alreadyCharged: true });
  }
  if (reg.paymentStatus !== "approved") {
    return NextResponse.json(
      { error: "not_approved", currentStatus: reg.paymentStatus },
      { status: 400 }
    );
  }
  if (reg.totalPrice === 0) {
    await updateRegistrationStatus(reg.registrationId, {
      paymentStatus: "charged",
      notes: "Free category — no charge required",
    });
    return NextResponse.json({ ok: true, free: true });
  }
  if (!reg.paymentToken) {
    return NextResponse.json({ error: "no_token" }, { status: 400 });
  }

  try {
    const result = await chargeToken({
      ccToken: reg.paymentToken,
      amount: reg.totalPrice,
      registrationId: reg.registrationId,
      customerName: reg.fullName,
      customerEmail: reg.email,
      itemDescription: `Calima Battles 3 — ${reg.categories}`,
    });

    await updateRegistrationStatus(reg.registrationId, {
      paymentStatus: result.approved ? "charged" : "payment_failed",
      notes: result.approved
        ? `Receipt #${result.docNumber ?? result.transactionId}`
        : result.message ?? "charge failed",
    });

    return NextResponse.json(result, { status: result.approved ? 200 : 402 });
  } catch (err) {
    await updateRegistrationStatus(reg.registrationId, {
      paymentStatus: "payment_failed",
      notes: (err as Error).message,
    });
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
