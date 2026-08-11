"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";

type SettingsData = {
  siteName: string;
  tagline: string;
  phone: string;
  alternatePhone?: string;
  whatsapp: string;
  email: string;
  address: string;
  hours: string;
  description?: string;
  ga4MeasurementId?: string;
  googleAdsId?: string;
  gstin?: string;
  pan?: string;
  udyamNumber?: string;
  stateName?: string;
  stateCode?: string;
  jurisdiction?: string;
  bankAccountHolder?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankBranch?: string;
  bankIfsc?: string;
  social: { facebook?: string; twitter?: string; linkedin?: string; instagram?: string };
};

const inputClass =
  "w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none focus:border-navy";

const emptySettings: SettingsData = {
  siteName: "",
  tagline: "",
  phone: "",
  alternatePhone: "",
  whatsapp: "",
  email: "",
  address: "",
  hours: "",
  description: "",
  ga4MeasurementId: "",
  googleAdsId: "",
  gstin: "",
  pan: "",
  udyamNumber: "",
  stateName: "",
  stateCode: "",
  jurisdiction: "",
  bankAccountHolder: "",
  bankName: "",
  bankAccountNumber: "",
  bankBranch: "",
  bankIfsc: "",
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
            <label className="mb-1.5 block text-sm font-medium text-foreground">Alternate Phone</label>
            <input value={data.alternatePhone ?? ""} onChange={(e) => setData({ ...data, alternatePhone: e.target.value })} className={inputClass} />
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
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Site Description (SEO)</label>
          <textarea
            rows={2}
            value={data.description ?? ""}
            onChange={(e) => setData({ ...data, description: e.target.value })}
            className={inputClass}
          />
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium text-foreground">Tax & Registration (used on Bill PDFs)</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs text-foreground/60">GSTIN/UIN</label>
              <input value={data.gstin ?? ""} onChange={(e) => setData({ ...data, gstin: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-foreground/60">PAN</label>
              <input value={data.pan ?? ""} onChange={(e) => setData({ ...data, pan: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-foreground/60">UDYAM Registration No.</label>
              <input value={data.udyamNumber ?? ""} onChange={(e) => setData({ ...data, udyamNumber: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-foreground/60">Jurisdiction (for invoice footer)</label>
              <input value={data.jurisdiction ?? ""} onChange={(e) => setData({ ...data, jurisdiction: e.target.value })} placeholder="e.g. Delhi" className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-foreground/60">State Name</label>
              <input value={data.stateName ?? ""} onChange={(e) => setData({ ...data, stateName: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-foreground/60">State Code</label>
              <input value={data.stateCode ?? ""} onChange={(e) => setData({ ...data, stateCode: e.target.value })} placeholder="e.g. 07" className={inputClass} />
            </div>
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium text-foreground">Bank Details (used on Bill PDFs)</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs text-foreground/60">Account Holder Name</label>
              <input value={data.bankAccountHolder ?? ""} onChange={(e) => setData({ ...data, bankAccountHolder: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-foreground/60">Bank Name</label>
              <input value={data.bankName ?? ""} onChange={(e) => setData({ ...data, bankName: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-foreground/60">Account Number</label>
              <input value={data.bankAccountNumber ?? ""} onChange={(e) => setData({ ...data, bankAccountNumber: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-foreground/60">Branch</label>
              <input value={data.bankBranch ?? ""} onChange={(e) => setData({ ...data, bankBranch: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-foreground/60">IFSC Code</label>
              <input value={data.bankIfsc ?? ""} onChange={(e) => setData({ ...data, bankIfsc: e.target.value })} className={inputClass} />
            </div>
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium text-foreground">Analytics & Tracking</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs text-foreground/60">GA4 Measurement ID</label>
              <input
                value={data.ga4MeasurementId ?? ""}
                onChange={(e) => setData({ ...data, ga4MeasurementId: e.target.value })}
                placeholder="G-XXXXXXXXXX"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-foreground/60">Google Ads Conversion ID</label>
              <input
                value={data.googleAdsId ?? ""}
                onChange={(e) => setData({ ...data, googleAdsId: e.target.value })}
                placeholder="AW-XXXXXXXXX"
                className={inputClass}
              />
            </div>
          </div>
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
