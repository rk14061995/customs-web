"use client";

import { useEffect, useState } from "react";
import { Wallet, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";

type Customer = { _id: string; name: string; email: string; walletBalance: number };

/** Support-desk tool: credit or debit a customer's wallet outside the normal
 * topup / pay-from-wallet flows (goodwill credits, correcting an error, etc.). */
export default function CustomerWalletAdjust() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [direction, setDirection] = useState<"credit" | "debit">("credit");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const load = () =>
    fetch("/api/admin/customers")
      .then((res) => res.json())
      .then(setCustomers);

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/customers/${customerId}/wallet-adjustment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction, amount: Number(amount), notes }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(typeof data.error === "string" ? data.error : "Adjustment failed.");
        return;
      }
      setMessage(`Done — new balance ₹${data.balance.toLocaleString("en-IN")}.`);
      setAmount("");
      setNotes("");
      await load();
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none focus:border-navy";

  return (
    <div className="rounded-3xl border border-border-subtle bg-background p-6 shadow-sm">
      <h2 className="mb-1 flex items-center gap-2 font-heading text-lg font-bold text-foreground">
        <Wallet className="size-5" /> Adjust Customer Wallet
      </h2>
      <p className="mb-4 text-sm text-foreground/60">
        Manual credit/debit for support cases. Always logged with your note.
      </p>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <select
          required
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          className={inputClass}
        >
          <option value="">Select customer…</option>
          {customers.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name} ({c.email}) — ₹{c.walletBalance.toLocaleString("en-IN")}
            </option>
          ))}
        </select>
        <select
          value={direction}
          onChange={(e) => setDirection(e.target.value as "credit" | "debit")}
          className={inputClass}
        >
          <option value="credit">Credit (add funds)</option>
          <option value="debit">Debit (remove funds)</option>
        </select>
        <input
          required
          type="number"
          min={1}
          step="0.01"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={inputClass}
        />
        <input
          required
          placeholder="Reason (required)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={inputClass}
        />
        <div className="sm:col-span-2">
          <Button type="submit" size="sm" disabled={saving || !customerId}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : "Apply Adjustment"}
          </Button>
          {message && <p className="mt-2 text-sm text-foreground/70">{message}</p>}
        </div>
      </form>
    </div>
  );
}
