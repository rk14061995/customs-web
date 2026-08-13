"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Pencil, Trash2, X, Loader2, FileText, Bold } from "lucide-react";
import Button from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import { computeBillTotals } from "@/lib/billUtils";

const BILL_STATUSES = ["unpaid", "paid", "cancelled"];

const statusColor: Record<string, string> = {
  unpaid: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  paid: "bg-green-500/10 text-green-600 dark:text-green-400",
  cancelled: "bg-foreground/10 text-foreground/60",
};

const TAX_TYPES = [
  { value: "igst", label: "IGST (interstate)" },
  { value: "cgst_sgst", label: "CGST + SGST (intrastate)" },
  { value: "none", label: "No tax" },
];

type Customer = { _id: string; name: string; company?: string };
type Shipment = {
  _id: string;
  trackingNumber: string;
  carrierTrackingNumber?: string;
  origin: string;
  destination: string;
  weight?: string;
  packages?: number;
  cost?: number;
  serviceType?: string;
  estimatedDelivery?: string;
  customer?: { name: string; company?: string };
};
type BillItem = { description: string; hsnSac?: string; unit?: string; quantity: number; rate: number; amount: number };
type Bill = {
  _id: string;
  billNumber: string;
  customer: Customer | null;
  shipment: Shipment | null;
  billDate: string;
  dueDate?: string;
  items: BillItem[];
  currency: string;
  taxType: string;
  taxRate: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  status: string;
  notes?: string;
};

const emptyItem: BillItem = { description: "", hsnSac: "", unit: "Nos", quantity: 1, rate: 0, amount: 0 };

/** True when an item still has no meaningful content — safe to auto-fill without clobbering user input. */
function isBlankItem(item: BillItem) {
  return !item.description.trim() && item.quantity === 1 && item.rate === 0;
}

function sameItem(a: BillItem, b: BillItem) {
  return (
    a.description === b.description &&
    a.hsnSac === b.hsnSac &&
    a.unit === b.unit &&
    a.quantity === b.quantity &&
    a.rate === b.rate
  );
}

/** Same random-suffixed scheme as `generateBillNumber` in shipmentUtils — duplicated here since that
 *  module also imports Mongoose models and can't be pulled into a client bundle. */
function generatePendingBillNumber() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 3; i++) suffix += chars[Math.floor(Math.random() * chars.length)];
  return `BILL-${Date.now().toString(36).toUpperCase()}${suffix}`;
}

/** Formats a date Tally-style, e.g. "27.07.26". */
function formatShortDate(date?: string) {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).slice(-2);
  return `${day}.${month}.${year}`;
}

/** Splits a free-text weight like "80 kg" into a numeric quantity and its unit. */
function parseWeight(weight?: string): { qty: number; unit: string } {
  const match = weight?.trim().match(/^([\d.]+)\s*(.*)$/);
  if (match) {
    const qty = parseFloat(match[1]);
    return { qty: Number.isFinite(qty) && qty > 0 ? qty : 1, unit: match[2].trim() || "Kgs" };
  }
  return { qty: 1, unit: weight?.trim() || "Kgs" };
}

/**
 * Builds a "Courier Booking" line item from a shipment, Tally-style — AWB/destination/date and box
 * count as description lines, weight as the billed quantity. Mirrors the Sales_824 sample invoice.
 */
function buildShipmentItem(ship: Shipment, billNumber: string): BillItem {
  const boxes = ship.packages && ship.packages > 0 ? ship.packages : 1;
  const { qty, unit } = parseWeight(ship.weight);
  const rate = ship.cost ? Math.round((ship.cost / qty) * 100) / 100 : 0;
  const awb = ship.carrierTrackingNumber || ship.trackingNumber;
  const date = formatShortDate(ship.estimatedDelivery);
  const customerLabel = (ship.customer?.company || ship.customer?.name || "").toUpperCase();

  const lines = [
    "**Courier Booking**",
    `    ${[awb, ship.destination?.toUpperCase(), date].filter(Boolean).join("//")}`,
    `    INVOICE NO. ${billNumber || "(auto)"}`,
    `    NO. OF BOXES: ${boxes}`,
  ];
  if (customerLabel) lines.push(`    ${customerLabel}`);

  return {
    description: lines.join("\n"),
    hsnSac: "996812",
    unit,
    quantity: qty,
    rate,
    amount: rate * qty,
  };
}

