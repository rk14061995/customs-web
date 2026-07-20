"use client";

import { useState } from "react";
import { Calculator, Plane, Ship, Truck, Zap } from "lucide-react";
import Card from "@/components/ui/Card";

const rates = [
  { value: "air", label: "Air Freight", icon: Plane, perKg: 8.5, handling: 45 },
  { value: "ocean", label: "Ocean Freight", icon: Ship, perKg: 1.2, handling: 120 },
  { value: "road", label: "Road Transport", icon: Truck, perKg: 2.4, handling: 30 },
  { value: "express", label: "Express Delivery", icon: Zap, perKg: 12, handling: 20 },
] as const;

export default function RateCalculator() {
  const [type, setType] = useState<(typeof rates)[number]["value"]>("air");
  const [weight, setWeight] = useState("");

  const selected = rates.find((r) => r.value === type)!;
  const parsedWeight = Number(weight) || 0;
  const estimate = parsedWeight > 0 ? parsedWeight * selected.perKg + selected.handling : null;

  return (
    <Card hover={false} className="bg-surface">
      <div className="flex items-center gap-2">
        <Calculator className="size-5 text-orange" />
        <h3 className="font-heading text-lg font-semibold text-foreground">Shipment Rate Calculator</h3>
      </div>
      <p className="mt-1 text-sm text-foreground/60">
        Get a rough estimate instantly. Submit the form below for an exact quote.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {rates.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => setType(r.value)}
            className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-xs font-medium transition-colors ${
              type === r.value
                ? "border-navy bg-navy/5 text-navy dark:bg-white/10 dark:text-white"
                : "border-border-subtle text-foreground/60 hover:border-navy/40"
            }`}
          >
            <r.icon className="size-5" />
            {r.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <label className="mb-1.5 block text-sm font-medium text-foreground">Weight (kg)</label>
        <input
          type="number"
          min="0"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="e.g. 250"
          className="w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none placeholder:text-foreground/40 focus:border-navy"
        />
      </div>

      {estimate !== null && (
        <div className="mt-4 rounded-xl bg-navy/5 p-4 dark:bg-white/5">
          <p className="text-xs uppercase tracking-wide text-foreground/50">Estimated Cost</p>
          <p className="mt-1 font-heading text-2xl font-bold text-navy dark:text-white">
            ${estimate.toFixed(2)} – ${(estimate * 1.15).toFixed(2)}
          </p>
          <p className="mt-1 text-xs text-foreground/50">
            Final pricing depends on route, dimensions, and customs. Submit the form for an exact quote.
          </p>
        </div>
      )}
    </Card>
  );
}
