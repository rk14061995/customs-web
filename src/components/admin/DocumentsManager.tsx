"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  X,
  Loader2,
  Download,
  Pencil,
  CheckCircle2,
  Clock,
  ListChecks,
  Eye,
  RotateCcw,
  Search,
} from "lucide-react";
import Button from "@/components/ui/Button";
import AgreementPreviewModal from "@/components/admin/AgreementPreviewModal";
import ClauseEditor from "@/components/admin/ClauseEditor";
import { cn, formatDate, formatDateTime } from "@/lib/utils";

const inputClass =
  "w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none focus:border-navy";

// --- Agreement template + per-shipment agreements ---

type AgreementTemplateData = {
  title: string;
  forwarderName: string;
  forwarderAddress: string;
  subject: string;
  clauses: string[];
  authorizedSignatoryName: string;
  authorizedSignatoryDesignation: string;
};

const emptyAgreementTemplate: AgreementTemplateData = {
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

const agreementStatusColor: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  signed: "bg-green-500/10 text-green-600 dark:text-green-400",
  expired: "bg-foreground/10 text-foreground/60",
};

// --- Document templates (blank forms, optionally fillable online) ---

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

// --- Combined per-shipment row (an Agreement and a DocumentRequest are provisioned together) ---

type CombinedRow = {
  key: string;
  shipmentId: string;
  shipment: { trackingNumber: string; origin: string; destination: string };
  customer: { name: string; company?: string; email: string } | null;
  agreement: AgreementRow | null;
  request: RequestRow | null;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Documents actually attached to a shipment (excluded ones filtered out) — shared by search/filter and row rendering. */
function getAttachedItems(row: CombinedRow): RequestItem[] {
  const excluded = new Set((row.request?.excludedTemplates ?? []).map(String));
  return (row.request?.items ?? []).filter((i) => i.template && !excluded.has(i.template._id));
}

/** Rolls a row's attached documents up into one status, for the filter dropdown and the preview modal. */
function getDocumentsStatus(attached: RequestItem[]): "none" | "complete" | "pending" {
  if (attached.length === 0) return "none";
  return attached.every((i) => i.status === "uploaded") ? "complete" : "pending";
}

export default function DocumentsManager() {
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [agreementTemplate, setAgreementTemplate] = useState<AgreementTemplateData>(emptyAgreementTemplate);
  const [agreements, setAgreements] = useState<AgreementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"shipments" | "templates">("shipments");

  const [shipmentQuery, setShipmentQuery] = useState("");
  const [agreementFilter, setAgreementFilter] = useState<"all" | "pending" | "signed" | "expired" | "none">("all");
  const [documentsFilter, setDocumentsFilter] = useState<"all" | "complete" | "pending" | "none">("all");

  const [savingAgreementTemplate, setSavingAgreementTemplate] = useState(false);
  const [agreementTemplateSaved, setAgreementTemplateSaved] = useState(false);
  const [previewShipmentId, setPreviewShipmentId] = useState<string | null>(null);
  const [deletingAgreementId, setDeletingAgreementId] = useState<string | null>(null);

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
    const [templatesRes, requestsRes, agreementTemplateRes, agreementsRes] = await Promise.all([
      fetch("/api/admin/document-templates"),
      fetch("/api/admin/document-requests"),
      fetch("/api/admin/agreement-template"),
      fetch("/api/admin/agreements"),
    ]);
    setTemplates(await templatesRes.json());
    setRequests(await requestsRes.json());
    setAgreementTemplate(await agreementTemplateRes.json());
    setAgreements(await agreementsRes.json());
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  // One row per shipment — an Agreement and a DocumentRequest are always provisioned together,
  // so this just joins the two lists on shipment id for a single combined table.
  const combinedRows = useMemo<CombinedRow[]>(() => {
    const byShipment = new Map<string, CombinedRow>();
    for (const a of agreements) {
      if (!a.shipment) continue;
      byShipment.set(a.shipment._id, {
        key: a.shipment._id,
        shipmentId: a.shipment._id,
        shipment: a.shipment,
        customer: a.customer,
        agreement: a,
        request: null,
      });
    }
    for (const r of requests) {
      if (!r.shipment) continue;
      const existing = byShipment.get(r.shipment._id);
      if (existing) existing.request = r;
      else
        byShipment.set(r.shipment._id, {
          key: r.shipment._id,
          shipmentId: r.shipment._id,
          shipment: r.shipment,
          customer: r.customer,
          agreement: null,
          request: r,
        });
    }
    return Array.from(byShipment.values()).sort((a, b) => a.shipment.trackingNumber.localeCompare(b.shipment.trackingNumber));
  }, [agreements, requests]);

  // Search (tracking number / route / customer) + status filters over the shipments table.
  const filteredRows = useMemo(() => {
    const q = shipmentQuery.trim().toLowerCase();
    return combinedRows.filter((row) => {
      if (q) {
        const haystack = [
          row.shipment.trackingNumber,
          row.shipment.origin,
          row.shipment.destination,
          row.customer?.name,
          row.customer?.company,
          row.customer?.email,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (agreementFilter !== "all" && (row.agreement?.status ?? "none") !== agreementFilter) return false;
      if (documentsFilter !== "all" && getDocumentsStatus(getAttachedItems(row)) !== documentsFilter) return false;
      return true;
    });
  }, [combinedRows, shipmentQuery, agreementFilter, documentsFilter]);

  // --- Agreement template + per-shipment agreements ---

  const saveAgreementTemplate = async () => {
    setSavingAgreementTemplate(true);
    setAgreementTemplateSaved(false);
    await fetch("/api/admin/agreement-template", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(agreementTemplate),
    });
    setSavingAgreementTemplate(false);
    setAgreementTemplateSaved(true);
    setTimeout(() => setAgreementTemplateSaved(false), 2000);
  };

  const updateClause = (index: number, value: string) => {
    setAgreementTemplate((t) => ({ ...t, clauses: t.clauses.map((c, i) => (i === index ? value : c)) }));
  };

  const addClause = () => setAgreementTemplate((t) => ({ ...t, clauses: [...t.clauses, ""] }));

  const removeClause = (index: number) =>
    setAgreementTemplate((t) => ({ ...t, clauses: t.clauses.filter((_, i) => i !== index) }));

  const handleDeleteAgreement = async (row: AgreementRow) => {
    if (!row.shipment) return;
    const warning =
      row.status === "signed"
        ? `This agreement was already signed by ${row.signature?.signedName ?? "the customer"}. Delete it anyway so a new one can be generated?`
        : `Delete this agreement for ${row.shipment.trackingNumber}?`;
    if (!confirm(warning)) return;
    setDeletingAgreementId(row._id);
    try {
      await fetch(`/api/admin/agreements/${row.shipment._id}`, { method: "DELETE" });
      await load();
    } finally {
      setDeletingAgreementId(null);
    }
  };

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
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">Agreements &amp; Documents</h1>
        <p className="mt-1 text-sm text-foreground/60">
          One customer-facing link per shipment covers both — the goods-handover agreement and any
          paperwork (KYC, MSME Agreement, etc).
        </p>
      </div>

      <div className="mb-8 flex gap-1 border-b border-border-subtle">
        {(
          [
            { key: "shipments" as const, label: "Shipments" },
            { key: "templates" as const, label: "Templates" },
          ]
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "border-navy text-navy dark:text-white"
                : "border-transparent text-foreground/50 hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "templates" && (
        <>
      {/* --- Agreement Template --- */}
      <section className="mb-10 rounded-2xl border border-border-subtle bg-background p-6">
        <h2 className="font-heading text-lg font-semibold text-foreground">Agreement Template</h2>
        <p className="mt-1 text-sm text-foreground/60">
          Generated automatically when a shipment is booked — edits here only apply to agreements generated afterward.
        </p>

        {loading ? (
          <Loader2 className="mt-6 size-5 animate-spin text-foreground/40" />
        ) : (
          <div className="mt-6 max-w-3xl space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Title</label>
              <input
                value={agreementTemplate.title}
                onChange={(e) => setAgreementTemplate((t) => ({ ...t, title: e.target.value }))}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Forwarder Name</label>
                <input
                  value={agreementTemplate.forwarderName}
                  onChange={(e) => setAgreementTemplate((t) => ({ ...t, forwarderName: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Forwarder Address</label>
                <input
                  value={agreementTemplate.forwarderAddress}
                  onChange={(e) => setAgreementTemplate((t) => ({ ...t, forwarderAddress: e.target.value }))}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Subject</label>
              <input
                value={agreementTemplate.subject}
                onChange={(e) => setAgreementTemplate((t) => ({ ...t, subject: e.target.value }))}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Clauses</label>
              <div className="space-y-3">
                {agreementTemplate.clauses.map((clause, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="mt-2 text-sm text-foreground/50">{i + 1}.</span>
                    <ClauseEditor value={clause} onChange={(html) => updateClause(i, html)} />
                    <button
                      onClick={() => removeClause(i)}
                      aria-label="Remove clause"
                      className="mt-8 flex size-8 shrink-0 items-center justify-center rounded-lg text-foreground/50 hover:bg-red-500/10 hover:text-red-500"
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
                  value={agreementTemplate.authorizedSignatoryName}
                  onChange={(e) => setAgreementTemplate((t) => ({ ...t, authorizedSignatoryName: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Designation</label>
                <input
                  value={agreementTemplate.authorizedSignatoryDesignation}
                  onChange={(e) => setAgreementTemplate((t) => ({ ...t, authorizedSignatoryDesignation: e.target.value }))}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button onClick={saveAgreementTemplate} disabled={savingAgreementTemplate}>
                {savingAgreementTemplate ? <Loader2 className="size-4 animate-spin" /> : "Save Template"}
              </Button>
              {agreementTemplateSaved && <span className="text-sm text-green-600 dark:text-green-400">Saved</span>}
            </div>
          </div>
        )}
      </section>

      {/* --- Document Templates --- */}
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
        </>
      )}

      {/* --- Per-shipment: agreement status + documents --- */}
      {activeTab === "shipments" && (
      <section>
        <div className="mb-4">
          <h2 className="font-heading text-lg font-semibold text-foreground">Shipments</h2>
          <p className="mt-1 text-sm text-foreground/60">
            One row per shipment (provisioned automatically when it&apos;s booked). Preview shares the
            signing link — the same link carries whichever documents are attached below.
          </p>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/40" />
            <input
              value={shipmentQuery}
              onChange={(e) => setShipmentQuery(e.target.value)}
              placeholder="Search by tracking number, route, or customer…"
              className="w-full rounded-xl border border-border-subtle bg-background py-2.5 pl-9 pr-4 text-sm outline-none focus:border-navy"
            />
          </div>
          <select
            value={agreementFilter}
            onChange={(e) => setAgreementFilter(e.target.value as typeof agreementFilter)}
            className="rounded-xl border border-border-subtle bg-background px-3 py-2.5 text-sm outline-none focus:border-navy"
          >
            <option value="all">All agreement statuses</option>
            <option value="pending">Agreement: Pending</option>
            <option value="signed">Agreement: Signed</option>
            <option value="expired">Agreement: Expired</option>
            <option value="none">Agreement: None</option>
          </select>
          <select
            value={documentsFilter}
            onChange={(e) => setDocumentsFilter(e.target.value as typeof documentsFilter)}
            className="rounded-xl border border-border-subtle bg-background px-3 py-2.5 text-sm outline-none focus:border-navy"
          >
            <option value="all">All document statuses</option>
            <option value="complete">Documents: All uploaded</option>
            <option value="pending">Documents: Pending</option>
            <option value="none">Documents: None attached</option>
          </select>
          {(shipmentQuery || agreementFilter !== "all" || documentsFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setShipmentQuery("");
                setAgreementFilter("all");
                setDocumentsFilter("all");
              }}
              className="text-sm font-medium text-navy hover:underline dark:text-white"
            >
              Clear
            </button>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-border-subtle bg-background">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border-subtle bg-surface">
                <tr>
                  <th className="px-5 py-3 font-medium text-foreground/60">Shipment</th>
                  <th className="px-5 py-3 font-medium text-foreground/60">Customer</th>
                  <th className="px-5 py-3 font-medium text-foreground/60">Agreement</th>
                  <th className="px-5 py-3 font-medium text-foreground/60">Documents</th>
                  <th className="px-5 py-3 text-right font-medium text-foreground/60">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-foreground/50">
                      <Loader2 className="mx-auto size-5 animate-spin" />
                    </td>
                  </tr>
                ) : combinedRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-foreground/50">
                      No shipments yet — a row appears here once a shipment is booked.
                    </td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-foreground/50">
                      No shipments match your search/filters.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => {
                    const attached = getAttachedItems(row);
                    const hasUploaded = attached.some((i) => i.status === "uploaded");
                    return (
                      <tr key={row.key}>
                        <td className="px-5 py-3 font-medium text-foreground">{row.shipment.trackingNumber}</td>
                        <td className="px-5 py-3 text-foreground/80">{row.customer?.name ?? "—"}</td>
                        <td className="px-5 py-3">
                          {row.agreement ? (
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${agreementStatusColor[row.agreement.status]}`}
                            >
                              {row.agreement.status}
                            </span>
                          ) : (
                            <span className="text-xs text-foreground/40">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex flex-wrap gap-1.5">
                            {attached.length === 0 ? (
                              <span className="text-xs text-foreground/50">None attached</span>
                            ) : (
                              attached.map((item, i) => {
                                const uploaded = item.status === "uploaded" && item.template;
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
                                          onClick={() => openView(row.shipmentId, item.template!._id, item.template!.title)}
                                          aria-label={`View ${item.template!.title}`}
                                          className="ml-0.5 hover:opacity-70"
                                        >
                                          <Eye className="size-3" />
                                        </button>
                                        <a
                                          href={`/api/admin/document-requests/${row.shipmentId}/items/${item.template!._id}/file`}
                                          aria-label={`Download uploaded ${item.template!.title}`}
                                          className="hover:opacity-70"
                                        >
                                          <Download className="size-3" />
                                        </a>
                                        <button
                                          type="button"
                                          onClick={() => handleResetItem(row.shipmentId, item.template!._id, item.template!.title)}
                                          disabled={resettingId === `${row.shipmentId}:${item.template!._id}`}
                                          aria-label={`Clear ${item.template!.title}`}
                                          title="Clear this submission (back to Pending)"
                                          className="hover:opacity-70 disabled:opacity-40"
                                        >
                                          {resettingId === `${row.shipmentId}:${item.template!._id}` ? (
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
                            <button
                              onClick={() => setPreviewShipmentId(row.shipmentId)}
                              aria-label="Preview Agreement"
                              title="Preview Agreement (copy link, download PDF)"
                              className="flex size-8 items-center justify-center rounded-lg text-foreground/50 hover:bg-navy/10 hover:text-navy"
                            >
                              <Eye className="size-4" />
                            </button>
                            <button
                              onClick={() => hasUploaded && handleResetAll(row.shipmentId, row.shipment.trackingNumber)}
                              disabled={!hasUploaded || resettingId === row.shipmentId}
                              aria-label="Clear all submissions"
                              title={hasUploaded ? "Clear all submissions for this shipment (back to Pending)" : "Nothing submitted yet for this shipment"}
                              className="flex size-8 items-center justify-center rounded-lg text-foreground/50 hover:bg-red-500/10 hover:text-red-500 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-foreground/50"
                            >
                              {resettingId === row.shipmentId ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <RotateCcw className="size-4" />
                              )}
                            </button>
                            {row.request && (
                              <button
                                onClick={() => openEditRequest(row.request as RequestRow)}
                                aria-label="Choose documents"
                                title="Choose which documents apply"
                                className="flex size-8 items-center justify-center rounded-lg text-foreground/50 hover:bg-navy/10 hover:text-navy"
                              >
                                <Pencil className="size-4" />
                              </button>
                            )}
                            {row.agreement && (
                              <button
                                onClick={() => handleDeleteAgreement(row.agreement as AgreementRow)}
                                disabled={deletingAgreementId === row.agreement._id}
                                aria-label="Delete Agreement"
                                title="Delete Agreement"
                                className="flex size-8 items-center justify-center rounded-lg text-foreground/50 hover:bg-red-500/10 hover:text-red-500 disabled:opacity-60"
                              >
                                {deletingAgreementId === row.agreement._id ? (
                                  <Loader2 className="size-4 animate-spin" />
                                ) : (
                                  <Trash2 className="size-4" />
                                )}
                              </button>
                            )}
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
      )}

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

      {previewShipmentId && (
        <AgreementPreviewModal
          shipmentId={previewShipmentId}
          documents={(() => {
            const row = combinedRows.find((r) => r.shipmentId === previewShipmentId);
            return row
              ? getAttachedItems(row).map((i) => ({
                  title: i.template?.title ?? "Unknown",
                  status: i.status,
                  uploadedAt: i.upload?.uploadedAt ?? null,
                }))
              : [];
          })()}
          onClose={() => setPreviewShipmentId(null)}
        />
      )}
    </div>
  );
}
