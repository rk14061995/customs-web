"use client";

import { use, useEffect, useRef, useState } from "react";
import {
  Loader2,
  CheckCircle2,
  FileText,
  AlertCircle,
  Download,
  UploadCloud,
  Clock,
  Send,
  FileSignature,
  ChevronDown,
  ChevronRight,
  Ship,
  PartyPopper,
} from "lucide-react";
import Button from "@/components/ui/Button";
import SignaturePad, { type SignaturePadHandle } from "@/components/agreements/SignaturePad";
import { cn, formatDateTime } from "@/lib/utils";
import ClauseHtml from "@/components/agreements/ClauseHtml";

type TemplateField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "date" | "select";
  required: boolean;
  options?: string[];
};

type DocumentItem = {
  template: { _id: string; title: string; category: string; fileName: string; fields: TemplateField[] };
  status: "pending" | "uploaded";
  upload?: { fileName: string; uploadedAt: string } | null;
};

type AgreementData = {
  token: string;
  status: "pending" | "signed" | "expired";
  shipment: { trackingNumber: string; carrierTrackingNumber?: string; origin: string; destination: string } | null;
  customer: {
    name: string;
    company?: string;
    email?: string;
    phone?: string;
    address?: string;
    gstNumber?: string;
  } | null;
  template: {
    title: string;
    forwarderName: string;
    forwarderAddress: string;
    subject: string;
    clauses: string[];
  };
  signature?: { signedName: string; signedAt: string };
  documents: DocumentItem[];
};

/** Shared field/input styling — a single source of truth so every input on the page matches. */
const fieldInputClass =
  "w-full rounded-xl border border-border-subtle bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-foreground/35 focus:border-navy focus:ring-4 focus:ring-navy/10";

const AGREEMENT_SECTION = "agreement";
const SUMMARY_SECTION = "summary";

/**
 * Best-effort pre-fill for field keys we recognize (Customer Name, GST No., Phone, etc.) —
 * sourced from the customer already on file so they don't have to retype what we already know.
 * Only ever used to seed the form once when the agreement first loads, never to overwrite what
 * they've typed. Silently returns nothing for any key it doesn't recognize — e.g. a field on a
 * custom template an admin adds later — the input just starts blank as before.
 */
function autofillValue(key: string, customer: AgreementData["customer"]): string | undefined {
  if (!customer) return undefined;
  // GSTIN layout: 2-digit state code + 10-char PAN + entity code + "Z" + checksum = 15 chars.
  const pan = customer.gstNumber && customer.gstNumber.length === 15 ? customer.gstNumber.slice(2, 12) : undefined;
  const today = new Date().toISOString().slice(0, 10);

  const map: Record<string, string | undefined> = {
    customer_name: customer.company || customer.name,
    organization_name: customer.company || customer.name,
    director_proprietor_name: customer.company ? customer.name : undefined,
    md_name: customer.name,
    authorized_signatory_name: customer.name,
    business_contact_person: customer.name,
    business_contact_name: customer.name,
    accounting_contact_name: customer.name,
    registered_address: customer.address,
    registered_office_address: customer.address,
    invoice_address: customer.address,
    billing_office_address: customer.address,
    phone: customer.phone,
    office_telephone: customer.phone,
    business_contact_cell: customer.phone,
    accounting_contact_phone: customer.phone,
    business_contact_email: customer.email,
    office_email: customer.email,
    accounting_contact_email: customer.email,
    gst_no: customer.gstNumber,
    pan_number: pan,
    pan_no: pan,
    date: today,
    classification_date: today,
  };
  return map[key] || undefined;
}

/** Seeds every document's form with whatever recognized fields it has — see autofillValue. */
function buildAutofilledAnswers(documents: DocumentItem[], customer: AgreementData["customer"]) {
  const answers: Record<string, Record<string, string>> = {};
  for (const doc of documents) {
    const values: Record<string, string> = {};
    for (const field of doc.template.fields) {
      const value = autofillValue(field.key, customer);
      if (value) values[field.key] = value;
    }
    if (Object.keys(values).length) answers[doc.template._id] = values;
  }
  return answers;
}

