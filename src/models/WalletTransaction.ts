import { Schema, model, models, Types, type Document } from "mongoose";

export const WALLET_TXN_TYPES = ["topup", "debit", "refund", "adjustment"] as const;
export const WALLET_TXN_STATUSES = ["pending", "completed", "failed"] as const;
export const WALLET_TXN_DIRECTIONS = ["credit", "debit"] as const;

export interface IWalletTransaction extends Document {
  customer: Types.ObjectId;
  type: (typeof WALLET_TXN_TYPES)[number];
  /** Whether this transaction increased ("credit") or decreased ("debit") the wallet balance.
   *  Implied by `type` for topup/refund (credit) and debit (debit) — explicit here mainly so
   *  admin "adjustment" entries (which can go either way) are unambiguous. */
  direction: (typeof WALLET_TXN_DIRECTIONS)[number];
  /** Always positive — `direction` determines whether it credited or debited the balance. */
  amount: number;
  /** Customer.walletBalance immediately after this transaction was applied. Unset while pending. */
  balanceAfter?: number;
  status: (typeof WALLET_TXN_STATUSES)[number];
  /** Set for debits that settle a specific shipment Payment. */
  relatedPayment?: Types.ObjectId;
  /** Set for debits that settle a specific Bill. */
  relatedBill?: Types.ObjectId;
  /** Set for topups — the Cashfree payment link id, prefixed WALLETTOPUP- so the webhook can route to this model. */
  cashfreeLinkId?: string;
  notes?: string;
  createdAt: Date;
}

const WalletTransactionSchema = new Schema<IWalletTransaction>(
  {
    customer: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    type: { type: String, enum: WALLET_TXN_TYPES, required: true },
    direction: { type: String, enum: WALLET_TXN_DIRECTIONS, required: true },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number },
    status: { type: String, enum: WALLET_TXN_STATUSES, default: "pending" },
    relatedPayment: { type: Schema.Types.ObjectId, ref: "Payment" },
    relatedBill: { type: Schema.Types.ObjectId, ref: "Bill" },
    cashfreeLinkId: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

WalletTransactionSchema.index({ customer: 1, createdAt: -1 });
// Enforces "at most one successful debit per Payment/Bill" without needing a multi-document
// transaction: two concurrent pay-from-wallet calls both pass the balance check, but only one
// can insert here — the loser's route handler catches the duplicate-key error and refunds itself.
WalletTransactionSchema.index(
  { relatedPayment: 1 },
  { unique: true, partialFilterExpression: { relatedPayment: { $exists: true } } }
);
WalletTransactionSchema.index(
  { relatedBill: 1 },
  { unique: true, partialFilterExpression: { relatedBill: { $exists: true } } }
);

export default models.WalletTransaction ||
  model<IWalletTransaction>("WalletTransaction", WalletTransactionSchema);
