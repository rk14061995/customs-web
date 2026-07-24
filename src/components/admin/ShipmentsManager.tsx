"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, X, Loader2, History, Search, RefreshCw } from "lucide-react";
import Button from "@/components/ui/Button";

const TRACKABLE_PROVIDERS = ["Ship24", "UPS", "FedEx", "DHL"];

const SERVICE_TYPES = [
  "Domestic Courier",
  "International Courier",
  "Air Freight",
  "Ocean Freight",
  "Road Transport",
  "Express Delivery",
  "Warehousing",
];

const SHIPMENT_STATUSES = [
  "Booked",
  "Picked Up",
  "In Transit",
  "Customs Clearance",
  "Out For Delivery",
  "Delivered",
  "On Hold",
  "Cancelled",
];

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED"];

const statusColor: Record<string, string> = {
  Booked: "bg-navy/10 text-navy dark:text-white",
  "Picked Up": "bg-navy/10 text-navy dark:text-white",
  "In Transit": "bg-orange/10 text-orange",
  "Customs Clearance": "bg-orange/10 text-orange",
  "Out For Delivery": "bg-orange/10 text-orange",
  Delivered: "bg-green-500/10 text-green-600 dark:text-green-400",
  "On Hold": "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  Cancelled: "bg-red-500/10 text-red-500",
};

const paymentStatusColor: Record<string, string> = {
  unpaid: "bg-red-500/10 text-red-500",
  partial: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  paid: "bg-green-500/10 text-green-600 dark:text-green-400",
  refunded: "bg-foreground/10 text-foreground/60",
};

type Customer = { _id: string; name: string; company?: string };
type Carrier = { _id: string; name: string; provider?: string };
type ShipmentEvent = { status: string; location: string; date: string; completed: boolean };
type Shipment = {
  _id: string;
  trackingNumber: string;
  customer?: Customer | null;
  carrier?: Carrier | null;
  carrierTrackingNumber?: string;
  serviceType: string;
  origin: string;
  destination: string;
  weight: string;
  dimensions?: string;
  packages: number;
  status: string;
  estimatedDelivery: string;
  events: ShipmentEvent[];
  cost: number;
  currency: string;
  paymentStatus: string;
  notes?: string;
  createdAt: string;
};

const emptyForm = {
  customer: "",
  carrier: "",
  carrierTrackingNumber: "",
  serviceType: SERVICE_TYPES[0],
  origin: "",
  destination: "",
  weight: "",
  dimensions: "",
  packages: 1,
  cost: 0,
  currency: "INR",
  estimatedDelivery: "",
  status: "Booked",
  notes: "",
};

