"use client";

import { useEffect, useState } from "react";
import { Wallet, Loader2, ArrowDownCircle, ArrowUpCircle, RefreshCcw, SlidersHorizontal } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

type WalletTransaction = {
  _id: string;
  type: "topup" | "debit" | "refund" | "adjustment";
  direction: "credit" | "debit";
  amount: number;
  status: "pending" | "completed" | "failed";
  createdAt: string;
  notes?: string;
};

type Payment = {
  _id: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: string;
  shipment?: { trackingNumber?: string } | null;
};

const typeMeta: Record<WalletTransaction["type"], { label: string; icon: typeof ArrowDownCircle; color: string }> = {
  topup: { label: "Added Funds", icon: ArrowDownCircle, color: "text-green-600 dark:text-green-400" },
  debit: { label: "Payment", icon: ArrowUpCircle, color: "text-red-500" },
  refund: { label: "Refund", icon: RefreshCcw, color: "text-green-600 dark:text-green-400" },
  adjustment: { label: "Adjustment", icon: SlidersHorizontal, color: "text-navy dark:text-white" },
};

export default function AccountWalletPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [amount, setAmount] = useState("500");
  const [loadingTopup, setLoadingTopup] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadWallet = () =>
    fetch("/api/account/wallet")
      .then((res) => res.json())
      .then((data) => {
        setBalance(data.balance);
        setTransactions(data.transactions);
      });

  const loadPayments = () =>
    fetch("/api/account/payments")
      .then((res) => res.json())
      .then((data: Payment[]) => setPayments(data.filter((p) => p.status !== "paid" && p.status !== "refunded")));

  useEffect(() => {
    loadWallet();
    loadPayments();
  }, []);

  const handleTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoadingTopup(true);
    try {
      const res = await fetch("/api/account/wallet/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not start the top-up.");
        return;
      }
      window.location.href = data.linkUrl;
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoadingTopup(false);
    }
  };

  const payWithWallet = async (id: string) => {
    setPayingId(id);
    try {
      const res = await fetch(`/api/account/payments/${id}/pay-with-wallet`, { method: "POST" });
      if (res.ok) {
        await Promise.all([loadWallet(), loadPayments()]);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Payment failed.");
      }
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Wallet</h1>
        <p className="mt-1 text-sm text-foreground/60">Add funds and pay for shipments instantly.</p>
      </div>

      <Card hover={false} className="bg-navy text-white">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-white/10">
              <Wallet className="size-7" />
            </span>
            <div>
              <p className="text-xs font-medium text-white/70">Available Balance</p>
              <p className="font-heading text-3xl font-bold">
                {balance === null ? "…" : formatCurrency(balance)}
              </p>
            </div>
          </div>

          <form onSubmit={handleTopup} className="flex items-center gap-2">
            <input
              type="number"
              min={100}
              step={100}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-32 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/50 focus:border-white/50"
            />
            <Button type="submit" variant="primary" disabled={loadingTopup} icon={loadingTopup ? undefined : Wallet}>
              {loadingTopup ? <Loader2 className="size-4 animate-spin" /> : "Add Funds"}
            </Button>
          </form>
        </div>
        {error && <p className="mt-3 text-sm text-orange-100">{error}</p>}
      </Card>

      {payments.length > 0 && (
        <Card hover={false}>
          <h2 className="mb-4 font-heading text-lg font-bold text-foreground">Payments Due</h2>
          <div className="space-y-3">
            {payments.map((payment) => (
              <div
                key={payment._id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-subtle p-3 text-sm"
              >
                <div>
                  <p className="font-semibold text-foreground">{payment.invoiceNumber}</p>
                  <p className="text-foreground/60">{payment.shipment?.trackingNumber}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-heading font-bold text-foreground">
                    {formatCurrency(payment.amount, payment.currency)}
                  </p>
                  <button
                    onClick={() => payWithWallet(payment._id)}
                    disabled={payingId === payment._id}
                    className="flex items-center gap-1.5 rounded-full bg-orange px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-orange/25 transition-all hover:-translate-y-0.5 hover:bg-orange-dark disabled:pointer-events-none disabled:opacity-50"
                  >
                    {payingId === payment._id ? <Loader2 className="size-4 animate-spin" /> : "Pay from Wallet"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card hover={false}>
        <h2 className="mb-4 font-heading text-lg font-bold text-foreground">Transaction History</h2>
        {transactions.length === 0 ? (
          <p className="text-sm text-foreground/60">No transactions yet.</p>
        ) : (
          <div className="space-y-2">
            {transactions.map((txn) => {
              const meta = typeMeta[txn.type];
              const Icon = meta.icon;
              const isCredit = txn.direction === "credit";
              return (
                <div key={txn._id} className="flex items-center justify-between rounded-xl border border-border-subtle p-3 text-sm">
                  <div className="flex items-center gap-3">
                    <Icon className={cn("size-5", meta.color)} />
                    <div>
                      <p className="font-medium text-foreground">{meta.label}</p>
                      <p className="text-xs text-foreground/50">
                        {formatDate(txn.createdAt)}
                        {txn.status !== "completed" ? ` · ${txn.status}` : ""}
                      </p>
                    </div>
                  </div>
                  <p className={cn("font-heading font-bold", isCredit ? "text-green-600 dark:text-green-400" : "text-foreground")}>
                    {isCredit ? "+" : "-"}
                    {formatCurrency(txn.amount)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
