"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CircleCheck, Circle, MapPin, Boxes } from "lucide-react";
import Card from "@/components/ui/Card";
import { cn, formatDate } from "@/lib/utils";

type ShipmentEvent = {
  status: string;
  location: string;
  date: string;
  completed: boolean;
  notes?: string;
};

type Shipment = {
  _id: string;
  trackingNumber: string;
  status: string;
  origin: string;
  destination: string;
  serviceType: string;
  weight: string;
  dimensions?: string;
  packages: number;
  estimatedDelivery: string;
  actualDelivery?: string;
  events: ShipmentEvent[];
  cost: number;
  currency: string;
  paymentStatus: string;
  createdAt: string;
  carrier?: { name: string } | null;
};

export default function AccountOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Shipment | null | undefined>(undefined);

  useEffect(() => {
    fetch(`/api/account/orders/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setOrder);
  }, [id]);

  if (order === undefined) return <p className="text-sm text-foreground/60">Loading…</p>;
  if (order === null) return <p className="text-sm text-foreground/60">Order not found.</p>;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-wide text-foreground/50">Tracking Number</p>
        <h1 className="font-heading text-2xl font-bold text-foreground">{order.trackingNumber}</h1>
      </div>

      <Card hover={false}>
        <div className="grid grid-cols-1 gap-6 border-b border-border-subtle pb-6 sm:grid-cols-3">
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0 text-navy dark:text-white" />
            <div>
              <p className="text-xs text-foreground/50">Origin</p>
              <p className="text-sm font-medium text-foreground">{order.origin}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0 text-orange" />
            <div>
              <p className="text-xs text-foreground/50">Destination</p>
              <p className="text-sm font-medium text-foreground">{order.destination}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Boxes className="mt-0.5 size-4 shrink-0 text-navy dark:text-white" />
            <div>
              <p className="text-xs text-foreground/50">Weight / Packages</p>
              <p className="text-sm font-medium text-foreground">
                {order.weight}
                {order.dimensions ? ` · ${order.dimensions}` : ""} · {order.packages} pkg
                {order.packages > 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 border-b border-border-subtle py-6 sm:grid-cols-4">
          <Info label="Status" value={order.status} />
          <Info label="Service Type" value={order.serviceType} />
          <Info label="Carrier" value={order.carrier?.name ?? "—"} />
          <Info label="Est. Delivery" value={order.estimatedDelivery} />
          <Info label="Cost" value={`${order.currency} ${order.cost.toLocaleString("en-IN")}`} />
          <Info label="Payment Status" value={order.paymentStatus} />
          <Info label="Booked On" value={formatDate(order.createdAt)} />
          {order.actualDelivery && <Info label="Delivered On" value={order.actualDelivery} />}
        </div>

        <div className="pt-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-foreground/50">
            Shipment Progress
          </p>
          {order.events.length === 0 ? (
            <p className="text-sm text-foreground/60">No tracking updates yet.</p>
          ) : (
            <ol className="space-y-4">
              {order.events.map((event, i) => (
                <li key={`${event.status}-${i}`} className="flex gap-3">
                  {event.completed ? (
                    <CircleCheck className="mt-0.5 size-5 shrink-0 text-navy dark:text-white" />
                  ) : (
                    <Circle className="mt-0.5 size-5 shrink-0 text-foreground/30" />
                  )}
                  <div>
                    <p className={cn("text-sm font-semibold", event.completed ? "text-foreground" : "text-foreground/50")}>
                      {event.status}
                    </p>
                    <p className="text-xs text-foreground/50">
                      {event.location} · {event.date}
                    </p>
                    {event.notes && <p className="text-xs text-foreground/50">{event.notes}</p>}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-foreground/50">{label}</p>
      <p className="text-sm font-medium capitalize text-foreground">{value}</p>
    </div>
  );
}
