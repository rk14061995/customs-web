"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, X, Loader2, Wallet, Clock, AlertCircle, Send, RefreshCw, Copy } from "lucide-react";
import Button from "@/components/ui/Button";
import StatCard from "@/components/admin/StatCard";
import { formatDate } from "@/lib/utils";

const PAYMENT_METHODS = ["Cash", "Bank Transfer", "Card", "UPI", "Cheque", "Online", "Other"];
const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded", "partially-refunded"];

const statusColor: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  paid: "bg-green-500/10 text-green-600 dark:text-green-400",
  failed: "bg-red-500/10 text-red-500",
  refunded: "bg-foreground/10 text-foreground/60",
  "partially-refunded": "bg-foreground/10 text-foreground/60",
};

type Shipment = {
  _id: string;
  trackingNumber: string;
  origin: string;
  destination: string;
  cost: number;
  currency: string;
  customer?: { name: string; company?: string } | null;
};

type Payment = {
  _id: string;
  invoiceNumber: string;
  shipment: Shipment | null;
  amount: number;
  currency: string;
  method: string;
  status: string;
  paidAt?: string;
  dueDate?: string;
  notes?: string;
  paymentLinkId?: string;
  paymentLinkUrl?: string;
  paymentLinkStatus?: string;
  createdAt: string;
};

const emptyForm = {
  shipment: "",
  amount: 0,
  currency: "INR",
  method: PAYMENT_METHODS[0],
  status: "pending",
  paidAt: "",
  dueDate: "",
  notes: "",
};