export default function ShipmentsManager() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Shipment | null>(null);
  const [formValues, setFormValues] = useState<typeof emptyForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [timelineFor, setTimelineFor] = useState<Shipment | null>(null);
  const [newEvent, setNewEvent] = useState({
    status: "Picked Up",
    location: "",
    date: new Date().toISOString().slice(0, 10),
    completed: true,
  });
  const [savingEvent, setSavingEvent] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/admin/shipments?${params.toString()}`);
    const data = await res.json();
    setShipments(data);
    setLoading(false);
  };

  const loadLookups = async () => {
    const [customersRes, carriersRes] = await Promise.all([
      fetch("/api/admin/customers"),
      fetch("/api/admin/carriers"),
    ]);
    setCustomers(await customersRes.json());
    setCarriers(await carriersRes.json());
  };

  useEffect(() => {
    loadLookups();
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  const customerOptions = useMemo(
    () => customers.map((c) => ({ value: c._id, label: c.company ? `${c.name} — ${c.company}` : c.name })),
    [customers]
  );

  const openCreate = () => {
    setEditing(null);
    setFormValues(emptyForm);
    setError("");
    setModalOpen(true);
  };

  const openEdit = (row: Shipment) => {
    setEditing(row);
    setFormValues({
      customer: row.customer?._id ?? "",
      carrier: row.carrier?._id ?? "",
      carrierTrackingNumber: row.carrierTrackingNumber ?? "",
      serviceType: row.serviceType,
      origin: row.origin,
      destination: row.destination,
      weight: row.weight,
      dimensions: row.dimensions ?? "",
      packages: row.packages,
      cost: row.cost,
      currency: row.currency,
      estimatedDelivery: row.estimatedDelivery,
      status: row.status,
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
      const payload: Record<string, unknown> = { ...formValues };
      if (!payload.carrier) delete payload.carrier;
      if (!editing) delete payload.status;

      const url = editing ? `/api/admin/shipments/${editing._id}` : "/api/admin/shipments";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to save shipment");
        return;
      }
      setModalOpen(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: Shipment) => {
    if (!confirm(`Delete shipment ${row.trackingNumber}? This also removes its payment records.`)) return;
    await fetch(`/api/admin/shipments/${row._id}`, { method: "DELETE" });
    await load();
  };

  const openTimeline = (row: Shipment) => {
    setTimelineFor(row);
    setSyncError("");
    setNewEvent({
      status: "Picked Up",
      location: row.destination,
      date: new Date().toISOString().slice(0, 10),
      completed: true,
    });
  };

  const handleSync = async () => {
    if (!timelineFor) return;
    setSyncing(true);
    setSyncError("");
    try {
      const res = await fetch(`/api/admin/shipments/${timelineFor._id}/sync`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSyncError(data.error ?? "Failed to sync tracking from carrier");
        return;
      }
      setTimelineFor(data.shipment);
      await load();
    } finally {
      setSyncing(false);
    }
  };

  const handleAddEvent = async () => {
    if (!timelineFor) return;
    setSavingEvent(true);
    try {
      const events = [...timelineFor.events, newEvent];
      const res = await fetch(`/api/admin/shipments/${timelineFor._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events, status: newEvent.status }),
      });
      if (res.ok) {
        const updated = await res.json();
        setTimelineFor(updated);
        await load();
      }
    } finally {
      setSavingEvent(false);
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Shipments</h1>
          <p className="mt-1 text-sm text-foreground/60">
            Create, track and manage every shipment from booking to delivery.
          </p>
        </div>
        <Button icon={Plus} onClick={openCreate}>
          Add Shipment
        </Button>
      </div>

      {customers.length === 0 && (
        <div className="mb-6 rounded-2xl border border-orange/30 bg-orange/5 p-4 text-sm text-foreground/80">
          You need at least one customer before creating a shipment.{" "}
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
            placeholder="Search tracking #, origin, destination..."
            className="w-full rounded-xl border border-border-subtle bg-background py-2.5 pl-10 pr-4 text-sm outline-none focus:border-navy"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none focus:border-navy"
        >
          <option value="">All Statuses</option>
          {SHIPMENT_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border-subtle bg-background">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border-subtle bg-surface">
              <tr>
                <th className="px-5 py-3 font-medium text-foreground/60">Tracking #</th>
                <th className="px-5 py-3 font-medium text-foreground/60">Customer</th>
                <th className="px-5 py-3 font-medium text-foreground/60">Route</th>
                <th className="px-5 py-3 font-medium text-foreground/60">Service</th>
                <th className="px-5 py-3 font-medium text-foreground/60">Status</th>
                <th className="px-5 py-3 font-medium text-foreground/60">Payment</th>
                <th className="px-5 py-3 font-medium text-foreground/60">Cost</th>
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
              ) : shipments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-foreground/50">
                    No shipments yet.
                  </td>
                </tr>
              ) : (
                shipments.map((row) => (
                  <tr key={row._id}>
                    <td className="px-5 py-3 font-medium text-foreground">{row.trackingNumber}</td>
                    <td className="px-5 py-3 text-foreground">{row.customer?.name ?? "—"}</td>
                    <td className="px-5 py-3 text-foreground/80">
                      {row.origin} → {row.destination}
                    </td>
                    <td className="px-5 py-3 text-foreground/70">{row.serviceType}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor[row.status] ?? "bg-foreground/10"}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${paymentStatusColor[row.paymentStatus] ?? "bg-foreground/10"}`}>
                        {row.paymentStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-foreground">
                      {row.currency} {row.cost.toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openTimeline(row)}
                          aria-label="Timeline"
                          className="flex size-8 items-center justify-center rounded-lg text-foreground/50 hover:bg-navy/10 hover:text-navy"
                        >
                          <History className="size-4" />
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
                {editing ? `Edit Shipment ${editing.trackingNumber}` : "Add Shipment"}
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
                <label className="mb-1.5 block text-sm font-medium text-foreground">Carrier</label>
                <select
                  value={formValues.carrier}
                  onChange={(e) => setFormValues((v) => ({ ...v, carrier: e.target.value }))}
                  className="w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none focus:border-navy"
                >
                  <option value="">Unassigned</option>
                  {carriers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}{c.provider && c.provider !== "Other" ? ` (${c.provider})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Carrier Tracking # (AWB)</label>
                <input
                  value={formValues.carrierTrackingNumber}
                  onChange={(e) => setFormValues((v) => ({ ...v, carrierTrackingNumber: e.target.value }))}
                  placeholder="e.g. 1Z999AA10123456784"
                  className="w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none focus:border-navy"
                />
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

              {editing && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Status</label>
                  <select
                    value={formValues.status}
                    onChange={(e) => setFormValues((v) => ({ ...v, status: e.target.value }))}
                    className="w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none focus:border-navy"
                  >
                    {SHIPMENT_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              )}

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
                  Weight <span className="text-orange">*</span>
                </label>
                <input
                  value={formValues.weight}
                  onChange={(e) => setFormValues((v) => ({ ...v, weight: e.target.value }))}
                  placeholder="e.g. 25 kg"
                  className="w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none focus:border-navy"
                />
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
                <label className="mb-1.5 block text-sm font-medium text-foreground"># Packages</label>
                <input
                  type="number"
                  min={1}
                  value={formValues.packages}
                  onChange={(e) => setFormValues((v) => ({ ...v, packages: Number(e.target.value) }))}
                  className="w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none focus:border-navy"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Estimated Delivery <span className="text-orange">*</span>
                </label>
                <input
                  type="date"
                  value={formValues.estimatedDelivery}
                  onChange={(e) => setFormValues((v) => ({ ...v, estimatedDelivery: e.target.value }))}
                  className="w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none focus:border-navy"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Shipment Cost <span className="text-orange">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={formValues.cost}
                  onChange={(e) => setFormValues((v) => ({ ...v, cost: Number(e.target.value) }))}
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

              <div className="sm:col-span-2">
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
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {timelineFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-background p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold text-foreground">
                Timeline · {timelineFor.trackingNumber}
              </h2>
              <button onClick={() => setTimelineFor(null)} aria-label="Close" className="text-foreground/50 hover:text-foreground">
                <X className="size-5" />
              </button>
            </div>

            {timelineFor.carrier?.provider && TRACKABLE_PROVIDERS.includes(timelineFor.carrier.provider) && (
              <div className="mb-5 flex items-center justify-between rounded-xl border border-border-subtle bg-surface p-3">
                <div className="text-sm">
                  <p className="font-medium text-foreground">{timelineFor.carrier.provider} Live Tracking</p>
                  <p className="text-xs text-foreground/50">
                    {timelineFor.carrierTrackingNumber
                      ? `AWB ${timelineFor.carrierTrackingNumber}`
                      : "Add the carrier's AWB number on this shipment to enable sync."}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={syncing ? undefined : RefreshCw}
                  onClick={handleSync}
                  disabled={syncing || !timelineFor.carrierTrackingNumber}
                >
                  {syncing ? <Loader2 className="size-4 animate-spin" /> : "Sync"}
                </Button>
              </div>
            )}
            {syncError && <p className="mb-4 text-sm text-red-500">{syncError}</p>}

            <ol className="mb-6 space-y-3 border-b border-border-subtle pb-6">
              {timelineFor.events.map((event, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{event.status}</span>
                  <span className="text-foreground/50">{event.location} · {event.date}</span>
                </li>
              ))}
            </ol>

            <p className="mb-3 text-sm font-medium text-foreground">Add Milestone</p>
            <div className="space-y-3">
              <select
                value={newEvent.status}
                onChange={(e) => setNewEvent((v) => ({ ...v, status: e.target.value }))}
                className="w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none focus:border-navy"
              >
                {SHIPMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <input
                value={newEvent.location}
                onChange={(e) => setNewEvent((v) => ({ ...v, location: e.target.value }))}
                placeholder="Location"
                className="w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none focus:border-navy"
              />
              <input
                type="date"
                value={newEvent.date}
                onChange={(e) => setNewEvent((v) => ({ ...v, date: e.target.value }))}
                className="w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none focus:border-navy"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setTimelineFor(null)}>Close</Button>
              <Button onClick={handleAddEvent} disabled={savingEvent || !newEvent.location}>
                {savingEvent ? <Loader2 className="size-4 animate-spin" /> : "Add & Update Status"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
