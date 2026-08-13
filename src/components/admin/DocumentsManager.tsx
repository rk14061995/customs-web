"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, X, Loader2, Download, Pencil, CheckCircle2, Clock, ListChecks, Eye, RotateCcw } from "lucide-react";
import Button from "@/components/ui/Button";
import { formatDate, formatDateTime } from "@/lib/utils";

const inputClass =
  "w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none focus:border-navy";

const FIELD_TYPES = [
  { value: "text", label: "Short text" },
  { value: "textarea", label: "Long text" },
  { value: "date", label: "Date" },
  { value: "select", label: "Dropdown" },
] as const;

type TemplateField = {
  key: string;
  label: string;
  type: (typeof FIELD_TYPES)[number]["value"];
  required: boolean;
  options?: string[];
};

/** A field row mid-edit in the builder UI — `optionsText` is the raw comma-separated input, split into `options` on save. */
type FieldDraft = { label: string; type: TemplateField["type"]; required: boolean; optionsText: string };

function fieldToDraft(field: TemplateField): FieldDraft {
  return { label: field.label, type: field.type, required: field.required, optionsText: (field.options ?? []).join(", ") };
}

/** Derives a unique snake_case key per field from its label, so admins never have to think about keys. */
function draftsToFields(drafts: FieldDraft[]): TemplateField[] {
  const usedKeys = new Set<string>();
  return drafts
    .filter((d) => d.label.trim())
    .map((d, i) => {
      const base = d.label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || `field_${i + 1}`;
      let key = base;
      let n = 2;
      while (usedKeys.has(key)) key = `${base}_${n++}`;
      usedKeys.add(key);
      const field: TemplateField = { key, label: d.label.trim(), type: d.type, required: d.required };
      if (d.type === "select") {
        field.options = d.optionsText.split(",").map((o) => o.trim()).filter(Boolean);
      }
      return field;
    });
}