export default function PaymentsManager() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Payment | null>(null);
  const [formValues, setFormValues] = useState<typeof emptyForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [sendingLinkId, setSendingLinkId] = useState<string | null>(null);
  const [checkingStatusId, setCheckingStatusId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [paymentsRes, shipmentsRes] = await Promise.all([
      fetch("/api/admin/payments"),
      fetch("/api/admin/shipments"),
    ]);
    setPayments(await paymentsRes.json());
    setShipments(await shipmentsRes.json());
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const shipmentOptions = useMemo(
    () =>
      shipments.map((s) => ({
        value: s._id,
        label: `${s.trackingNumber} · ${s.customer?.name ?? "No customer"} · ${s.currency} ${s.cost}`,
      })),
    [shipments]
  );

  const summary = useMemo(() => {
    const totalRevenue = payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
    const pendingAmount = payments.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);
    const today = new Date().toISOString().slice(0, 10);
    const overdueCount = payments.filter((p) => p.status === "pending" && p.dueDate && p.dueDate < today).length;
    return { totalRevenue, pendingAmount, overdueCount };
  }, [payments]);

  const openCreate = () => {
    setEditing(null);
    setFormValues(emptyForm);
    setError("");
    setModalOpen(true);
  };

  const openEdit = (row: Payment) => {
    setEditing(row);
    setFormValues({
      shipment: row.shipment?._id ?? "",
      amount: row.amount,
      currency: row.currency,
      method: row.method,
      status: row.status,
      paidAt: row.paidAt ?? "",
      dueDate: row.dueDate ?? "",
      notes: row.notes ?? "",
    });
    setError("");
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const url = editing ? `/api/admin/payments/${editing._id}` : "/api/admin/payments";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formValues),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to save payment");
        return;
      }
      setModalOpen(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: Payment) => {
    if (!confirm(`Delete payment ${row.invoiceNumber}?`)) return;
    await fetch(`/api/admin/payments/${row._id}`, { method: "DELETE" });
    await load();
  };

  const handleSendLink = async (row: Payment) => {
    setSendingLinkId(row._id);
    try {
      const res = await fetch(`/api/admin/payments/${row._id}/send-link`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error ?? "Failed to send payment link");
        return;
      }
      await load();
    } finally {
      setSendingLinkId(null);
    }
  };

  const handleCheckStatus = async (row: Payment) => {
    setCheckingStatusId(row._id);
    try {
      const res = await fetch(`/api/admin/payments/${row._id}/check-status`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error ?? "Failed to check payment status");
        return;
      }
      await load();
    } finally {
      setCheckingStatusId(null);
    }
  };

  const handleCopyLink = (row: Payment) => {
    if (row.paymentLinkUrl) navigator.clipboard.writeText(row.paymentLinkUrl);
  };

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Payments</h1>
          <p className="mt-1 text-sm text-foreground/60">
            Record invoices and payments against shipments.
          </p>
        </div>
        <Button icon={Plus} onClick={openCreate} disabled={shipments.length === 0}>
          Add Payment
        </Button>
      </div>

      {shipments.length === 0 && (
        <div className="mb-6 rounded-2xl border border-orange/30 bg-orange/5 p-4 text-sm text-foreground/80">
          Create a shipment first before recording a payment.
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Revenue (Paid)" value={summary.totalRevenue.toLocaleString()} icon={Wallet} accent="orange" />
        <StatCard label="Pending Amount" value={summary.pendingAmount.toLocaleString()} icon={Clock} />
        <StatCard label="Overdue Invoices" value={summary.overdueCount} icon={AlertCircle} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border-subtle bg-background">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border-subtle bg-surface">
              <tr>
                <th className="px-5 py-3 font-medium text-foreground/60">Invoice #</th>
                <th className="px-5 py-3 font-medium text-foreground/60">Shipment</th>
                <th className="px-5 py-3 font-medium text-foreground/60">Customer</th>
                <th className="px-5 py-3 font-medium text-foreground/60">Amount</th>
                <th className="px-5 py-3 font-medium text-foreground/60">Method</th>
                <th className="px-5 py-3 font-medium text-foreground/60">Status</th>
                <th className="px-5 py-3 font-medium text-foreground/60">Due Date</th>
                <th className="px-5 py-3 text-right font-medium text-foreground/60">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-foreground/50">
                    <Loader2 className="mx-auto size-5 animate-spin" />
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-foreground/50">
                    No payments recorded yet.
                  </td>
                </tr>
              ) : (
                payments.map((row) => (
                  <tr key={row._id}>
                    <td className="px-5 py-3 font-medium text-foreground">{row.invoiceNumber}</td>
                    <td className="px-5 py-3 text-foreground/80">{row.shipment?.trackingNumber ?? "—"}</td>
                    <td className="px-5 py-3 text-foreground/80">{row.shipment?.customer?.name ?? "—"}</td>
                    <td className="px-5 py-3 text-foreground">{row.currency} {row.amount.toLocaleString()}</td>
                    <td className="px-5 py-3 text-foreground/70">{row.method}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusColor[row.status] ?? "bg-foreground/10"}`}>
                        {row.status}
                      </span>
                      {row.paymentLinkStatus && (
                        <span className="ml-1.5 rounded-full bg-foreground/10 px-2 py-1 text-xs font-medium text-foreground/60">
                          Link: {row.paymentLinkStatus}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-foreground/60">{row.dueDate ? formatDate(row.dueDate) : "—"}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        {row.status !== "paid" && (
                          <button
                            onClick={() => handleSendLink(row)}
                            disabled={sendingLinkId === row._id}
                            aria-label="Send Payment Link"
                            title="Send Payment Link"
                            className="flex size-8 items-center justify-center rounded-lg text-foreground/50 hover:bg-navy/10 hover:text-navy disabled:opacity-60"
                          >
                            {sendingLinkId === row._id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Send className="size-4" />
                            )}
                          </button>
                        )}
                        {row.paymentLinkId && row.status !== "paid" && (
                          <button
                            onClick={() => handleCheckStatus(row)}
                            disabled={checkingStatusId === row._id}
                            aria-label="Check Payment Status"
                            title="Check Payment Status"
                            className="flex size-8 items-center justify-center rounded-lg text-foreground/50 hover:bg-navy/10 hover:text-navy disabled:opacity-60"
                          >
                            {checkingStatusId === row._id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <RefreshCw className="size-4" />
                            )}
                          </button>
                        )}
                        {row.paymentLinkUrl && (
                          <button
                            onClick={() => handleCopyLink(row)}
                            aria-label="Copy Payment Link"
                            title="Copy Payment Link"
                            className="flex size-8 items-center justify-center rounded-lg text-foreground/50 hover:bg-navy/10 hover:text-navy"
                          >
                            <Copy className="size-4" />
                          </button>
                        )}
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
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-background p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold text-foreground">
                {editing ? `Edit Payment ${editing.invoiceNumber}` : "Add Payment"}
              </h2>
              <button onClick={closeModal} aria-label="Close" className="text-foreground/50 hover:text-foreground">
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Shipment <span className="text-orange">*</span>
                </label>
                <select
                  value={formValues.shipment}
                  disabled={Boolean(editing)}
                  onChange={(e) => setFormValues((v) => ({ ...v, shipment: e.target.value }))}
                  className="w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none focus:border-navy disabled:opacity-60"
                >
                  <option value="">Select shipment...</option>
                  {shipmentOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Amount <span className="text-orange">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formValues.amount}
                    onChange={(e) => setFormValues((v) => ({ ...v, amount: Number(e.target.value) }))}
                    className="w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none focus:border-navy"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Currency</label>
                  <input
                    value={formValues.currency}
                    onChange={(e) => setFormValues((v) => ({ ...v, currency: e.target.value }))}
                    className="w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none focus:border-navy"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Method</label>
                  <select
                    value={formValues.method}
                    onChange={(e) => setFormValues((v) => ({ ...v, method: e.target.value }))}
                    className="w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none focus:border-navy"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Status</label>
                  <select
                    value={formValues.status}
                    onChange={(e) => setFormValues((v) => ({ ...v, status: e.target.value }))}
                    className="w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none focus:border-navy"
                  >
                    {PAYMENT_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Paid At</label>
                  <input
                    type="date"
                    value={formValues.paidAt}
                    onChange={(e) => setFormValues((v) => ({ ...v, paidAt: e.target.value }))}
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
                <label className="mb-1.5 block text-sm font-medium text-foreground">Notes</label>
                <textarea
                  rows={3}
                  value={formValues.notes}
                  onChange={(e) => setFormValues((v) => ({ ...v, notes: e.target.value }))}
                  className="w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none focus:border-navy"
                />
              </div>
            </div>

            {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={closeModal}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !formValues.shipment}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
