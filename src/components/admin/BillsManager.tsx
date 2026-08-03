"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, X, Loader2, FileText } from "lucide-react";
import Button from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";
import { computeBillTotals } from "@/lib/billUtils";

const BILL_STATUSES = ["unpaid", "paid", "cancelled"];

const statusColor: Record<string, string> = {
  unpaid: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  paid: "bg-green-500/10 text-green-600 dark:text-green-400",
  cancelled: "bg-foreground/10 text-foreground/60",
};

type Customer = { _id: string; name: string; company?: string };
type Shipment = { _id: string; trackingNumber: string; origin: string; destination: string };
type BillItem = { description: string; quantity: number; rate: number; amount: number };
type Bill = {
  _id: string;
  billNumber: string;
  customer: Customer | null;
  shipment: Shipment | null;
  billDate: string;
  dueDate?: string;
  items: BillItem[];
  currency: string;
  taxRate: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  status: string;
  notes?: string;
};

const emptyItem: BillItem = { description: "", quantity: 1, rate: 0, amount: 0 };

const emptyForm = {
  customer: "",
  shipment: "",
  billDate: new Date().toISOString().slice(0, 10),
  dueDate: "",
  items: [emptyItem],
  currency: "INR",
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
    setFormValues(emptyForm);
    setError("");
    setModalOpen(true);
  };

  const openEdit = (row: Bill) => {
    setEditing(row);
    setFormValues({
      customer: row.customer?._id ?? "",
      shipment: row.shipment?._id ?? "",
      billDate: row.billDate,
      dueDate: row.dueDate ?? "",
      items: row.items.length ? row.items : [emptyItem],
      currency: row.currency,
      taxRate: row.taxRate,
      status: row.status,
      notes: row.notes ?? "",
    });
    setError("");
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const updateItem = (index: number, field: keyof BillItem, value: string) => {
    setFormValues((v) => ({
      ...v,
      items: v.items.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [field]: field === "description" ? value : Number(value) };
        updated.amount = updated.quantity * updated.rate;
        return updated;
      }),
    }));
  };

  const addItem = () => setFormValues((v) => ({ ...v, items: [...v.items, emptyItem] }));

  const removeItem = (index: number) =>
    setFormValues((v) => ({ ...v, items: v.items.filter((_, i) => i !== index) }));

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
                  onChange={(e) => setFormValues((v) => ({ ...v, shipment: e.target.value }))}
                  className="w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none focus:border-navy"
                >
                  <option value="">None</option>
                  {shipmentOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
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
                    <div key={i} className="flex items-start gap-2">
                      <input
                        value={item.description}
                        onChange={(e) => updateItem(i, "description", e.target.value)}
                        placeholder="Description"
                        className="flex-1 rounded-xl border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-navy"
                      />
                      <input
                        type="number"
                        min={0}
                        value={item.quantity}
                        onChange={(e) => updateItem(i, "quantity", e.target.value)}
                        placeholder="Qty"
                        className="w-20 rounded-xl border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-navy"
                      />
                      <input
                        type="number"
                        min={0}
                        value={item.rate}
                        onChange={(e) => updateItem(i, "rate", e.target.value)}
                        placeholder="Rate"
                        className="w-28 rounded-xl border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-navy"
                      />
                      <div className="flex h-[42px] w-28 shrink-0 items-center justify-end px-2 text-sm text-foreground/70">
                        {(item.quantity * item.rate).toLocaleString()}
                      </div>
                      <button
                        onClick={() => removeItem(i)}
                        aria-label="Remove item"
                        className="flex size-[42px] shrink-0 items-center justify-center rounded-lg text-foreground/50 hover:bg-red-500/10 hover:text-red-500"
                      >
                        <Trash2 className="size-4" />
                      </button>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Currency</label>
                  <input
                    value={formValues.currency}
                    onChange={(e) => setFormValues((v) => ({ ...v, currency: e.target.value }))}
                    className="w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none focus:border-navy"
                  />
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
