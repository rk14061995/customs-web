"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, Printer, Mail, MessageCircle, X } from "lucide-react";
import Button from "@/components/ui/Button";
import { computeChargeAmount, computeQuotationTotals, formatChargeBasis } from "@/lib/quotationUtils";

type Charge = { label: string; basis: "flat" | "per_kg" | "percent"; rate: number };
type Settings = { phone: string; alternatePhone?: string; email: string };
type Quotation = {
  _id: string;
  quoteNumber: string;
  customer?: { name: string; company?: string; email: string; phone: string } | null;
  origin: string;
  destination: string;
  serviceType: string;
  weightKg: number;
  quantity: number;
  dimensions?: string;
  charges: Charge[];
  currency: string;
  taxRate: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  status: string;
  validUntil?: string;
  notes?: string;
  createdAt: string;
};

export default function QuotationPrintPage() {
  const { id } = useParams<{ id: string }>();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);

  const [preview, setPreview] = useState<{ to: string; subject: string; html: string } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/quotations/${id}`)
      .then((res) => res.json())
      .then(setQuotation);
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then(setSettings);
  }, [id]);

  useEffect(() => {
    if (quotation) document.title = `Quotation ${quotation.quoteNumber} - Rana Forwarder`;
  }, [quotation]);

  if (!quotation) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-foreground/50" />
      </div>
    );
  }

  const { baseAmount } = computeQuotationTotals(quotation.charges, quotation.weightKg, quotation.taxRate);

  const openEmailPreview = async () => {
    setPreviewLoading(true);
    setPreviewError("");
    try {
      const res = await fetch(`/api/admin/quotations/${quotation._id}/email-preview`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error ?? "Failed to build email preview");
        return;
      }
      setPreview(data);
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    setPreview(null);
    setPreviewError("");
  };

  const confirmSendEmail = async () => {
    if (!preview) return;
    setSendingEmail(true);
    setPreviewError("");
    try {
      const res = await fetch(`/api/admin/quotations/${quotation._id}/send-email`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setPreviewError(data.error ?? "Failed to send email");
        return;
      }
      setPreview(null);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendWhatsApp = () => {
    const digits = String(quotation.customer?.phone ?? "").replace(/[^0-9]/g, "");
    if (!digits) {
      alert("This customer has no phone number on file.");
      return;
    }
    const lines = quotation.charges.map(
      (c) => `${c.label}: ${quotation.currency} ${computeChargeAmount(c, quotation.weightKg, baseAmount).toLocaleString()}`
    );
    const text = [
      `Quotation ${quotation.quoteNumber} — Rana Forwarder`,
      `${quotation.origin} → ${quotation.destination} (${quotation.serviceType}, ${quotation.weightKg}kg)`,
      "",
      ...lines,
      "",
      `Subtotal: ${quotation.currency} ${quotation.subtotal.toLocaleString()}`,
      `GST (${quotation.taxRate}%): ${quotation.currency} ${quotation.taxAmount.toLocaleString()}`,
      `Total: ${quotation.currency} ${quotation.total.toLocaleString()}`,
    ].join("\n");
    window.open(`https://wa.me/${digits}?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="mx-auto max-w-3xl bg-white p-10 text-slate-900 print:p-0">
      <style>{`@page { size: A4; margin: 1.5cm; }`}</style>

      <div className="mb-8 flex justify-end gap-3 print:hidden">
        <Button variant="secondary" icon={MessageCircle} onClick={handleSendWhatsApp}>
          WhatsApp
        </Button>
        <Button variant="secondary" icon={Mail} onClick={openEmailPreview} disabled={previewLoading}>
          {previewLoading ? <Loader2 className="size-4 animate-spin" /> : "Email"}
        </Button>
        <Button icon={Printer} onClick={() => window.print()}>
          Print / Save as PDF
        </Button>
      </div>

      <div className="mb-8 flex items-start justify-between border-b border-slate-200 pb-6">
        <div>
          <p className="font-heading text-xl font-bold text-navy">Rana Forwarder</p>
          <p className="text-sm text-slate-500">Logistics & Freight Forwarding</p>
          {settings?.email && <p className="mt-1 text-xs text-slate-500">{settings.email}</p>}
          {settings?.phone && (
            <p className="text-xs text-slate-500">
              {settings.phone}
              {settings.alternatePhone ? ` / ${settings.alternatePhone}` : ""}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="font-heading text-lg font-bold">QUOTATION</p>
          <p className="text-sm text-slate-500">{quotation.quoteNumber}</p>
          <p className="text-sm text-slate-500">{new Date(quotation.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-6 text-sm">
        <div>
          <p className="mb-1 font-semibold text-slate-500">Billed To</p>
          <p className="font-medium">{quotation.customer?.name ?? "—"}</p>
          {quotation.customer?.company && <p>{quotation.customer.company}</p>}
          {quotation.customer?.email && <p>{quotation.customer.email}</p>}
          {quotation.customer?.phone && <p>{quotation.customer.phone}</p>}
        </div>
        <div>
          <p className="mb-1 font-semibold text-slate-500">Shipment Details</p>
          <p>{quotation.origin} → {quotation.destination}</p>
          <p>{quotation.serviceType}</p>
          <p>
            {quotation.weightKg} kg · {quotation.quantity ?? 1} box{(quotation.quantity ?? 1) === 1 ? "" : "es"}
            {quotation.dimensions ? ` · ${quotation.dimensions}` : ""}
          </p>
          {quotation.validUntil && <p>Valid until {quotation.validUntil}</p>}
        </div>
      </div>

      <table className="mb-6 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-300 text-left text-slate-500">
            <th className="py-2">Charge</th>
            <th className="py-2 text-right">Basis</th>
            <th className="py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {quotation.charges.map((charge, i) => (
            <tr key={i} className="border-b border-slate-100">
              <td className="py-2">{charge.label}</td>
              <td className="py-2 text-right text-slate-500">
                {formatChargeBasis(charge, quotation.currency, quotation.weightKg)}
              </td>
              <td className="py-2 text-right">
                {quotation.currency} {computeChargeAmount(charge, quotation.weightKg, baseAmount).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mb-8 ml-auto w-64 space-y-1.5 text-sm">
        <div className="flex justify-between text-slate-500">
          <span>Subtotal</span>
          <span>{quotation.currency} {quotation.subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-slate-500">
          <span>GST / Tax ({quotation.taxRate}%)</span>
          <span>{quotation.currency} {quotation.taxAmount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between border-t border-slate-300 pt-1.5 font-heading text-base font-bold text-slate-900">
          <span>Total</span>
          <span>{quotation.currency} {quotation.total.toLocaleString()}</span>
        </div>
      </div>

      {quotation.notes && (
        <div className="border-t border-slate-200 pt-4 text-sm">
          <p className="mb-1 font-semibold text-slate-500">Notes</p>
          <p className="text-slate-700">{quotation.notes}</p>
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 print:hidden">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white text-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="font-heading text-lg font-semibold">Preview email</h2>
                <p className="text-sm text-slate-500">
                  To: {preview.to} · Subject: {preview.subject}
                </p>
              </div>
              <button onClick={closePreview} aria-label="Close" className="text-slate-400 hover:text-slate-600">
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-100 p-4">
              <iframe
                title="Email preview"
                srcDoc={preview.html}
                sandbox=""
                className="h-[60vh] w-full rounded-lg border border-slate-200 bg-white"
              />
              <p className="mt-2 text-xs text-slate-500">A PDF copy of this quotation will be attached.</p>
            </div>

            {previewError && <p className="px-6 pt-3 text-sm text-red-500">{previewError}</p>}

            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <Button variant="ghost" onClick={closePreview}>Cancel</Button>
              <Button icon={Mail} onClick={confirmSendEmail} disabled={sendingEmail}>
                {sendingEmail ? <Loader2 className="size-4 animate-spin" /> : "Send Email"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
