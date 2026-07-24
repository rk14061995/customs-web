"use client";

import { useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  PackageCheck,
  Truck,
  ShieldCheck,
  PackageOpen,
  CircleCheck,
  Circle,
  MapPin,
  Loader2,
  Boxes,
  Building2,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import type { TrackingResult } from "@/types";

const statusIcons: Record<string, typeof PackageCheck> = {
  Booked: PackageCheck,
  "Picked Up": PackageOpen,
  "In Transit": Truck,
  "Customs Clearance": ShieldCheck,
  "Out For Delivery": Truck,
  Delivered: CircleCheck,
};

export default function TrackingForm() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);
    if (!trackingNumber.trim()) {
      setError("Please enter a tracking number.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/tracking/${encodeURIComponent(trackingNumber.trim())}`);
      if (!res.ok) {
        setError("No shipment found with that tracking number. Try RF1234567890.");
        return;
      }
      const data = (await res.json()) as TrackingResult;
      setResult(data);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Card className="relative -mt-24 z-10 bg-background sm:p-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-foreground/40" />
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Enter tracking number, e.g. RF1234567890"
              className="w-full rounded-full border border-border-subtle bg-background py-3.5 pl-11 pr-4 text-sm outline-none placeholder:text-foreground/40 focus:border-navy"
            />
          </div>
          <Button type="submit" size="lg" icon={loading ? undefined : Search} disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : "Track"}
          </Button>
        </form>
        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      </Card>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="mt-8"
          >
            <Card hover={false}>
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle pb-6">
                <div>
                  <p className="text-xs uppercase tracking-wide text-foreground/50">Tracking Number</p>
                  <p className="font-heading text-lg font-semibold text-foreground">{result.trackingNumber}</p>
                </div>
                <span className="rounded-full bg-orange/10 px-4 py-1.5 text-sm font-semibold text-orange">
                  {result.status}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-6 border-b border-border-subtle py-6 sm:grid-cols-3">
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-navy dark:text-white" />
                  <div>
                    <p className="text-xs text-foreground/50">Origin</p>
                    <p className="text-sm font-medium text-foreground">{result.origin}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-orange" />
                  <div>
                    <p className="text-xs text-foreground/50">Destination</p>
                    <p className="text-sm font-medium text-foreground">{result.destination}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <PackageCheck className="mt-0.5 size-4 shrink-0 text-navy dark:text-white" />
                  <div>
                    <p className="text-xs text-foreground/50">Estimated Delivery</p>
                    <p className="text-sm font-medium text-foreground">{result.estimatedDelivery}</p>
                  </div>
                </div>
              </div>

              {(result.serviceType || result.carrier || result.weight) && (
                <div className="grid grid-cols-1 gap-6 border-b border-border-subtle py-6 sm:grid-cols-3">
                  {result.serviceType && (
                    <div className="flex items-start gap-2">
                      <PackageCheck className="mt-0.5 size-4 shrink-0 text-navy dark:text-white" />
                      <div>
                        <p className="text-xs text-foreground/50">Service Type</p>
                        <p className="text-sm font-medium text-foreground">{result.serviceType}</p>
                      </div>
                    </div>
                  )}
                  {result.carrier && (
                    <div className="flex items-start gap-2">
                      <Building2 className="mt-0.5 size-4 shrink-0 text-orange" />
                      <div>
                        <p className="text-xs text-foreground/50">Carrier</p>
                        <p className="text-sm font-medium text-foreground">{result.carrier}</p>
                      </div>
                    </div>
                  )}
                  {result.weight && (
                    <div className="flex items-start gap-2">
                      <Boxes className="mt-0.5 size-4 shrink-0 text-navy dark:text-white" />
                      <div>
                        <p className="text-xs text-foreground/50">Weight{result.packages ? " / Packages" : ""}</p>
                        <p className="text-sm font-medium text-foreground">
                          {result.weight}
                          {result.dimensions ? ` · ${result.dimensions}` : ""}
                          {result.packages ? ` · ${result.packages} pkg${result.packages > 1 ? "s" : ""}` : ""}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-8">
                <div className="relative">
                  <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border-subtle sm:left-1/2 sm:hidden" />
                  <ol className="space-y-8">
                    {result.events.map((event) => {
                      const Icon = statusIcons[event.status] ?? Circle;
                      return (
                        <li key={event.status} className="relative flex gap-4">
                          <span
                            className={`z-10 flex size-8 shrink-0 items-center justify-center rounded-full ${
                              event.completed
                                ? "bg-navy text-white"
                                : "bg-surface text-foreground/30 border border-border-subtle"
                            }`}
                          >
                            <Icon className="size-4" />
                          </span>
                          <div>
                            <p className={`font-medium ${event.completed ? "text-foreground" : "text-foreground/40"}`}>
                              {event.status}
                            </p>
                            <p className="text-sm text-foreground/50">
                              {event.location} · {event.date}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
