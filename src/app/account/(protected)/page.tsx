"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Wallet, Package, Receipt, ArrowRight, CreditCard } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/utils";

type Shipment = {
  _id: string;
  trackingNumber: string;
  status: string;
  origin: string;
  destination: string;
  createdAt: string;
};

type Payment = {
  _id: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: string;
  shipment?: { trackingNumber?: string } | null;
};

export default function AccountOverviewPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [orders, setOrders] = useState<Shipment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [walletRes, ordersRes, paymentsRes] = await Promise.all([
        fetch("/api/account/wallet"),
        fetch("/api/account/orders"),
        fetch("/api/account/payments"),
      ]);
      if (walletRes.ok) setBalance((await walletRes.json()).balance);
      if (ordersRes.ok) setOrders(await ordersRes.json());
      if (paymentsRes.ok) setPayments(await paymentsRes.json());
      setLoading(false);
    }
    load();
  }, []);

  const outstanding = payments.filter((p) => p.status !== "paid" && p.status !== "refunded");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Welcome back</h1>
        <p className="mt-1 text-sm text-foreground/60">Here&apos;s a snapshot of your account.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card hover={false} className="flex items-center gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-orange/10 text-orange">
            <Wallet className="size-6" />
          </span>
          <div>
            <p className="text-xs font-medium text-foreground/50">Wallet Balance</p>
            <p className="font-heading text-xl font-bold text-foreground">
              {loading ? "…" : formatCurrency(balance ?? 0)}
            </p>
          </div>
        </Card>
        <Card hover={false} className="flex items-center gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-navy/10 text-navy dark:text-white">
            <Package className="size-6" />
          </span>
          <div>
            <p className="text-xs font-medium text-foreground/50">Total Orders</p>
            <p className="font-heading text-xl font-bold text-foreground">{loading ? "…" : orders.length}</p>
          </div>
        </Card>
        <Card hover={false} className="flex items-center gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
            <Receipt className="size-6" />
          </span>
          <div>
            <p className="text-xs font-medium text-foreground/50">Payments Due</p>
            <p className="font-heading text-xl font-bold text-foreground">
              {loading ? "…" : outstanding.length}
            </p>
          </div>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button href="/account/wallet" icon={Wallet} size="sm">
          Add Funds
        </Button>
        <Button href="/account/pay-for-shipment" variant="secondary" icon={CreditCard} size="sm">
          Pay for Shipment
        </Button>
      </div>

      <Card hover={false}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-foreground">Recent Orders</h2>
          <Link href="/account/orders" className="flex items-center gap-1 text-sm font-semibold text-navy dark:text-white">
            View all <ArrowRight className="size-3.5" />
          </Link>
        </div>
        {orders.length === 0 ? (
          <p className="text-sm text-foreground/60">No orders yet.</p>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 5).map((order) => (
              <Link
                key={order._id}
                href={`/account/orders/${order._id}`}
                className="flex items-center justify-between rounded-xl border border-border-subtle p-3 text-sm transition-colors hover:border-navy/40"
              >
                <div>
                  <p className="font-semibold text-foreground">{order.trackingNumber}</p>
                  <p className="text-foreground/60">
                    {order.origin} → {order.destination}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-foreground">{order.status}</p>
                  <p className="text-xs text-foreground/50">{formatDate(order.createdAt)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {outstanding.length > 0 && (
        <Card hover={false}>
          <h2 className="mb-4 font-heading text-lg font-bold text-foreground">Payments Due</h2>
          <div className="space-y-3">
            {outstanding.map((payment) => (
              <div
                key={payment._id}
                className="flex items-center justify-between rounded-xl border border-border-subtle p-3 text-sm"
              >
                <div>
                  <p className="font-semibold text-foreground">{payment.invoiceNumber}</p>
                  <p className="text-foreground/60">{payment.shipment?.trackingNumber}</p>
                </div>
                <p className="font-heading font-bold text-foreground">
                  {formatCurrency(payment.amount, payment.currency)}
                </p>
              </div>
            ))}
          </div>
          <Button href="/account/bills" variant="ghost" size="sm" className="mt-4">
            Go to Bills to pay from wallet
          </Button>
        </Card>
      )}
    </div>
  );
}
