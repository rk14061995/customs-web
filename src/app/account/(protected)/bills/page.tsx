"use client";

import { useEffect, useState } from "react";
import { FileText, Download, Loader2, Wallet } from "lucide-react";
import Card from "@/components/ui/Card";
import { formatCurrency, formatDate } from "@/lib/utils";

type Bill = {
  _id: string;
  billNumber: string;
  billDate: string;
  total: number;
  currency: string;
  status: string;
};

const statusColor: Record<string, string> = {
  paid: "bg-green-500/10 text-green-600 dark:text-green-400",
  cancelled: "bg-foreground/10 text-foreground/50",
  unpaid: "bg-orange/10 text-orange",
};

export default function AccountBillsPage() {
  const [bills, setBills] = useState<Bill[] | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const load = () => fetch("/api/account/bills").then((res) => res.json()).then(setBills);

  useEffect(() => {
    load();
  }, []);

  const payWithWallet = async (id: string) => {
    setMessage("");
    setPayingId(id);
    try {
      const res = await fetch(`/api/account/bills/${id}/pay-with-wallet`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error ?? "Payment failed.");
        return;
      }
      setMessage("Payment successful!");
      await load();
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Bills</h1>
        <p className="mt-1 text-sm text-foreground/60">Your invoices — pay outstanding ones from your wallet.</p>
      </div>

      {message && <p className="text-sm font-medium text-navy dark:text-white">{message}</p>}

      {bills === null ? (
        <p className="text-sm text-foreground/60">Loading…</p>
      ) : bills.length === 0 ? (
        <Card hover={false} className="text-center text-sm text-foreground/60">
          <FileText className="mx-auto mb-3 size-8 text-foreground/30" />
          No bills yet.
        </Card>
      ) : (
        <div className="space-y-3">
          {bills.map((bill) => (
            <Card key={bill._id} className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-heading font-semibold text-foreground">{bill.billNumber}</p>
                <p className="text-xs text-foreground/40">{formatDate(bill.billDate)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusColor[bill.status] ?? "bg-navy/10 text-navy dark:text-white"}`}>
                  {bill.status}
                </span>
                <p className="font-heading font-bold text-foreground">{formatCurrency(bill.total, bill.currency)}</p>
                <a
                  href={`/api/account/bills/${bill._id}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-navy transition-colors hover:bg-navy/5 dark:text-white dark:hover:bg-white/10"
                >
                  <Download className="size-4" /> PDF
                </a>
                {bill.status === "unpaid" && (
                  <button
                    onClick={() => payWithWallet(bill._id)}
                    disabled={payingId === bill._id}
                    className="flex items-center gap-1.5 rounded-full bg-orange px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-orange/25 transition-all hover:-translate-y-0.5 hover:bg-orange-dark disabled:pointer-events-none disabled:opacity-50"
                  >
                    {payingId === bill._id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <>
                        <Wallet className="size-4" /> Pay from Wallet
                      </>
                    )}
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
