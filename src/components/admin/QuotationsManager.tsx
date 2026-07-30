"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, X, Loader2, Search, Eye } from "lucide-react";
import Button from "@/components/ui/Button";
import { computeChargeAmount, computeQuotationTotals } from "@/lib/quotationUtils";

const SERVICE_TYPES = [
  "Domestic Courier",
  "International Courier",
  "Air Freight",
  "Ocean Freight",
  "Road Transport",
  "Express Delivery",
  "Warehousing",
];

const QUOTATION_STATUSES = ["draft", "sent", "accepted", "rejected", "expired"];

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED"];

const CHARGE_BASES: { value: "flat" | "per_kg" | "percent"; label: string }[] = [
  { value: "per_kg", label: "Per Kg" },
  { value: "flat", label: "Flat" },
  { value: "percent", label: "Percent (%)" },
];

const statusColor: Record<string, string> = {
  draft: "bg-foreground/10 text-foreground/60",
  sent: "bg-navy/10 text-navy dark:text-white",
  accepted: "bg-green-500/10 text-green-600 dark:text-green-400",
  rejected: "bg-red-500/10 text-red-500",
  expired: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
};

type Customer = { _id: string; name: string; company?: string; email?: string; phone?: string };
type Charge = { label: string; basis: "flat" | "per_kg" | "percent"; rate: number };
type Quotation = {
  _id: string;
  quoteNumber: string;
  customer?: Customer | null;
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

const defaultCharges: Charge[] = [
  { label: "Freight", basis: "per_kg", rate: 0 },
  { label: "Fuel Charge", basis: "percent", rate: 0 },
  { label: "Demand Charge", basis: "percent", rate: 0 },
  { label: "Other Surcharge", basis: "flat", rate: 0 },
];

const emptyForm = {
  customer: "",
  origin: "",
  destination: "",
  serviceType: SERVICE_TYPES[0],
  weightPerBoxKg: 0,
  quantity: 1,
  dimensions: "",
  charges: defaultCharges,
  currency: "INR",
  taxRate: 18,
  status: "draft",
  validUntil: "",
  notes: "",
};

export default function QuotationsManager() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Quotation | null>(null);
  const [formValues, setFormValues] = useState<typeof emptyForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/admin/quotations?${params.toString()}`);
    const data = await res.json();
    setQuotations(data);
    setLoading(false);
  };

  const loadCustomers = async () => {
    const res = await fetch("/api/admin/customers");
    setCustomers(await res.json());
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  const customerOptions = useMemo(
    () => customers.map((c) => ({ value: c._id, label: c.company ? `${c.name} — ${c.company}` : c.name })),
    [customers]
  );

  const totalWeightKg = formValues.weightPerBoxKg * formValues.quantity;

  const formTotals = useMemo(
    () => computeQuotationTotals(formValues.charges, totalWeightKg, formValues.taxRate),
    [formValues.charges, totalWeightKg, formValues.taxRate]
  );

  const openCreate = () => {
    setEditing(null);
    setFormValues(emptyForm);
    setError("");
    setModalOpen(true);
  };

  const openEdit = (row: Quotation) => {
    setEditing(row);
    setFormValues({
      customer: row.customer?._id ?? "",
      origin: row.origin,
      destination: row.destination,
      serviceType: row.serviceType,
      weightPerBoxKg: (row.quantity ?? 1) ? row.weightKg / (row.quantity ?? 1) : row.weightKg,
      quantity: row.quantity ?? 1,
      dimensions: row.dimensions ?? "",
      charges: row.charges.length ? row.charges : defaultCharges,
      currency: row.currency,
      taxRate: row.taxRate,
      status: row.status,
      validUntil: row.validUntil ?? "",
      notes: row.notes ?? "",
    });
    setError("");
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const updateCharge = (index: number, field: keyof Charge, value: string) => {
    setFormValues((v) => ({
      ...v,
      charges: v.charges.map((c, i) =>
        i === index ? { ...c, [field]: field === "rate" ? Number(value) : value } : c
      ),
    }));
  };

  const addCharge = () => {
    setFormValues((v) => ({ ...v, charges: [...v.charges, { label: "", basis: "flat", rate: 0 }] }));
  };

  const removeCharge = (index: number) => {
    setFormValues((v) => ({ ...v, charges: v.charges.filter((_, i) => i !== index) }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const { weightPerBoxKg, ...rest } = formValues;
      const payload: Record<string, unknown> = {
        ...rest,
        weightKg: weightPerBoxKg * formValues.quantity,
        charges: formValues.charges.filter((c) => c.label.trim() !== ""),
      };
      if (!editing) delete payload.status;

      const url = editing ? `/api/admin/quotations/${editing._id}` : "/api/admin/quotations";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to save quotation");
        return;
      }
      setModalOpen(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: Quotation) => {
    if (!confirm(`Delete quotation ${row.quoteNumber}?`)) return;
    await fetch(`/api/admin/quotations/${row._id}`, { method: "DELETE" });
    await load();
  };

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Quotations</h1>
          <p className="mt-1 text-sm text-foreground/60">
            Build itemized price quotes for shipments — freight, fuel charge, demand charge, and any other charges.
          </p>
        </div>
        <Button icon={Plus} onClick={openCreate}>
          New Quotation
        </Button>
      </div>

      {customers.length === 0 && (
        <div className="mb-6 rounded-2xl border border-orange/30 bg-orange/5 p-4 text-sm text-foreground/80">
          You need at least one customer before creating a quotation.{" "}
          <Link href="/admin/customers" className="font-semibold text-orange underline">
            Add a customer
          </Link>
          .
        </div>
      )}

      <div className="mb-5 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-foreground/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search quote #, origin, destination..."
            className="w-full rounded-xl border border-border-subtle bg-background py-2.5 pl-10 pr-4 text-sm outline-none focus:border-navy"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none focus:border-navy"
        >
          <option value="">All Statuses</option>
          {QUOTATION_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border-subtle bg-background">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border-subtle bg-surface">
              <tr>
                <th className="px-5 py-3 font-medium text-foreground/60">Quote #</th>
                <th className="px-5 py-3 font-medium text-foreground/60">Customer</th>
                <th className="px-5 py-3 font-medium text-foreground/60">Route</th>
                <th className="px-5 py-3 font-medium text-foreground/60">Service</th>
                <th className="px-5 py-3 font-medium text-foreground/60">Status</th>
                <th className="px-5 py-3 font-medium text-foreground/60">Total</th>
                <th className="px-5 py-3 text-right font-medium text-foreground/60">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-foreground/50">
                    <Loader2 className="mx-auto size-5 animate-spin" />
                  </td>
                </tr>
              ) : quotations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-foreground/50">
                    No quotations yet.
                  </td>
                </tr>
              ) : (
                quotations.map((row) => (
                  <tr key={row._id}>
                    <td className="px-5 py-3 font-medium text-foreground">{row.quoteNumber}</td>
                    <td className="px-5 py-3 text-foreground">{row.customer?.name ?? "—"}</td>
                    <td className="px-5 py-3 text-foreground/80">
                      {row.origin} → {row.destination}
                    </td>
                    <td className="px-5 py-3 text-foreground/70">{row.serviceType}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusColor[row.status] ?? "bg-foreground/10"}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-foreground">
                      {row.currency} {row.total.toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => window.open(`/admin/quotations/${row._id}/print`, "_blank")}
                          aria-label="View"
                          className="flex size-8 items-center justify-center rounded-lg text-foreground/50 hover:bg-navy/10 hover:text-navy"
                        >
                          <Eye className="size-4" />
                        </button>
                        <button
                          onClick={() => openEdit(row)}
                          aria-label="Edit"
                          className="flex size-8 items-center justify-center rounded-lg text-foreground/50 hover:bg-navy/10 hover:text-navy"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(row)}
                          aria-label="Delete"
                          className="flex size-8 items-center justify-center rounded-lg text-foreground/50 hover:bg-red-500/10 hover:text-red-500"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-background p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold text-foreground">
                {editing ? `Edit Quotation ${editing.quoteNumber}` : "New Quotation"}
              </h2>
              <button onClick={closeModal} aria-label="Close" className="text-foreground/50 hover:text-foreground">
                <X className="size-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Customer <span className="text-orange">*</span>
                </label>
                <select
                  value={formValues.customer}
                  onChange={(e) => setFormValues((v) => ({ ...v, customer: e.target.value }))}
                  className="w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none focus:border-navy"
                >
                  <option value="">Select customer...</option>
                  {customerOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Service Type <span className="text-orange">*</span>
                </label>
                <select
                  value={formValues.serviceType}
                  onChange={(e) => setFormValues((v) => ({ ...v, serviceType: e.target.value }))}
                  className="w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none focus:border-navy"
                >
                  {SERVICE_TYPES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Origin <span className="text-orange">*</span>
                </label>
                <input
                  value={formValues.origin}
                  onChange={(e) => setFormValues((v) => ({ ...v, origin: e.target.value }))}
                  className="w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none focus:border-navy"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Destination <span className="text-orange">*</span>
                </label>
                <input
                  value={formValues.destination}
                  onChange={(e) => setFormValues((v) => ({ ...v, destination: e.target.value }))}
                  className="w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none focus:border-navy"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Weight per Box (kg) <span className="text-orange">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={formValues.weightPerBoxKg}
                  onChange={(e) => setFormValues((v) => ({ ...v, weightPerBoxKg: Number(e.target.value) }))}
                  className="w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none focus:border-navy"
                />
                <p className="mt-1 text-xs text-foreground/50">
                  × {formValues.quantity} box{formValues.quantity === 1 ? "" : "es"} = {totalWeightKg.toLocaleString()} kg total, used to compute any charges billed per kg.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Quantity (Boxes) <span className="text-orange">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  step="1"
                  value={formValues.quantity}
                  onChange={(e) => setFormValues((v) => ({ ...v, quantity: Number(e.target.value) }))}
                  className="w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none focus:border-navy"
                />
                <p className="mt-1 text-xs text-foreground/50">Number of boxes/packages being shipped.</p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Dimensions</label>
                <input
                  value={formValues.dimensions}
                  onChange={(e) => setFormValues((v) => ({ ...v, dimensions: e.target.value }))}
                  placeholder="e.g. 40x30x20 cm"
                  className="w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none focus:border-navy"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Currency</label>
                <select
                  value={formValues.currency}
                  onChange={(e) => setFormValues((v) => ({ ...v, currency: e.target.value }))}
                  className="w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none focus:border-navy"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  GST / Tax % <span className="text-orange">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={formValues.taxRate}
                  onChange={(e) => setFormValues((v) => ({ ...v, taxRate: Number(e.target.value) }))}
                  className="w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none focus:border-navy"
                />
                <p className="mt-1 text-xs text-foreground/50">Applied on the calculated charges (default: India GST 18%).</p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Valid Until</label>
                <input
                  type="date"
                  value={formValues.validUntil}
                  onChange={(e) => setFormValues((v) => ({ ...v, validUntil: e.target.value }))}
                  className="w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none focus:border-navy"
                />
              </div>

              {editing && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Status</label>
                  <select
                    value={formValues.status}
                    onChange={(e) => setFormValues((v) => ({ ...v, status: e.target.value }))}
                    className="w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none focus:border-navy"
                  >
                    {QUOTATION_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Charges</label>
                <Button variant="ghost" size="sm" icon={Plus} onClick={addCharge}>
                  Add Charge
                </Button>
              </div>
              <div className="space-y-2">
                {formValues.charges.map((charge, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={charge.label}
                      onChange={(e) => updateCharge(i, "label", e.target.value)}
                      placeholder="e.g. Freight, Fuel Charge, Demand Charge"
                      className="flex-1 rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none focus:border-navy"
                    />
                    <select
                      value={charge.basis}
                      onChange={(e) => updateCharge(i, "basis", e.target.value)}
                      className="w-28 shrink-0 rounded-xl border border-border-subtle bg-background px-2 py-2.5 text-sm outline-none focus:border-navy"
                    >
                      {CHARGE_BASES.map((b) => (
                        <option key={b.value} value={b.value}>{b.label}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={charge.rate}
                      onChange={(e) => updateCharge(i, "rate", e.target.value)}
                      placeholder={
                        charge.basis === "per_kg" ? "Rate / kg" : charge.basis === "percent" ? "Rate %" : "Amount"
                      }
                      className="w-28 shrink-0 rounded-xl border border-border-subtle bg-background px-3 py-2.5 text-sm outline-none focus:border-navy"
                    />
                    <span className="w-24 shrink-0 text-right text-sm text-foreground/60">
                      {formValues.currency} {computeChargeAmount(charge, totalWeightKg, formTotals.baseAmount).toLocaleString()}
                    </span>
                    <button
                      onClick={() => removeCharge(i)}
                      aria-label="Remove charge"
                      className="flex size-9 shrink-0 items-center justify-center rounded-lg text-foreground/50 hover:bg-red-500/10 hover:text-red-500"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-3 space-y-1.5 border-t border-border-subtle pt-3 text-sm">
                <div className="flex items-center justify-end gap-3 text-foreground/60">
                  <span>Subtotal</span>
                  <span className="w-32 text-right">{formValues.currency} {formTotals.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-end gap-3 text-foreground/60">
                  <span>GST / Tax ({formValues.taxRate}%)</span>
                  <span className="w-32 text-right">{formValues.currency} {formTotals.taxAmount.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-end gap-3">
                  <span className="font-medium text-foreground">Total</span>
                  <span className="w-32 text-right font-heading text-lg font-bold text-foreground">
                    {formValues.currency} {formTotals.total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-1.5 block text-sm font-medium text-foreground">Notes</label>
              <textarea
                rows={3}
                value={formValues.notes}
                onChange={(e) => setFormValues((v) => ({ ...v, notes: e.target.value }))}
                className="w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none focus:border-navy"
              />
            </div>

            {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={closeModal}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
