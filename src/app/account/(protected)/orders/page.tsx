"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, ArrowRight } from "lucide-react";
import Card from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";

type Shipment = {
  _id: string;
  trackingNumber: string;
  status: string;
  origin: string;
  destination: string;
  serviceType: string;
  createdAt: string;
  carrier?: { name: string } | null;
};

const statusColor: Record<string, string> = {
  Delivered: "bg-green-500/10 text-green-600 dark:text-green-400",
  Cancelled: "bg-red-500/10 text-red-500",
  "On Hold": "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
};

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState<Shipment[] | null>(null);

  useEffect(() => {
    fetch("/api/account/orders")
      .then((res) => res.json())
      .then(setOrders);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">My Orders</h1>
        <p className="mt-1 text-sm text-foreground/60">Every shipment booked under your account.</p>
      </div>

      {orders === null ? (
        <p className="text-sm text-foreground/60">Loading…</p>
      ) : orders.length === 0 ? (
        <Card hover={false} className="text-center text-sm text-foreground/60">
          <Package className="mx-auto mb-3 size-8 text-foreground/30" />
          You don&apos;t have any orders yet.
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link key={order._id} href={`/account/orders/${order._id}`}>
              <Card className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-heading font-semibold text-foreground">{order.trackingNumber}</p>
                  <p className="text-sm text-foreground/60">
                    {order.origin} → {order.destination} · {order.serviceType}
                  </p>
                  <p className="text-xs text-foreground/40">{formatDate(order.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor[order.status] ?? "bg-navy/10 text-navy dark:text-white"}`}
                  >
                    {order.status}
                  </span>
                  <ArrowRight className="size-4 text-foreground/40" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