/** One row in the left nav — the agreement step or a document step, with a status dot. */
function NavItem({
  active,
  icon: Icon,
  label,
  done,
  warn,
  onClick,
}: {
  active: boolean;
  icon: typeof FileSignature;
  label: string;
  done: boolean;
  warn?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-medium transition-colors",
        active ? "bg-white text-navy shadow-lg" : "text-white/70 hover:bg-white/10 hover:text-white"
      )}
    >
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg",
          active ? "bg-navy/10 text-navy" : "bg-white/10 text-white"
        )}
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {done ? (
        <CheckCircle2 className={cn("size-4 shrink-0", active ? "text-green-600" : "text-green-400")} />
      ) : warn ? (
        <AlertCircle className={cn("size-4 shrink-0", active ? "text-orange" : "text-orange")} />
      ) : (
        <Clock className={cn("size-4 shrink-0 opacity-50", active ? "text-navy" : "text-white")} />
      )}
    </button>
  );
}

export default function AgreementSignPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [agreement, setAgreement] = useState<AgreementData | null>(null);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);

  const [signedName, setSignedName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const padRef = useRef<SignaturePadHandle>(null);
  const [timeZone, setTimeZone] = useState("");

  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});

  const [formAnswers, setFormAnswers] = useState<Record<string, Record<string, string>>>({});
  const [submittingFormId, setSubmittingFormId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [activeSection, setActiveSection] = useState<string>(AGREEMENT_SECTION);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  useEffect(() => {
    fetch(`/api/agreements/${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setLoadError(data.error ?? "This agreement could not be found.");
          return;
        }
        setAgreement(data);
        if (data.customer?.name) setSignedName(data.customer.name);
        setFormAnswers(buildAutofilledAnswers(data.documents ?? [], data.customer ?? null));
        const docParam = new URLSearchParams(window.location.search).get("doc");
        if (docParam === SUMMARY_SECTION || (docParam && (data.documents as DocumentItem[]).some((d) => d.template._id === docParam))) {
          setActiveSection(docParam);
        }
      })
      .catch(() => setLoadError("This agreement could not be found."))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async () => {
    setSubmitError("");
    const signatureDataUrl = padRef.current?.getDataUrl();
    if (!signedName.trim()) {
      setSubmitError("Please enter your full name.");
      return;
    }
    if (!signatureDataUrl) {
      setSubmitError("Please draw your signature.");
      return;
    }
    if (!agreed) {
      setSubmitError("Please confirm you have read and agree to the terms.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/agreements/${token}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signedName: signedName.trim(), signatureDataUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(data.error ?? "Failed to submit signature.");
        return;
      }
      setAgreement((a) => (a ? { ...a, status: "signed", signature: { signedName: signedName.trim(), signedAt: new Date().toISOString() } } : a));
      if (agreement?.documents.every((d) => d.status === "uploaded")) {
        setActiveSection(SUMMARY_SECTION);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadDocument = async (templateId: string) => {
    const file = selectedFiles[templateId];
    if (!file) {
      setUploadErrors((e) => ({ ...e, [templateId]: "Choose a file first" }));
      return;
    }
    setUploadingId(templateId);
    setUploadErrors((e) => ({ ...e, [templateId]: "" }));
    try {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch(`/api/agreements/${token}/documents/${templateId}/upload`, { method: "POST", body });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUploadErrors((e) => ({ ...e, [templateId]: json.error ?? "Upload failed" }));
        return;
      }
      setAgreement((a) =>
        a
          ? {
              ...a,
              documents: a.documents.map((item) =>
                item.template._id === templateId
                  ? { ...item, status: "uploaded", upload: { fileName: json.fileName, uploadedAt: json.uploadedAt } }
                  : item
              ),
            }
          : a
      );
      setSelectedFiles((f) => ({ ...f, [templateId]: null }));
      if (agreement?.status === "signed" && agreement.documents.every((d) => d.template._id === templateId || d.status === "uploaded")) {
        setActiveSection(SUMMARY_SECTION);
      }
    } finally {
      setUploadingId(null);
    }
  };

  const setFieldAnswer = (templateId: string, key: string, value: string) => {
    setFormAnswers((a) => ({ ...a, [templateId]: { ...a[templateId], [key]: value } }));
  };

  const handleSubmitForm = async (templateId: string, fields: TemplateField[]) => {
    const answers = formAnswers[templateId] ?? {};
    const missing = fields.find((f) => f.required && !(answers[f.key] ?? "").trim());
    if (missing) {
      setFormErrors((e) => ({ ...e, [templateId]: `"${missing.label}" is required.` }));
      return;
    }
    setSubmittingFormId(templateId);
    setFormErrors((e) => ({ ...e, [templateId]: "" }));
    try {
      const res = await fetch(`/api/agreements/${token}/documents/${templateId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormErrors((e) => ({ ...e, [templateId]: json.error ?? "Failed to submit" }));
        return;
      }
      setAgreement((a) =>
        a
          ? {
              ...a,
              documents: a.documents.map((item) =>
                item.template._id === templateId
                  ? { ...item, status: "uploaded", upload: { fileName: json.fileName, uploadedAt: json.uploadedAt } }
                  : item
              ),
            }
          : a
      );
      if (agreement?.status === "signed" && agreement.documents.every((d) => d.template._id === templateId || d.status === "uploaded")) {
        setActiveSection(SUMMARY_SECTION);
      }
    } finally {
      setSubmittingFormId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <Loader2 className="size-6 animate-spin text-foreground/40" />
      </div>
    );
  }

  if (loadError || !agreement) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="max-w-md text-center">
          <AlertCircle className="mx-auto size-10 text-foreground/30" />
          <p className="mt-4 text-foreground/70">{loadError || "This agreement could not be found."}</p>
        </div>
      </div>
    );
  }

  const completedCount = agreement.documents.filter((d) => d.status === "uploaded").length;
  const totalCount = agreement.documents.length;
  const totalSteps = 1 + totalCount;
  const doneSteps = (agreement.status === "signed" ? 1 : 0) + completedCount;
  const activeDoc = agreement.documents.find((d) => d.template._id === activeSection) ?? null;
  const activeLabel = activeSection === AGREEMENT_SECTION ? "Agreement" : activeDoc?.template.title ?? "Agreement";

  const goTo = (section: string) => {
    setActiveSection(section);
    setNavOpen(false);
  };

  return (
    <div className="min-h-screen bg-surface lg:flex">
      {/* --- Left rail: brand, shipment context, step navigation --- */}
      <aside className="bg-navy text-white lg:sticky lg:top-0 lg:h-screen lg:w-80 lg:shrink-0 lg:overflow-y-auto xl:w-96">
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
              <FileSignature className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-heading text-base font-bold">{agreement.template.forwarderName || "Rana Forwarder"}</p>
              <p className="text-xs text-white/50">Customer Portal</p>
            </div>
          </div>

          {agreement.shipment && (
            <div className="mt-6 space-y-2 rounded-2xl bg-white/5 p-4 text-sm">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/40">
                <Ship className="size-3.5" /> Shipment
              </p>
              <p className="font-medium">
                {agreement.shipment.carrierTrackingNumber || agreement.shipment.trackingNumber}
              </p>
              <p className="text-white/60">
                {agreement.shipment.origin} <ChevronRight className="inline size-3" /> {agreement.shipment.destination}
              </p>
              {agreement.customer && <p className="text-white/60">{agreement.customer.name}</p>}
            </div>
          )}

          {/* Mobile: current step + toggle instead of the full list */}
          <button
            type="button"
            onClick={() => setNavOpen((v) => !v)}
            className="mt-6 flex w-full items-center justify-between rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold lg:hidden"
          >
            {activeLabel}
            <ChevronDown className={cn("size-4 transition-transform", navOpen && "rotate-180")} />
          </button>

          <nav className={cn("mt-2 space-y-1.5 lg:mt-6 lg:block", navOpen ? "block" : "hidden")}>
            <NavItem
              active={activeSection === AGREEMENT_SECTION}
              icon={FileSignature}
              label="Agreement"
              done={agreement.status === "signed"}
              warn={agreement.status === "expired"}
              onClick={() => goTo(AGREEMENT_SECTION)}
            />
            {agreement.documents.map((doc) => (
              <NavItem
                key={doc.template._id}
                active={activeSection === doc.template._id}
                icon={FileText}
                label={doc.template.title}
                done={doc.status === "uploaded"}
                onClick={() => goTo(doc.template._id)}
              />
            ))}
            <NavItem
              active={activeSection === SUMMARY_SECTION}
              icon={PartyPopper}
              label="Summary"
              done={doneSteps === totalSteps}
              onClick={() => goTo(SUMMARY_SECTION)}
            />
          </nav>

          {totalSteps > 1 && (
            <div className="mt-8">
              <div className="flex items-center justify-between text-xs font-medium text-white/50">
                <span>Overall progress</span>
                <span>{doneSteps}/{totalSteps}</span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-orange transition-all duration-500"
                  style={{ width: `${(doneSteps / totalSteps) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* --- Right pane: the active step's content --- */}
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-8 sm:py-14 lg:px-12">
          {activeSection === AGREEMENT_SECTION ? (
            <div>
              <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
                {agreement.template.title}
              </h1>

              <p className="mt-4 text-sm font-semibold text-foreground">Subject: {agreement.template.subject}</p>
              <p className="mt-3 text-sm text-foreground/70">
                I the undersigned customer, hereby declare and agree as follows:
              </p>
              <ol className="mt-3 list-decimal space-y-2.5 pl-5 text-sm text-foreground/70">
                {agreement.template.clauses.map((clause, i) => (
                  <li key={i}><ClauseHtml text={clause} /></li>
                ))}
              </ol>

              {agreement.status === "signed" ? (
                <div className="mt-8 rounded-2xl border border-green-500/30 bg-green-500/5 p-6 text-center">
                  <CheckCircle2 className="mx-auto size-9 text-green-600 dark:text-green-400" />
                  <p className="mt-3 font-medium text-foreground">
                    Signed by {agreement.signature?.signedName ?? signedName}
                    {agreement.signature?.signedAt ? ` on ${formatDateTime(agreement.signature.signedAt)}` : ""}
                  </p>
                  <a
                    href={`/api/agreements/${token}/pdf${timeZone ? `?tz=${encodeURIComponent(timeZone)}` : ""}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-navy hover:underline dark:text-white"
                  >
                    <FileText className="size-4" /> View / Download PDF
                  </a>
                </div>
              ) : agreement.status === "expired" ? (
                <div className="mt-8 rounded-2xl border border-border-subtle bg-surface p-6 text-center text-sm text-foreground/60">
                  This signing link has expired. Please contact us for a new one.
                </div>
              ) : (
                <div className="mt-8 space-y-5 rounded-2xl border border-border-subtle bg-background p-6 shadow-sm">
                  <p className="text-sm text-foreground/70">
                    I have read, understood, and voluntarily accepted the above terms and conditions.
                  </p>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Full Name</label>
                    <input
                      value={signedName}
                      onChange={(e) => setSignedName(e.target.value)}
                      className={fieldInputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Signature</label>
                    <SignaturePad ref={padRef} />
                  </div>

                  <label className="flex items-start gap-2 text-sm text-foreground/70">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="mt-0.5"
                    />
                    I have read and agree to the above terms and conditions.
                  </label>

                  {submitError && <p className="text-sm text-red-500">{submitError}</p>}

                  <Button onClick={handleSubmit} disabled={submitting} className="w-full">
                    {submitting ? <Loader2 className="size-4 animate-spin" /> : "Sign Agreement"}
                  </Button>
                </div>
              )}

              {totalCount > 0 && (
                <button
                  type="button"
                  onClick={() => goTo(agreement.documents[0].template._id)}
                  className="mt-6 flex w-full items-center justify-between rounded-xl border border-border-subtle bg-background px-5 py-4 text-sm font-medium text-foreground transition-colors hover:border-navy/40"
                >
                  Continue to documents ({completedCount}/{totalCount} completed)
                  <ChevronRight className="size-4 text-foreground/40" />
                </button>
              )}
            </div>
          ) : activeSection === SUMMARY_SECTION ? (
            <div>
              {doneSteps === totalSteps ? (
                <div className="text-center">
                  <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-green-500/10">
                    <PartyPopper className="size-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h1 className="mt-4 font-heading text-2xl font-bold text-foreground">All done — thank you!</h1>
                  <p className="mx-auto mt-2 max-w-md text-sm text-foreground/60">
                    You&apos;ve signed the agreement and submitted every document we asked for. Download a
                    copy of anything below for your records any time.
                  </p>
                </div>
              ) : (
                <div>
                  <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Summary</h1>
                  <p className="mt-2 text-sm text-foreground/60">
                    {doneSteps} of {totalSteps} steps complete — finish the rest below.
                  </p>
                </div>
              )}

              <div className="mt-8 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border-subtle bg-background p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-xl",
                        agreement.status === "signed"
                          ? "bg-green-500/10 text-green-600 dark:text-green-400"
                          : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                      )}
                    >
                      {agreement.status === "signed" ? <CheckCircle2 className="size-5" /> : <Clock className="size-5" />}
                    </span>
                    <div>
                      <p className="font-medium text-foreground">{agreement.template.title}</p>
                      <p className="text-xs text-foreground/50">
                        {agreement.status === "signed" && agreement.signature
                          ? `Signed ${formatDateTime(agreement.signature.signedAt)}`
                          : "Not signed yet"}
                      </p>
                    </div>
                  </div>
                  {agreement.status === "signed" ? (
                    <a
                      href={`/api/agreements/${token}/pdf${timeZone ? `?tz=${encodeURIComponent(timeZone)}` : ""}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-navy hover:underline dark:text-white"
                    >
                      <Download className="size-4" /> Download
                    </a>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => goTo(AGREEMENT_SECTION)}>
                      Sign now
                    </Button>
                  )}
                </div>

                {agreement.documents.map((doc) => (
                  <div
                    key={doc.template._id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border-subtle bg-background p-5 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-xl",
                          doc.status === "uploaded"
                            ? "bg-green-500/10 text-green-600 dark:text-green-400"
                            : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                        )}
                      >
                        {doc.status === "uploaded" ? <CheckCircle2 className="size-5" /> : <Clock className="size-5" />}
                      </span>
                      <div>
                        <p className="font-medium text-foreground">{doc.template.title}</p>
                        <p className="text-xs text-foreground/50">
                          {doc.status === "uploaded" && doc.upload
                            ? `Submitted ${formatDateTime(doc.upload.uploadedAt)}`
                            : "Not completed yet"}
                        </p>
                      </div>
                    </div>
                    {doc.status === "uploaded" ? (
                      <a
                        href={`/api/agreements/${token}/documents/${doc.template._id}/submission`}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-navy hover:underline dark:text-white"
                      >
                        <Download className="size-4" /> Download
                      </a>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => goTo(doc.template._id)}>
                        Complete now
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : activeDoc ? (
            (() => {
              const item = activeDoc;
              const templateId = item.template._id;
              const hasFields = item.template.fields.length > 0;
              return (
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-foreground/45">
                        {item.template.category}
                      </p>
                      <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-foreground">
                        {item.template.title}
                      </h1>
                    </div>
                    <span
                      className={`mt-1 inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                        item.status === "uploaded"
                          ? "bg-green-500/10 text-green-600 dark:text-green-400"
                          : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                      }`}
                    >
                      {item.status === "uploaded" ? <CheckCircle2 className="size-3.5" /> : <Clock className="size-3.5" />}
                      {item.status === "uploaded" ? "Completed" : "Pending"}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-foreground/60">
                    Fill this form directly, or download it, print/fill by hand, and upload the completed
                    copy (a photo or scan works fine). We&apos;ve pre-filled what we already have on
                    file — please review and complete the rest.
                  </p>

                  <div className="mt-6 rounded-2xl border border-border-subtle bg-background p-6 shadow-sm">
                    {item.status === "uploaded" && item.upload && (
                      <p className="mb-5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-foreground/50">
                        <CheckCircle2 className="size-3.5 shrink-0 text-green-600 dark:text-green-400" />
                        {hasFields ? "Submitted" : "Uploaded"} <span className="font-medium text-foreground/70">{item.upload.fileName}</span> on{" "}
                        {formatDateTime(item.upload.uploadedAt)} —{" "}
                        <a
                          href={`/api/agreements/${token}/documents/${templateId}/submission`}
                          className="inline-flex items-center gap-1 font-medium text-navy hover:underline dark:text-white"
                        >
                          <Download className="size-3" /> download it
                        </a>{" "}
                        or replace it below.
                      </p>
                    )}

                    {hasFields && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {item.template.fields.map((field) => {
                            const value = formAnswers[templateId]?.[field.key] ?? "";
                            const onChange = (v: string) => setFieldAnswer(templateId, field.key, v);
                            const span = field.type === "textarea" ? "sm:col-span-2 lg:col-span-3" : "";
                            return (
                              <div key={field.key} className={span}>
                                <label className="mb-1.5 block text-xs font-medium text-foreground/70">
                                  {field.label} {field.required && <span className="text-orange">*</span>}
                                </label>
                                {field.type === "textarea" ? (
                                  <textarea
                                    rows={3}
                                    value={value}
                                    onChange={(e) => onChange(e.target.value)}
                                    className={fieldInputClass}
                                  />
                                ) : field.type === "select" ? (
                                  <select
                                    value={value}
                                    onChange={(e) => onChange(e.target.value)}
                                    className={fieldInputClass}
                                  >
                                    <option value="">Select...</option>
                                    {(field.options ?? []).map((o) => (
                                      <option key={o} value={o}>{o}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    type={field.type === "date" ? "date" : "text"}
                                    value={value}
                                    onChange={(e) => onChange(e.target.value)}
                                    className={fieldInputClass}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {formErrors[templateId] && <p className="text-xs text-red-500">{formErrors[templateId]}</p>}

                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            icon={Send}
                            onClick={() => handleSubmitForm(templateId, item.template.fields)}
                            disabled={submittingFormId === templateId}
                          >
                            {submittingFormId === templateId ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : item.status === "uploaded" ? (
                              "Resubmit"
                            ) : (
                              "Submit"
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    <details className={`group ${hasFields ? "mt-5 border-t border-border-subtle pt-4" : ""}`}>
                      {hasFields && (
                        <summary className="flex cursor-pointer list-none items-center gap-1.5 text-xs font-medium text-foreground/50 transition-colors hover:text-foreground [&::-webkit-details-marker]:hidden">
                          <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" />
                          Prefer to print and fill by hand instead?
                        </summary>
                      )}
                      <div className={hasFields ? "mt-3" : ""}>
                        <a
                          href={`/api/agreements/${token}/documents/${templateId}/download`}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-navy hover:underline dark:text-white"
                        >
                          <Download className="size-4" /> Download blank form
                        </a>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <input
                            type="file"
                            onChange={(e) =>
                              setSelectedFiles((f) => ({ ...f, [templateId]: e.target.files?.[0] ?? null }))
                            }
                            className="flex-1 rounded-xl border border-border-subtle bg-background px-3 py-2 text-sm outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-navy/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-navy"
                          />
                          <Button
                            size="sm"
                            variant={hasFields ? "ghost" : "primary"}
                            icon={UploadCloud}
                            onClick={() => handleUploadDocument(templateId)}
                            disabled={uploadingId === templateId}
                          >
                            {uploadingId === templateId ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : item.status === "uploaded" ? (
                              "Replace"
                            ) : (
                              "Upload"
                            )}
                          </Button>
                        </div>
                        {uploadErrors[templateId] && (
                          <p className="mt-1.5 text-xs text-red-500">{uploadErrors[templateId]}</p>
                        )}
                      </div>
                    </details>
                  </div>
                </div>
              );
            })()
          ) : null}
        </div>
      </main>
    </div>
  );
}
