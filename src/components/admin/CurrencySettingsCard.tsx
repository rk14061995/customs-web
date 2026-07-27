"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import Button from "@/components/ui/Button";

export default function CurrencySettingsCard({ initialRate }: { initialRate: number }) {
  const [rate, setRate] = useState(initialRate);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usdToInrRate: rate }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="mt-4 flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-border-subtle bg-background p-5">
      <div>
        <h2 className="font-heading font-semibold text-foreground">Currency Settings</h2>
        <p className="mt-1 text-sm text-foreground/60">
          USD payments are converted to INR at this rate before being added into revenue totals above.
        </p>
      </div>
      <div className="flex items-end gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground/60">1 USD =</label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground/60">₹</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-28 rounded-xl border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-navy"
            />
          </div>
        </div>
        <Button icon={saving ? undefined : Save} onClick={save} disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : "Save"}
        </Button>
        {saved && <span className="pb-2.5 text-sm text-green-600">Saved</span>}
      </div>
    </div>
  );
}