const emptyForm = {
  customer: "",
  shipment: "",
  billNumber: "",
  billDate: new Date().toISOString().slice(0, 10),
  dueDate: "",
  items: [emptyItem],
  currency: "INR",
  taxType: "igst",
  taxRate: 0,
  status: "unpaid",
  notes: "",
};

export default function BillsManager() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Bill | null>(null);
  const [formValues, setFormValues] = useState<typeof emptyForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  // Tracks the item auto-filled from the currently selected shipment, so we can
  // refresh it in place if the shipment changes again without clobbering a row
  // the admin has since edited by hand.
  const [autoShipmentItem, setAutoShipmentItem] = useState<BillItem | null>(null);

  const load = async () => {
    setLoading(true);
    const [billsRes, customersRes, shipmentsRes] = await Promise.all([
      fetch("/api/admin/bills"),
      fetch("/api/admin/customers"),
      fetch("/api/admin/shipments"),
    ]);
    setBills(await billsRes.json());
    setCustomers(await customersRes.json());
    setShipments(await shipmentsRes.json());
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const customerOptions = useMemo(
    () => customers.map((c) => ({ value: c._id, label: c.company ? `${c.name} — ${c.company}` : c.name })),
    [customers]
  );

  const shipmentOptions = useMemo(
    () => shipments.map((s) => ({ value: s._id, label: `${s.trackingNumber} · ${s.origin} → ${s.destination}` })),
    [shipments]
  );

  const formTotals = useMemo(() => computeBillTotals(formValues.items, formValues.taxRate), [formValues.items, formValues.taxRate]);

  const openCreate = () => {
    setEditing(null);
    // Pre-generate the bill number so it can be quoted inside the item description
    // (see buildShipmentItem) before the bill is actually saved; the server uses
    // this same value instead of minting its own, so it stays consistent.
    setFormValues({ ...emptyForm, billNumber: generatePendingBillNumber() });
    setAutoShipmentItem(null);
    setError("");
    setModalOpen(true);
  };

  const openEdit = (row: Bill) => {
    setEditing(row);
    setFormValues({
      customer: row.customer?._id ?? "",
      shipment: row.shipment?._id ?? "",
      billNumber: row.billNumber,
      billDate: row.billDate,
      dueDate: row.dueDate ?? "",
      items: row.items.length ? row.items : [emptyItem],
      currency: row.currency,
      taxType: row.taxType ?? "igst",
      taxRate: row.taxRate,
      status: row.status,
      notes: row.notes ?? "",
    });
    setAutoShipmentItem(null);
    setError("");
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  /** Selecting a shipment pulls its courier tracking number, weight and box count into the first item row. */
  const handleShipmentChange = (id: string) => {
    const ship = id ? shipments.find((s) => s._id === id) : undefined;
    const autoItem = ship ? buildShipmentItem(ship, formValues.billNumber) : null;
    setFormValues((v) => {
      if (!autoItem) return { ...v, shipment: id };
      const first = v.items[0];
      // Only overwrite the first row if it's still blank, or it's the auto-fill
      // from a previously selected shipment — never a row the admin edited.
      const canOverwrite = !first || isBlankItem(first) || (autoShipmentItem && sameItem(first, autoShipmentItem));
      const items = canOverwrite ? [autoItem, ...v.items.slice(1)] : [autoItem, ...v.items];
      return { ...v, shipment: id, items };
    });
    setAutoShipmentItem(autoItem);
  };

  const numericItemFields: (keyof BillItem)[] = ["quantity", "rate"];

  const updateItem = (index: number, field: keyof BillItem, value: string) => {
    setFormValues((v) => ({
      ...v,
      items: v.items.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [field]: numericItemFields.includes(field) ? Number(value) : value };
        updated.amount = updated.quantity * updated.rate;
        return updated;
      }),
    }));
  };

  const addItem = () => setFormValues((v) => ({ ...v, items: [...v.items, emptyItem] }));

  const removeItem = (index: number) =>
    setFormValues((v) => ({ ...v, items: v.items.filter((_, i) => i !== index) }));

  // One textarea ref per item row, so the Bold button knows which text is highlighted.
  const descriptionRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  /** Wraps the highlighted text in a description box with **bold** markers (or un-bolds it if it already is). */
  const toggleBold = (index: number) => {
    const el = descriptionRefs.current[index];
    if (!el) return;
    const { selectionStart, selectionEnd, value } = el;
    if (selectionStart == null || selectionEnd == null || selectionStart === selectionEnd) {
      el.focus();
      return; // Nothing highlighted — select some text first.
    }
    const selected = value.slice(selectionStart, selectionEnd);
    const isBold = selected.startsWith("**") && selected.endsWith("**") && selected.length > 4;
    const replacement = isBold ? selected.slice(2, -2) : `**${selected}**`;
    const nextValue = value.slice(0, selectionStart) + replacement + value.slice(selectionEnd);
    updateItem(index, "description", nextValue);
    // Re-select the (now bolded/unbolded) text after React re-renders the controlled value.
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(selectionStart, selectionStart + replacement.length);
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...formValues,
        items: formValues.items.filter((i) => i.description.trim() !== ""),
      };
      const url = editing ? `/api/admin/bills/${editing._id}` : "/api/admin/bills";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to save bill");
        return;
      }
      setModalOpen(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: Bill) => {
    if (!confirm(`Delete bill ${row.billNumber}?`)) return;
    await fetch(`/api/admin/bills/${row._id}`, { method: "DELETE" });
    await load();
  };

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Bills</h1>
          <p className="mt-1 text-sm text-foreground/60">
            Generate itemized bills per customer/shipment and download them as PDF.
          </p>
        </div>
        <Button icon={Plus} onClick={openCreate} disabled={customers.length === 0}>
          Add Bill
        </Button>
      </div>

      {customers.length === 0 && (
        <div className="mb-6 rounded-2xl border border-orange/30 bg-orange/5 p-4 text-sm text-foreground/80">
          Add a customer first before creating a bill.
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border-subtle bg-background">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border-subtle bg-surface">
              <tr>
                <th className="px-5 py-3 font-medium text-foreground/60">Bill #</th>
                <th className="px-5 py-3 font-medium text-foreground/60">Customer</th>
                <th className="px-5 py-3 font-medium text-foreground/60">Shipment</th>
                <th className="px-5 py-3 font-medium text-foreground/60">Date</th>
                <th className="px-5 py-3 font-medium text-foreground/60">Total</th>
                <th className="px-5 py-3 font-medium text-foreground/60">Status</th>
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
              ) : bills.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-foreground/50">
                    No bills yet.
                  </td>
                </tr>
              ) : (
                bills.map((row) => (
                  <tr key={row._id}>
                    <td className="px-5 py-3 font-medium text-foreground">{row.billNumber}</td>
                    <td className="px-5 py-3 text-foreground/80">{row.customer?.name ?? "—"}</td>
                    <td className="px-5 py-3 text-foreground/70">{row.shipment?.trackingNumber ?? "—"}</td>
                    <td className="px-5 py-3 text-foreground/60">{formatDate(row.billDate)}</td>
                    <td className="px-5 py-3 text-foreground">{row.currency} {row.total.toLocaleString()}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusColor[row.status] ?? "bg-foreground/10"}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <a
                          href={`/api/admin/bills/${row._id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="View PDF"
                          title="View PDF"
                          className="flex size-8 items-center justify-center rounded-lg text-foreground/50 hover:bg-navy/10 hover:text-navy"
                        >
                          <FileText className="size-4" />
                        </a>
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
                {editing ? `Edit Bill ${editing.billNumber}` : "Add Bill"}
              </h2>
              <button onClick={closeModal} aria-label="Close" className="text-foreground/50 hover:text-foreground">
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-4">
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
                <label className="mb-1.5 block text-sm font-medium text-foreground">Shipment (optional)</label>
                <select
                  value={formValues.shipment}
                  onChange={(e) => handleShipmentChange(e.target.value)}
                  className="w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none focus:border-navy"
                >
                  <option value="">None</option>
                  {shipmentOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-foreground/50">
                  Selecting a shipment fills the first item row with its AWB/tracking number, weight and box count.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Bill Date</label>
                  <input
                    type="date"
                    value={formValues.billDate}
                    onChange={(e) => setFormValues((v) => ({ ...v, billDate: e.target.value }))}
                    className="w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none focus:border-navy"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Due Date</label>
                  <input
                    type="date"
                    value={formValues.dueDate}
                    onChange={(e) => setFormValues((v) => ({ ...v, dueDate: e.target.value }))}
                    className="w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none focus:border-navy"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Items</label>
                <div className="space-y-2">
                  {formValues.items.map((item, i) => (
                    <div key={i} className="space-y-1.5 rounded-xl border border-border-subtle p-2">
                      <div className="flex items-start gap-2">
                        <div className="relative flex-1">
                          <textarea
                            ref={(el) => {
                              descriptionRefs.current[i] = el;
                            }}
                            value={item.description}
                            onChange={(e) => updateItem(i, "description", e.target.value)}
                            placeholder="Description"
                            rows={item.description.includes("\n") ? 5 : 1}
                            className="w-full resize-y rounded-xl border border-border-subtle bg-background px-3 py-2 pr-9 text-sm outline-none focus:border-navy"
                          />
                          <button
                            type="button"
                            onClick={() => toggleBold(i)}
                            aria-label="Bold selected text"
                            title="Highlight text above, then click to bold it"
                            className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-md text-foreground/50 hover:bg-navy/10 hover:text-navy"
                          >
                            <Bold className="size-3.5" />
                          </button>
                        </div>
                        <input
                          value={item.hsnSac ?? ""}
                          onChange={(e) => updateItem(i, "hsnSac", e.target.value)}
                          placeholder="HSN/SAC"
                          className="w-24 rounded-xl border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-navy"
                        />
                        <button
                          onClick={() => removeItem(i)}
                          aria-label="Remove item"
                          className="flex size-[42px] shrink-0 items-center justify-center rounded-lg text-foreground/50 hover:bg-red-500/10 hover:text-red-500"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          value={item.quantity}
                          onChange={(e) => updateItem(i, "quantity", e.target.value)}
                          placeholder="Qty"
                          className="w-20 rounded-xl border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-navy"
                        />
                        <input
                          value={item.unit ?? ""}
                          onChange={(e) => updateItem(i, "unit", e.target.value)}
                          placeholder="Unit (Kgs, Nos...)"
                          className="w-28 rounded-xl border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-navy"
                        />
                        <input
                          type="number"
                          min={0}
                          value={item.rate}
                          onChange={(e) => updateItem(i, "rate", e.target.value)}
                          placeholder="Rate"
                          className="w-28 rounded-xl border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-navy"
                        />
                        <div className="flex h-[42px] flex-1 shrink-0 items-center justify-end px-2 text-sm text-foreground/70">
                          {(item.quantity * item.rate).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={addItem}
                  className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-navy hover:underline dark:text-white"
                >
                  <Plus className="size-4" /> Add Item
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Currency</label>
                  <input
                    value={formValues.currency}
                    onChange={(e) => setFormValues((v) => ({ ...v, currency: e.target.value }))}
                    className="w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none focus:border-navy"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Tax Type</label>
                  <select
                    value={formValues.taxType}
                    onChange={(e) => setFormValues((v) => ({ ...v, taxType: e.target.value }))}
                    className="w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none focus:border-navy"
                  >
                    {TAX_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Tax Rate (%)</label>
                  <input
                    type="number"
                    min={0}
                    value={formValues.taxRate}
                    onChange={(e) => setFormValues((v) => ({ ...v, taxRate: Number(e.target.value) }))}
                    className="w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none focus:border-navy"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Status</label>
                <select
                  value={formValues.status}
                  onChange={(e) => setFormValues((v) => ({ ...v, status: e.target.value }))}
                  className="w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none focus:border-navy"
                >
                  {BILL_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Notes</label>
                <textarea
                  rows={2}
                  value={formValues.notes}
                  onChange={(e) => setFormValues((v) => ({ ...v, notes: e.target.value }))}
                  className="w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none focus:border-navy"
                />
              </div>

              <div className="rounded-xl border border-border-subtle bg-surface p-4 text-sm">
                <div className="flex justify-between text-foreground/70">
                  <span>Subtotal</span>
                  <span>{formValues.currency} {formTotals.subtotal.toLocaleString()}</span>
                </div>
                <div className="mt-1 flex justify-between text-foreground/70">
                  <span>Tax ({formValues.taxRate}%)</span>
                  <span>{formValues.currency} {formTotals.taxAmount.toLocaleString()}</span>
                </div>
                <div className="mt-2 flex justify-between border-t border-border-subtle pt-2 font-semibold text-foreground">
                  <span>Total</span>
                  <span>{formValues.currency} {formTotals.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={closeModal}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !formValues.customer}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
