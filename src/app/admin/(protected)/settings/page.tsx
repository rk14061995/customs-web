"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";

type SettingsData = {
  siteName: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  hours: string;
  social: { facebook?: string; twitter?: string; linkedin?: string; instagram?: string };
};

const inputClass =
  "w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none focus:border-navy";

const emptySettings: SettingsData = {
  siteName: "",
  tagline: "",
  phone: "",
  whatsapp: "",
  email: "",
  address: "",
  hours: "",
  social: {},
};

export default function AdminSettingsPage() {
  const [data, setData] = useState<SettingsData>(emptySettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((d) => setData(d ?? emptySettings))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return <Loader2 className="size-6 animate-spin text-foreground/40" />;

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">Site Settings</h1>
      <p className="mt-1 text-sm text-foreground/60">Manage global contact info and social links.</p>

      <div className="mt-8 max-w-2xl space-y-4 rounded-2xl border border-border-subtle bg-background p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Site Name</label>
            <input value={data.siteName} onChange={(e) => setData({ ...data, siteName: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Tagline</label>
            <input value={data.tagline} onChange={(e) => setData({ ...data, tagline: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Phone</label>
            <input value={data.phone} onChange={(e) => setData({ ...data, phone: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">WhatsApp Number</label>
            <input value={data.whatsapp} onChange={(e) => setData({ ...data, whatsapp: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
            <input value={data.email} onChange={(e) => setData({ ...data, email: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Business Hours</label>
            <input value={data.hours} onChange={(e) => setData({ ...data, hours: e.target.value })} className={inputClass} />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Office Address</label>
          <textarea rows={2} value={data.address} onChange={(e) => setData({ ...data, address: e.target.value })} className={inputClass} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {(["facebook", "twitter", "linkedin", "instagram"] as const).map((key) => (
            <div key={key}>
              <label className="mb-1.5 block text-sm font-medium capitalize text-foreground">{key} URL</label>
              <input
                value={data.social[key] ?? ""}
                onChange={(e) => setData({ ...data, social: { ...data.social, [key]: e.target.value } })}
                className={inputClass}
              />
            </div>
          ))}
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
