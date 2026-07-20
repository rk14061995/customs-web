"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";

type Stat = { label: string; value: number; suffix: string };
type HomepageData = { heroHeadline: string; heroSubtitle: string; stats: Stat[] };

const inputClass =
  "w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none focus:border-navy";

export default function AdminHomepagePage() {
  const [data, setData] = useState<HomepageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/homepage")
      .then((res) => res.json())
      .then((d) => setData(d ?? { heroHeadline: "", heroSubtitle: "", stats: [] }))
      .finally(() => setLoading(false));
  }, []);

  const updateStat = (i: number, key: keyof Stat, value: string) => {
    if (!data) return;
    const stats = [...data.stats];
    stats[i] = { ...stats[i], [key]: key === "value" ? Number(value) : value };
    setData({ ...data, stats });
  };

  const addStat = () => {
    if (!data) return;
    setData({ ...data, stats: [...data.stats, { label: "", value: 0, suffix: "" }] });
  };

  const removeStat = (i: number) => {
    if (!data) return;
    setData({ ...data, stats: data.stats.filter((_, idx) => idx !== i) });
  };

  const save = async () => {
    if (!data) return;
    setSaving(true);
    setSaved(false);
    await fetch("/api/admin/homepage", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading || !data) {
    return <Loader2 className="size-6 animate-spin text-foreground/40" />;
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">Homepage Content</h1>
      <p className="mt-1 text-sm text-foreground/60">Edit the hero section and animated statistics.</p>

      <div className="mt-8 max-w-2xl space-y-6 rounded-2xl border border-border-subtle bg-background p-6">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Hero Headline</label>
          <input
            value={data.heroHeadline}
            onChange={(e) => setData({ ...data, heroHeadline: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Hero Subtitle</label>
          <textarea
            rows={3}
            value={data.heroSubtitle}
            onChange={(e) => setData({ ...data, heroSubtitle: e.target.value })}
            className={inputClass}
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Animated Statistics</label>
            <Button size="sm" variant="ghost" icon={Plus} onClick={addStat}>Add Stat</Button>
          </div>
          <div className="space-y-3">
            {data.stats.map((stat, i) => (
              <div key={i} className="grid grid-cols-[1fr_100px_80px_36px] gap-2">
                <input
                  placeholder="Label"
                  value={stat.label}
                  onChange={(e) => updateStat(i, "label", e.target.value)}
                  className={inputClass}
                />
                <input
                  type="number"
                  placeholder="Value"
                  value={stat.value}
                  onChange={(e) => updateStat(i, "value", e.target.value)}
                  className={inputClass}
                />
                <input
                  placeholder="Suffix"
                  value={stat.suffix}
                  onChange={(e) => updateStat(i, "suffix", e.target.value)}
                  className={inputClass}
                />
                <button
                  onClick={() => removeStat(i)}
                  aria-label="Remove stat"
                  className="flex items-center justify-center rounded-xl text-foreground/40 hover:text-red-500"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : "Save Changes"}
          </Button>
          {saved && <span className="text-sm text-green-600">Saved</span>}
        </div>
      </div>
    </div>
  );
}
