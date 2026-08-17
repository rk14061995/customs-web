import Customer from "@/models/Customer";
import WalletTransaction from "@/models/WalletTransaction";

type DebitResult =
  | { ok: true; balanceAfter: number }
  | { ok: false; status: 400 | 409; error: string };

/**
 * Debits a customer's wallet to settle exactly one Payment or Bill, without relying on a
 * multi-document transaction (local/prod Mongo topology isn't guaranteed to be a replica set).
 *
 * Safety comes from two atomic, single-document operations plus a compensating refund:
 *  1. `findOneAndUpdate` with a `walletBalance >= amount` guard — the DB serializes concurrent
 *     writes to the same Customer document, so at most as many debits succeed as the balance
 *     actually covers.
 *  2. A partial-unique index on WalletTransaction.relatedPayment/relatedBill (see the model) —
 *     if two concurrent requests were both trying to settle the *same* Payment/Bill and both
 *     passed step 1 (possible if the balance covered both), only one `create` here can win. The
 *     loser's balance was already decremented, so it refunds itself and reports a conflict.
 */
export async function debitWalletForRelatedDoc({
  customerId,
  amount,
  relatedField,
  relatedId,
}: {
  customerId: string;
  amount: number;
  relatedField: "relatedPayment" | "relatedBill";
  relatedId: string;
}): Promise<DebitResult> {
  const updated = await Customer.findOneAndUpdate(
    { _id: customerId, walletBalance: { $gte: amount } },
    { $inc: { walletBalance: -amount } },
    { new: true }
  );
  if (!updated) {
    return { ok: false, status: 400, error: "Insufficient wallet balance." };
  }

  try {
    await WalletTransaction.create({
      customer: customerId,
      type: "debit",
      direction: "debit",
      amount,
      balanceAfter: updated.walletBalance,
      status: "completed",
      [relatedField]: relatedId,
    });
  } catch (err) {
    // Duplicate key on the partial unique index — someone else already settled this
    // Payment/Bill from wallet in the same window. Undo our decrement and bail out.
    await Customer.findByIdAndUpdate(customerId, { $inc: { walletBalance: amount } });
    const isDuplicate =
      typeof err === "object" && err !== null && "code" in err && (err as { code?: number }).code === 11000;
    if (isDuplicate) {
      return { ok: false, status: 409, error: "This was already paid from your wallet." };
    }
    throw err;
  }

  return { ok: true, balanceAfter: updated.walletBalance };
}
