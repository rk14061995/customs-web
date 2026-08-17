import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/dbConnect";
import Customer from "@/models/Customer";
import WalletTransaction from "@/models/WalletTransaction";
import { getAdminSession } from "@/lib/auth";

const adjustmentSchema = z.object({
  direction: z.enum(["credit", "debit"]),
  amount: z.number().positive(),
  notes: z.string().min(1, "A note is required for wallet adjustments"),
});

/** Manual wallet credit/debit for support cases (e.g. goodwill credit, correcting an error) —
 * outside the normal topup/pay-from-wallet flows, so it's admin-only and always requires a note. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = adjustmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await dbConnect();
  const { direction, amount, notes } = parsed.data;
  const delta = direction === "credit" ? amount : -amount;

  const updated = await Customer.findOneAndUpdate(
    direction === "debit" ? { _id: id, walletBalance: { $gte: amount } } : { _id: id },
    { $inc: { walletBalance: delta } },
    { new: true }
  );
  if (!updated) {
    return NextResponse.json(
      { error: direction === "debit" ? "Customer's wallet balance is lower than the debit amount." : "Customer not found." },
      { status: 400 }
    );
  }

  const transaction = await WalletTransaction.create({
    customer: id,
    type: "adjustment",
    direction,
    amount,
    balanceAfter: updated.walletBalance,
    status: "completed",
    notes: `${notes} (by admin ${session.name})`,
  });

  return NextResponse.json({ balance: updated.walletBalance, transaction });
}
