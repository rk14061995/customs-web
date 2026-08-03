"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Eye } from "lucide-react";
import Button from "@/components/ui/Button";
import AgreementPreviewModal from "@/components/admin/AgreementPreviewModal";
import { formatDate } from "@/lib/utils";

const inputClass =
  "w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none focus:border-navy";

type TemplateData = {
  title: string;
  forwarderName: string;
  forwarderAddress: string;
  subject: string;
  clauses: string[];
  authorizedSignatoryName: string;
  authorizedSignatoryDesignation: string;
};

const emptyTemplate: TemplateData = {
  title: "",
  forwarderName: "",
  forwarderAddress: "",
  subject: "",
  clauses: [],
  authorizedSignatoryName: "",
  authorizedSignatoryDesignation: "",
};

type AgreementRow = {
  _id: string;
  shipment: { _id: string; trackingNumber: string; origin: string; destination: string } | null;
  customer: { name: string; company?: string; email: string } | null;
  status: "pending" | "signed" | "expired";
  generatedAt: string;
  expiresAt: string;
  signature?: { signedName: string; signedAt: string };
};

const statusColor: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  signed: "bg-green-500/10 text-green-600 dark:text-green-400",
  expired: "bg-foreground/10 text-foreground/60",
};

export default function AgreementsManager() {
  const [template, setTemplate] = useState<TemplateData>(emptyTemplate);
  const [templateLoading, setTemplateLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [agreements, setAgreements] = useState<AgreementRow[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [previewShipmentId, setPreviewShipmentId] = useState<string | null>(null);

  const loadTemplate = async () => {
    setTemplateLoading(true);
    const res = await fetch("/api/admin/agreement-template");
    setTemplate(await res.json());
    setTemplateLoading(false);
  };

  const loadAgreements = async () => {
    setListLoading(true);
    const res = await fetch("/api/admin/agreements");
    setAgreements(await res.json());
    setListLoading(false);
  };

  useEffect(() => {
    loadTemplate();
    loadAgreements();
  }, []);

  const saveTemplate = async () => {
    setSaving(true);
    setSaved(false);
    await fetch("/api/admin/agreement-template", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(template),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateClause = (index: number, value: string) => {
    setTemplate((t) => ({ ...t, clauses: t.clauses.map((c, i) => (i === index ? value : c)) }));
  };

  const addClause = () => setTemplate((t) => ({ ...t, clauses: [...t.clauses, ""] }));

  const removeClause = (index: number) =>
    setTemplate((t) => ({ ...t, clauses: t.clauses.filter((_, i) => i !== index) }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-foreground">Agreements</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Manage the goods-handover agreement template, generate a signing link or PDF per shipment, and
          share it with the customer yourself (WhatsApp, email, etc).
        </p>
      </div>

      <section className="mb-10 rounded-2xl border border-border-subtle bg-background p-6">
        <h2 className="font-heading text-lg font-semibold text-foreground">Agreement Template</h2>
        <p className="mt-1 text-sm text-foreground/60">
          Generated automatically when a shipment is booked — edits here only apply to agreements generated afterward.
        </p>

        {templateLoading ? (
          <Loader2 className="mt-6 size-5 animate-spin text-foreground/40" />
        ) : (
          <div className="mt-6 max-w-3xl space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Title</label>
              <input
                value={template.title}
                onChange={(e) => setTemplate((t) => ({ ...t, title: e.target.value }))}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Forwarder Name</label>
                <input
                  value={template.forwarderName}
                  onChange={(e) => setTemplate((t) => ({ ...t, forwarderName: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Forwarder Address</label>
                <input
                  value={template.forwarderAddress}
                  onChange={(e) => setTemplate((t) => ({ ...t, forwarderAddress: e.target.value }))}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Subject</label>
              <input
                value={template.subject}
                onChange={(e) => setTemplate((t) => ({ ...t, subject: e.target.value }))}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Clauses</label>
              <div className="space-y-2">
                {template.clauses.map((clause, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="mt-2.5 text-sm text-foreground/50">{i + 1}.</span>
                    <textarea
                      rows={2}
                      value={clause}
                      onChange={(e) => updateClause(i, e.target.value)}
                      className={inputClass}
                    />
                    <button
                      onClick={() => removeClause(i)}
                      aria-label="Remove clause"
                      className="mt-2 flex size-8 shrink-0 items-center justify-center rounded-lg text-foreground/50 hover:bg-red-500/10 hover:text-red-500"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={addClause}
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-navy hover:underline dark:text-white"
              >
                <Plus className="size-4" /> Add Clause
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Authorized Signatory Name</label>
                <input
                  value={template.authorizedSignatoryName}
                  onChange={(e) => setTemplate((t) => ({ ...t, authorizedSignatoryName: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Designation</label>
                <input
                  value={template.authorizedSignatoryDesignation}
                  onChange={(e) => setTemplate((t) => ({ ...t, authorizedSignatoryDesignation: e.target.value }))}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button onClick={saveTemplate} disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : "Save Template"}
              </Button>
              {saved && <span className="text-sm text-green-600 dark:text-green-400">Saved</span>}
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="font-heading text-lg font-semibold text-foreground">Agreements</h2>
        <div className="mt-4 overflow-hidden rounded-2xl border border-border-subtle bg-background">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border-subtle bg-surface">
                <tr>
                  <th className="px-5 py-3 font-medium text-foreground/60">Shipment</th>
                  <th className="px-5 py-3 font-medium text-foreground/60">Customer</th>
                  <th className="px-5 py-3 font-medium text-foreground/60">Status</th>
                  <th className="px-5 py-3 font-medium text-foreground/60">Generated</th>
                  <th className="px-5 py-3 font-medium text-foreground/60">Signed</th>
                  <th className="px-5 py-3 text-right font-medium text-foreground/60">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {listLoading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-foreground/50">
                      <Loader2 className="mx-auto size-5 animate-spin" />
                    </td>
                  </tr>
                ) : agreements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-foreground/50">
                      No agreements yet — one is generated automatically when a shipment is booked.
                    </td>
                  </tr>
                ) : (
                  agreements.map((row) => (
                    <tr key={row._id}>
                      <td className="px-5 py-3 font-medium text-foreground">
                        {row.shipment?.trackingNumber ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-foreground/80">{row.customer?.name ?? "—"}</td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusColor[row.status]}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-foreground/60">{formatDate(row.generatedAt)}</td>
                      <td className="px-5 py-3 text-foreground/60">
                        {row.signature ? formatDate(row.signature.signedAt) : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-2">
                          {row.shipment && (
                            <button
                              onClick={() => setPreviewShipmentId(row.shipment!._id)}
                              aria-label="Preview Agreement"
                              title="Preview Agreement"
                              className="flex size-8 items-center justify-center rounded-lg text-foreground/50 hover:bg-navy/10 hover:text-navy"
                            >
                              <Eye className="size-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {previewShipmentId && (
        <AgreementPreviewModal shipmentId={previewShipmentId} onClose={() => setPreviewShipmentId(null)} />
      )}
    </div>
  );
}