/** Add/remove/edit rows for a document's fillable-online fields — shared by the upload modal and the edit-fields modal. */
function FieldBuilder({ drafts, onChange }: { drafts: FieldDraft[]; onChange: (drafts: FieldDraft[]) => void }) {
  const update = (i: number, patch: Partial<FieldDraft>) =>
    onChange(drafts.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
  const remove = (i: number) => onChange(drafts.filter((_, idx) => idx !== i));
  const add = () => onChange([...drafts, { label: "", type: "text", required: false, optionsText: "" }]);

  return (
    <div className="space-y-2">
      {drafts.map((d, i) => (
        <div key={i} className="space-y-1.5 rounded-xl border border-border-subtle p-2">
          <div className="flex items-center gap-2">
            <input
              value={d.label}
              onChange={(e) => update(i, { label: e.target.value })}
              placeholder="Field label, e.g. GST No."
              className="flex-1 rounded-lg border border-border-subtle bg-background px-3 py-1.5 text-sm outline-none focus:border-navy"
            />
            <select
              value={d.type}
              onChange={(e) => update(i, { type: e.target.value as FieldDraft["type"] })}
              className="rounded-lg border border-border-subtle bg-background px-2 py-1.5 text-sm outline-none focus:border-navy"
            >
              {FIELD_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label="Remove field"
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-foreground/50 hover:bg-red-500/10 hover:text-red-500"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs text-foreground/70">
              <input type="checkbox" checked={d.required} onChange={(e) => update(i, { required: e.target.checked })} />
              Required
            </label>
            {d.type === "select" && (
              <input
                value={d.optionsText}
                onChange={(e) => update(i, { optionsText: e.target.value })}
                placeholder="Options, comma separated"
                className="flex-1 rounded-lg border border-border-subtle bg-background px-3 py-1.5 text-xs outline-none focus:border-navy"
              />
            )}
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-navy hover:underline dark:text-white"
      >
        <Plus className="size-4" /> Add field
      </button>
    </div>
  );
}

type TemplateRow = {
  _id: string;
  title: string;
  category: string;
  fileName: string;
  fileSize: number;
  fields: TemplateField[];
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

type ViewData = {
  fileName: string;
  mimeType: string;
  fileSize: number;
  answers: Record<string, string> | null;
  uploadedAt: string;
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
  const [templateFieldDrafts, setTemplateFieldDrafts] = useState<FieldDraft[]>([]);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateError, setTemplateError] = useState("");
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);

  const [fieldsModalTemplate, setFieldsModalTemplate] = useState<TemplateRow | null>(null);
  const [fieldsDraft, setFieldsDraft] = useState<FieldDraft[]>([]);
  const [savingFields, setSavingFields] = useState(false);
  const [fieldsError, setFieldsError] = useState("");

  const [editingRequest, setEditingRequest] = useState<RequestRow | null>(null);
  const [includedTemplateIds, setIncludedTemplateIds] = useState<string[]>([]);
  const [savingRequest, setSavingRequest] = useState(false);
  const [requestError, setRequestError] = useState("");

  const [viewing, setViewing] = useState<{ shipmentId: string; templateId: string; title: string } | null>(null);
  const [viewData, setViewData] = useState<ViewData | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState("");
  const [resettingId, setResettingId] = useState<string | null>(null);

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
    setTemplateFieldDrafts([]);
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
      body.set("fields", JSON.stringify(draftsToFields(templateFieldDrafts)));
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

  // --- Fillable-online fields ---

  const openEditFields = (row: TemplateRow) => {
    setFieldsModalTemplate(row);
    setFieldsDraft(row.fields.map(fieldToDraft));
    setFieldsError("");
  };

  const handleSaveFields = async () => {
    if (!fieldsModalTemplate) return;
    setSavingFields(true);
    setFieldsError("");
    try {
      const res = await fetch(`/api/admin/document-templates/${fieldsModalTemplate._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: draftsToFields(fieldsDraft) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFieldsError(data.error ?? "Failed to save fields");
        return;
      }
      setFieldsModalTemplate(null);
      await load();
    } finally {
      setSavingFields(false);
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

  // --- Viewing a submitted/uploaded document ---

  const openView = async (shipmentId: string, templateId: string, title: string) => {
    setViewing({ shipmentId, templateId, title });
    setViewData(null);
    setViewError("");
    setViewLoading(true);
    try {
      const res = await fetch(`/api/admin/document-requests/${shipmentId}/items/${templateId}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setViewError(data.error ?? "Failed to load");
        return;
      }
      setViewData(data);
    } finally {
      setViewLoading(false);
    }
  };

  // --- Clearing test/mistaken submissions ---

  const handleResetItem = async (shipmentId: string, templateId: string, title: string) => {
    if (!confirm(`Clear the submitted "${title}"? It goes back to Pending and the file/answers are deleted.`)) return;
    setResettingId(`${shipmentId}:${templateId}`);
    try {
      await fetch(`/api/admin/document-requests/${shipmentId}/items/${templateId}`, { method: "DELETE" });
      if (viewing?.shipmentId === shipmentId && viewing.templateId === templateId) setViewing(null);
      await load();
    } finally {
      setResettingId(null);
    }
  };

  const handleResetAll = async (shipmentId: string, trackingNumber: string) => {
    if (!confirm(`Clear ALL submitted documents for ${trackingNumber}? Every one goes back to Pending — useful after test-filling them.`)) return;
    setResettingId(shipmentId);
    try {
      await fetch(`/api/admin/document-requests/${shipmentId}`, { method: "DELETE" });
      await load();
    } finally {
      setResettingId(null);
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
                          <button
                            onClick={() => openEditFields(row)}
                            aria-label="Fillable-online fields"
                            title={row.fields.length ? `Fillable online — ${row.fields.length} field(s)` : "Make fillable online"}
                            className={`flex size-8 items-center justify-center rounded-lg hover:bg-navy/10 hover:text-navy ${row.fields.length ? "text-navy" : "text-foreground/50"}`}
                          >
                            <ListChecks className="size-4" />
                          </button>
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
                              attached.map((item, i) => {
                                const uploaded = item.status === "uploaded" && item.template && row.shipment;
                                return (
                                  <span
                                    key={i}
                                    title={
                                      item.status === "uploaded" && item.upload
                                        ? `Uploaded ${formatDateTime(item.upload.uploadedAt)} — click to view`
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
                                    {uploaded && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => openView(row.shipment!._id, item.template!._id, item.template!.title)}
                                          aria-label={`View ${item.template!.title}`}
                                          className="ml-0.5 hover:opacity-70"
                                        >
                                          <Eye className="size-3" />
                                        </button>
                                        <a
                                          href={`/api/admin/document-requests/${row.shipment!._id}/items/${item.template!._id}/file`}
                                          aria-label={`Download uploaded ${item.template!.title}`}
                                          className="hover:opacity-70"
                                        >
                                          <Download className="size-3" />
                                        </a>
                                        <button
                                          type="button"
                                          onClick={() => handleResetItem(row.shipment!._id, item.template!._id, item.template!.title)}
                                          disabled={resettingId === `${row.shipment!._id}:${item.template!._id}`}
                                          aria-label={`Clear ${item.template!.title}`}
                                          title="Clear this submission (back to Pending)"
                                          className="hover:opacity-70 disabled:opacity-40"
                                        >
                                          {resettingId === `${row.shipment!._id}:${item.template!._id}` ? (
                                            <Loader2 className="size-3 animate-spin" />
                                          ) : (
                                            <RotateCcw className="size-3" />
                                          )}
                                        </button>
                                      </>
                                    )}
                                  </span>
                                );
                              })
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex justify-end gap-2">
                            {row.shipment && (() => {
                              const hasUploaded = attached.some((i) => i.status === "uploaded");
                              return (
                                <button
                                  onClick={() => hasUploaded && handleResetAll(row.shipment!._id, row.shipment!.trackingNumber)}
                                  disabled={!hasUploaded || resettingId === row.shipment._id}
                                  aria-label="Clear all submissions"
                                  title={hasUploaded ? "Clear all submissions for this shipment (back to Pending) — handy after test-filling them" : "Nothing submitted yet for this shipment"}
                                  className="flex size-8 items-center justify-center rounded-lg text-foreground/50 hover:bg-red-500/10 hover:text-red-500 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-foreground/50"
                                >
                                  {resettingId === row.shipment._id ? (
                                    <Loader2 className="size-4 animate-spin" />
                                  ) : (
                                    <RotateCcw className="size-4" />
                                  )}
                                </button>
                              );
                            })()}
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
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Fill online (optional)
                </label>
                <p className="mb-2 text-xs text-foreground/50">
                  Add fields to let customers fill this form in the browser instead of printing and
                  scanning it. Downloading/uploading a copy always stays available too.
                </p>
                <FieldBuilder drafts={templateFieldDrafts} onChange={setTemplateFieldDrafts} />
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

      {/* --- Fillable-online fields for a template --- */}
      {fieldsModalTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-background p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold text-foreground">
                Online form fields — {fieldsModalTemplate.title}
              </h2>
              <button onClick={() => setFieldsModalTemplate(null)} aria-label="Close" className="text-foreground/50 hover:text-foreground">
                <X className="size-5" />
              </button>
            </div>

            <p className="mb-3 text-sm text-foreground/60">
              Leave empty to keep this document as download/upload only. Customers always see the
              upload option too, regardless.
            </p>
            <FieldBuilder drafts={fieldsDraft} onChange={setFieldsDraft} />

            {fieldsError && <p className="mt-4 text-sm text-red-500">{fieldsError}</p>}

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setFieldsModalTemplate(null)}>Cancel</Button>
              <Button onClick={handleSaveFields} disabled={savingFields}>
                {savingFields ? <Loader2 className="size-4 animate-spin" /> : "Save"}
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

            {editingRequest.items.some((i) => i.status === "uploaded") && (
              <button
                type="button"
                onClick={async () => {
                  if (!editingRequest.shipment) return;
                  await handleResetAll(editingRequest.shipment._id, editingRequest.shipment.trackingNumber);
                  setEditingRequest(null);
                }}
                disabled={resettingId === editingRequest.shipment?._id}
                className="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10 disabled:opacity-50"
              >
                {resettingId === editingRequest.shipment?._id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RotateCcw className="size-4" />
                )}
                Reset all submissions for this shipment
              </button>
            )}

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

      {/* --- View a submitted/uploaded document --- */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-background p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold text-foreground">{viewing.title}</h2>
              <button onClick={() => setViewing(null)} aria-label="Close" className="text-foreground/50 hover:text-foreground">
                <X className="size-5" />
              </button>
            </div>

            {viewLoading ? (
              <Loader2 className="mx-auto size-6 animate-spin text-foreground/40" />
            ) : viewError ? (
              <p className="text-sm text-red-500">{viewError}</p>
            ) : viewData ? (
              <div>
                <p className="mb-4 text-xs text-foreground/50">
                  {viewData.fileName} · {formatBytes(viewData.fileSize)} · uploaded {formatDateTime(viewData.uploadedAt)}
                </p>

                {viewData.answers ? (
                  <div className="overflow-hidden rounded-xl border border-border-subtle">
                    <table className="w-full text-left text-sm">
                      <tbody className="divide-y divide-border-subtle">
                        {Object.entries(viewData.answers).map(([key, value]) => {
                          const label = templates.find((t) => t._id === viewing.templateId)?.fields.find((f) => f.key === key)?.label ?? key;
                          return (
                            <tr key={key}>
                              <td className="w-1/3 px-4 py-2.5 align-top text-foreground/60">{label}</td>
                              <td className="px-4 py-2.5 font-medium text-foreground">{value || "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-foreground/60">
                    This was uploaded as a file (not filled online) — no structured data to show, just
                    the file itself.
                  </p>
                )}

                <div className="mt-5 flex items-center gap-4">
                  <a
                    href={`/api/admin/document-requests/${viewing.shipmentId}/items/${viewing.templateId}/file`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-navy hover:underline dark:text-white"
                  >
                    <Download className="size-4" /> Download {viewData.answers ? "PDF" : "file"}
                  </a>
                  <button
                    type="button"
                    onClick={() => handleResetItem(viewing.shipmentId, viewing.templateId, viewing.title)}
                    disabled={resettingId === `${viewing.shipmentId}:${viewing.templateId}`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-red-500 hover:underline disabled:opacity-50"
                  >
                    <RotateCcw className="size-4" /> Clear this submission
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
