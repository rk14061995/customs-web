"use client";

import { useEffect, useState } from "react";
import { ClipboardList } from "lucide-react";
import Card from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";

type Booking = {
  _id: string;
  pickupLocation: string;
  destination: string;
  shipmentType: string;
  weight: string;
  pickupDate: string;
  status: "new" | "contacted" | "quoted" | "closed";
  createdAt: string;
};

const statusMeta: Record<Booking["status"], { label: string; color: string }> = {
  new: { label: "Received", color: "bg-navy/10 text-navy dark:text-white" },
  contacted: { label: "Being Reviewed", color: "bg-orange/10 text-orange" },
  quoted: { label: "Priced — check Quotations", color: "bg-green-500/10 text-green-600 dark:text-green-400" },
  closed: { label: "Closed", color: "bg-foreground/10 text-foreground/50" },
};

export default function AccountRequestsPage() {
  const [bookings, setBookings] = useState<Booking[] | null>(null);

  useEffect(() => {
    fetch("/api/account/bookings")
      .then((res) => res.json())
      .then(setBookings);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">My Requests</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Shipment requests you&apos;ve submitted. Once priced, they&apos;ll appear under Quotations to pay.
        </p>
      </div>

      {bookings === null ? (
        <p className="text-sm text-foreground/60">Loading…</p>
      ) : bookings.length === 0 ? (
        <Card hover={false} className="text-center text-sm text-foreground/60">
          <ClipboardList className="mx-auto mb-3 size-8 text-foreground/30" />
          You haven&apos;t submitted any shipment requests yet.
        </Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const meta = statusMeta[b.status];
            return (
              <Card key={b._id} className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-heading font-semibold capitalize text-foreground">
                    {b.pickupLocation} → {b.destination}
                  </p>
                  <p className="text-sm text-foreground/60">
                    {b.shipmentType} · {b.weight} kg · Pickup {b.pickupDate}
                  </p>
                  <p className="text-xs text-foreground/40">Submitted {formatDate(b.createdAt)}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${meta.color}`}>{meta.label}</span>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
