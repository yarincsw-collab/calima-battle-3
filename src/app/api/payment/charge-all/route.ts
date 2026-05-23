import { NextResponse } from "next/server";
import { chargeToken } from "@/lib/icount";
import { loadAllRegistrations, updateRegistrationStatus } from "@/lib/googleSheets";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 min — gives us headroom for ~60 charges sequentially

/**
 * Bulk charge: iterates every row in the Sheet where Payment Status =
 * "approved", charges each via iCount, and updates the row to "charged"
 * or "payment_failed". Use on 16.7 to run the whole batch in one click.
 *
 *   POST /api/payment/charge-all
 *   Headers: x-admin-key: <ADMIN_API_KEY>
 *
 * Response:
 *   { ok: true, summary: { total, charged, failed, skipped }, results: [...] }
 */
export async function POST(req: Request) {
  const adminKey = req.headers.get("x-admin-key");
  if (!process.env.ADMIN_API_KEY || adminKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const all = await loadAllRegistrations();
  const approved = all.filter((r) => r.paymentStatus === "approved");

  const results: Array<{
    registrationId: string;
    name: string;
    status: "charged" | "failed" | "skipped";
    reason?: string;
    docNumber?: string;
  }> = [];

  for (const reg of approved) {
    if (reg.totalPrice === 0) {
      await updateRegistrationStatus(reg.registrationId, {
        paymentStatus: "charged",
        notes: "Free category — no charge required",
      });
      results.push({
        registrationId: reg.registrationId,
        name: reg.fullName,
        status: "charged",
        reason: "free",
      });
      continue;
    }
    if (!reg.paymentToken) {
      results.push({
        registrationId: reg.registrationId,
        name: reg.fullName,
        status: "skipped",
        reason: "missing token",
      });
      continue;
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
      results.push({
        registrationId: reg.registrationId,
        name: reg.fullName,
        status: result.approved ? "charged" : "failed",
        reason: result.message,
        docNumber: result.docNumber,
      });
    } catch (err) {
      await updateRegistrationStatus(reg.registrationId, {
        paymentStatus: "payment_failed",
        notes: (err as Error).message,
      });
      results.push({
        registrationId: reg.registrationId,
        name: reg.fullName,
        status: "failed",
        reason: (err as Error).message,
      });
    }
  }

  return NextResponse.json({
    ok: true,
    summary: {
      total: approved.length,
      charged: results.filter((r) => r.status === "charged").length,
      failed: results.filter((r) => r.status === "failed").length,
      skipped: results.filter((r) => r.status === "skipped").length,
    },
    results,
  });
}
