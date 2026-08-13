"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, X, Loader2, Download, Pencil, CheckCircle2, Clock } from "lucide-react";
import Button from "@/components/ui/Button";
import { formatDate, formatDateTime } from "@/lib/utils";

const inputClass =
  "w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none focus:border-navy";

type TemplateRow = {
  _id: string;
  title: string;
  category: string;
  fileName: string;
  fileSize: number;
  createdAt: string;
};

type RequestItem = {
  template: { _id: string; title: string; category: string } | null;
  status: "pending" | "uploaded";
  upload?: { fileName: string; uploadedAt: string } | null;
};

type RequestRow = {
  _id: string;
  shipment: { _id: string; trackingNumber: string; origin: string; destination: string } | null;
  customer: { name: string; company?: string; email: string } | null;
  items: RequestItem[];
  excludedTemplates: string[];
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function DocumentsManager() {
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templateForm, setTemplateForm] = useState({ title: "", category: "" });
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateError, setTemplateError] = useState("");
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);

  const [editingRequest, setEditingRequest] = useState<RequestRow | null>(null);
  const [includedTemplateIds, setIncludedTemplateIds] = useState<string[]>([]);
  const [savingRequest, setSavingRequest] = useState(false);
  const [requestError, setRequestError] = useState("");

  const load = async () => {
    setLoading(true);
    const [templatesRes, requestsRes] = await Promise.all([
      fetch("/api/admin/document-templates"),
      fetch("/api/admin/document-requests"),
    ]);
    setTemplates(await templatesRes.json());
    setRequests(await requestsRes.json());
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  // --- Templates ---

  const openTemplateModal = () => {
    setTemplateForm({ title: "", category: "" });
    setTemplateFile(null);
    setTemplateError("");
    setTemplateModalOpen(true);
  };

  const handleUploadTemplate = async () => {
    if (!templateFile) {
      setTemplateError("Choose a file to upload");
      return;
    }
    setSavingTemplate(true);
    setTemplateError("");
    try {
      const body = new FormData();
      body.set("title", templateForm.title);
      body.set("category", templateForm.category);
      body.set("file", templateFile);
      const res = await fetch("/api/admin/document-templates", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setTemplateError(data.error ?? "Failed to upload document");
        return;
      }
      setTemplateModalOpen(false);
      await load();
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (row: TemplateRow) => {
    if (!confirm(`Delete "${row.title}"? This removes it from every shipment it's attached to.`)) return;
    setDeletingTemplateId(row._id);
    try {
      await fetch(`/api/admin/document-templates/${row._id}`, { method: "DELETE" });
      await load();
    } finally {
      setDeletingTemplateId(null);
    }
  };

  // --- Per-shipment attachment (deselect) ---

  const openEditRequest = (row: RequestRow) => {
    setEditingRequest(row);
    const excluded = new Set(row.excludedTemplates.map(String));
    setIncludedTemplateIds(templates.map((t) => t._id).filter((id) => !excluded.has(id)));
    setRequestError("");
  };

  const toggleIncluded = (id: string) => {
    setIncludedTemplateIds((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]));
  };

  const handleSaveExclusions = async () => {
    if (!editingRequest?.shipment) return;
    setSavingRequest(true);
    setRequestError("");
    try {
      const excludedTemplateIds = templates.map((t) => t._id).filter((id) => !includedTemplateIds.includes(id));
      const res = await fetch(`/api/admin/document-requests/${editingRequest.shipment._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ excludedTemplateIds }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRequestError(data.error ?? "Failed to save");
        return;
      }
      setEditingRequest(null);
      await load();
    } finally {
      setSavingRequest(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-foreground">Documents</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Upload blank forms (KYC, MSME Agreement, etc). Every form is attached to every shipment by
          default and shared on that shipment&apos;s Agreement signing link — deselect any that don&apos;t apply
          to a given shipment below.
        </p>
      </div>

      {/* --- Templates --- */}
      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold text-foreground">Document Templates</h2>
          <Button icon={Plus} size="sm" onClick={openTemplateModal}>Upload Template</Button>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border-subtle bg-background">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border-subtle bg-surface">
                <tr>
                  <th className="px-5 py-3 font-medium text-foreground/60">Title</th>
                  <th className="px-5 py-3 font-medium text-foreground/60">Category</th>
                  <th className="px-5 py-3 font-medium text-foreground/60">File</th>
                  <th className="px-5 py-3 font-medium text-foreground/60">Size</th>
                  <th className="px-5 py-3 font-medium text-foreground/60">Uploaded</th>
                  <th className="px-5 py-3 text-right font-medium text-foreground/60">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-foreground/50">
                      <Loader2 className="mx-auto size-5 animate-spin" />
                    </td>
                  </tr>
                ) : templates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-foreground/50">
                      No document templates yet — upload a blank form to get started.
                    </td>
                  </tr>
                ) : (
                  templates.map((row) => (
                    <tr key={row._id}>
                      <td className="px-5 py-3 font-medium text-foreground">{row.title}</td>
                      <td className="px-5 py-3 text-foreground/70">{row.category}</td>
                      <td className="px-5 py-3 text-foreground/60">{row.fileName}</td>
                      <td className="px-5 py-3 text-foreground/60">{formatBytes(row.fileSize)}</td>
                      <td className="px-5 py-3 text-foreground/60">{formatDate(row.createdAt)}</td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-2">
                          <a
                            href={`/api/admin/document-templates/${row._id}/file`}
                            aria-label="Download"
                            title="Download"
                            className="flex size-8 items-center justify-center rounded-lg text-foreground/50 hover:bg-navy/10 hover:text-navy"
                          >
                            <Download className="size-4" />
                          </a>
                          <button
                            onClick={() => handleDeleteTemplate(row)}
                            disabled={deletingTemplateId === row._id}
                            aria-label="Delete"
                            className="flex size-8 items-center justify-center rounded-lg text-foreground/50 hover:bg-red-500/10 hover:text-red-500 disabled:opacity-60"
                          >
                            {deletingTemplateId === row._id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Trash2 className="size-4" />
                            )}
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
      </section>

      {/* --- Per-shipment attachment --- */}
      <section>
        <div className="mb-4">
          <h2 className="font-heading text-lg font-semibold text-foreground">Shipment Documents</h2>
          <p className="mt-1 text-sm text-foreground/60">
            One row per shipment (provisioned automatically when its Agreement is generated). Sent on
            that shipment&apos;s Agreement signing link — see the Agreements page for the link itself.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border-subtle bg-background">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border-subtle bg-surface">
                <tr>
                  <th className="px-5 py-3 font-medium text-foreground/60">Shipment</th>
                  <th className="px-5 py-3 font-medium text-foreground/60">Customer</th>
                  <th className="px-5 py-3 font-medium text-foreground/60">Documents</th>
                  <th className="px-5 py-3 text-right font-medium text-foreground/60">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-foreground/50">
                      <Loader2 className="mx-auto size-5 animate-spin" />
                    </td>
                  </tr>
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-foreground/50">
                      No shipments yet — a row appears here once a shipment&apos;s Agreement is generated.
                    </td>
                  </tr>
                ) : (
                  requests.map((row) => {
                    const excluded = new Set(row.excludedTemplates.map(String));
                    const attached = row.items.filter((i) => i.template && !excluded.has(i.template._id));
                    return (
                      <tr key={row._id}>
                        <td className="px-5 py-3 font-medium text-foreground">{row.shipment?.trackingNumber ?? "—"}</td>
                        <td className="px-5 py-3 text-foreground/80">{row.customer?.name ?? "—"}</td>
                        <td className="px-5 py-3">
                          <div className="flex flex-wrap gap-1.5">
                            {attached.length === 0 ? (
                              <span className="text-xs text-foreground/50">None attached</span>
                            ) : (
                              attached.map((item, i) => (
                                <span
                                  key={i}
                                  title={
                                    item.status === "uploaded" && item.upload
                                      ? `Uploaded ${formatDateTime(item.upload.uploadedAt)}`
                                      : "Pending"
                                  }
                                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                                    item.status === "uploaded"
                                      ? "bg-green-500/10 text-green-600 dark:text-green-400"
                                      : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                                  }`}
                                >
                                  {item.status === "uploaded" ? (
                                    <CheckCircle2 className="size-3" />
                                  ) : (
                                    <Clock className="size-3" />
                                  )}
                                  {item.template?.title ?? "Unknown"}
                                  {item.status === "uploaded" && item.template && row.shipment && (
                                    <a
                                      href={`/api/admin/document-requests/${row.shipment._id}/items/${item.template._id}/file`}
                                      aria-label={`Download uploaded ${item.template.title}`}
                                      className="ml-0.5 hover:opacity-70"
                                    >
                                      <Download className="size-3" />
                                    </a>
                                  )}
                                </span>
                              ))
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex justify-end">
                            <button
                              onClick={() => openEditRequest(row)}
                              aria-label="Choose documents"
                              title="Choose which documents apply"
                              className="flex size-8 items-center justify-center rounded-lg text-foreground/50 hover:bg-navy/10 hover:text-navy"
                            >
                              <Pencil className="size-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* --- Upload Template modal --- */}
      {templateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-background p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold text-foreground">Upload Document Template</h2>
              <button onClick={() => setTemplateModalOpen(false)} aria-label="Close" className="text-foreground/50 hover:text-foreground">
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Title <span className="text-orange">*</span>
                </label>
                <input
                  value={templateForm.title}
                  onChange={(e) => setTemplateForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. KYC Form"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Category <span className="text-orange">*</span>
                </label>
                <input
                  value={templateForm.category}
                  onChange={(e) => setTemplateForm((f) => ({ ...f, category: e.target.value }))}
                  placeholder="e.g. KYC"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  File <span className="text-orange">*</span>
                </label>
                <input
                  type="file"
                  onChange={(e) => setTemplateFile(e.target.files?.[0] ?? null)}
                  className="w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-navy/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-navy"
                />
                <p className="mt-1 text-xs text-foreground/50">
                  Any file type, up to 10MB (DOC, DOCX, PDF, etc). Attached to every shipment by default.
                </p>
              </div>
            </div>

            {templateError && <p className="mt-4 text-sm text-red-500">{templateError}</p>}

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setTemplateModalOpen(false)}>Cancel</Button>
              <Button onClick={handleUploadTemplate} disabled={savingTemplate || !templateForm.title || !templateForm.category}>
                {savingTemplate ? <Loader2 className="size-4 animate-spin" /> : "Upload"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* --- Choose documents for a shipment --- */}
      {editingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-background p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold text-foreground">
                Documents for {editingRequest.shipment?.trackingNumber ?? "shipment"}
              </h2>
              <button onClick={() => setEditingRequest(null)} aria-label="Close" className="text-foreground/50 hover:text-foreground">
                <X className="size-5" />
              </button>
            </div>

            <p className="mb-3 text-sm text-foreground/60">
              All documents are attached by default — uncheck any that don&apos;t apply to this shipment.
            </p>
            <div className="space-y-2 rounded-xl border border-border-subtle p-3">
              {templates.length === 0 ? (
                <p className="text-sm text-foreground/50">No document templates yet.</p>
              ) : (
                templates.map((t) => (
                  <label key={t._id} className="flex items-center gap-2 text-sm text-foreground/80">
                    <input
                      type="checkbox"
                      checked={includedTemplateIds.includes(t._id)}
                      onChange={() => toggleIncluded(t._id)}
                    />
                    {t.title} <span className="text-xs text-foreground/50">({t.category})</span>
                  </label>
                ))
              )}
            </div>

            {requestError && <p className="mt-4 text-sm text-red-500">{requestError}</p>}

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setEditingRequest(null)}>Cancel</Button>
              <Button onClick={handleSaveExclusions} disabled={savingRequest}>
                {savingRequest ? <Loader2 className="size-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
