"use client";

import { use, useEffect, useRef, useState } from "react";
import { Loader2, CheckCircle2, FileText, AlertCircle, Download, UploadCloud, Clock } from "lucide-react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import SignaturePad, { type SignaturePadHandle } from "@/components/agreements/SignaturePad";
import { formatDateTime } from "@/lib/utils";
import ClauseHtml from "@/components/agreements/ClauseHtml";

type DocumentItem = {
  template: { _id: string; title: string; category: string; fileName: string };
  status: "pending" | "uploaded";
  upload?: { fileName: string; uploadedAt: string } | null;
};

type AgreementData = {
  token: string;
  status: "pending" | "signed" | "expired";
  shipment: { trackingNumber: string; origin: string; destination: string } | null;
  customer: { name: string } | null;
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
    } finally {
      setUploadingId(null);
    }
  };

  if (loading) {
    return (
      <Container className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-foreground/40" />
      </Container>
    );
  }

  if (loadError || !agreement) {
    return (
      <Container className="flex min-h-screen items-center justify-center">
        <div className="max-w-md text-center">
          <AlertCircle className="mx-auto size-10 text-foreground/30" />
          <p className="mt-4 text-foreground/70">{loadError || "This agreement could not be found."}</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="max-w-2xl py-12">
      <div className="rounded-2xl border border-border-subtle bg-background p-6 sm:p-8">
        <h1 className="text-center font-heading text-lg font-bold uppercase text-foreground">
          {agreement.template.title}
        </h1>
        <p className="mt-1 text-center text-sm font-semibold uppercase text-foreground/60">
          {agreement.template.forwarderName}
        </p>

        <div className="mt-6 space-y-1 text-sm text-foreground/70">
          <p>
            <span className="font-medium text-foreground">{agreement.template.forwarderName}</span> —{" "}
            {agreement.template.forwarderAddress}
          </p>
          <p>
            Customer: <span className="font-medium text-foreground">{agreement.customer?.name}</span>
          </p>
          {agreement.shipment && (
            <p>
              Shipment: <span className="font-medium text-foreground">{agreement.shipment.trackingNumber}</span> ·{" "}
              {agreement.shipment.origin} → {agreement.shipment.destination}
            </p>
          )}
        </div>

        <p className="mt-6 text-sm font-semibold text-foreground">Subject: {agreement.template.subject}</p>
        <p className="mt-3 text-sm text-foreground/70">
          I the undersigned customer, hereby declare and agree as follows:
        </p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-foreground/70">
          {agreement.template.clauses.map((clause, i) => (
            <li key={i}><ClauseHtml text={clause} /></li>
          ))}
        </ol>

        {agreement.status === "signed" ? (
          <div className="mt-8 rounded-xl border border-green-500/30 bg-green-500/5 p-5 text-center">
            <CheckCircle2 className="mx-auto size-8 text-green-600 dark:text-green-400" />
            <p className="mt-2 font-medium text-foreground">
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
          <div className="mt-8 rounded-xl border border-border-subtle bg-surface p-5 text-center text-sm text-foreground/60">
            This signing link has expired. Please contact us for a new one.
          </div>
        ) : (
          <div className="mt-8 space-y-4 border-t border-border-subtle pt-6">
            <p className="text-sm text-foreground/70">
              I have read, understood, and voluntarily accepted the above terms and conditions.
            </p>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Full Name</label>
              <input
                value={signedName}
                onChange={(e) => setSignedName(e.target.value)}
                className="w-full rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-sm outline-none focus:border-navy"
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

        {agreement.documents.length > 0 && (
          <div className="mt-8 border-t border-border-subtle pt-6">
            <h2 className="font-heading text-base font-semibold text-foreground">Documents Required</h2>
            <p className="mt-1 text-sm text-foreground/70">
              Download each form below, print and fill it by hand, then upload the completed copy (a
              photo or scan works fine).
            </p>

            <div className="mt-4 space-y-4">
              {agreement.documents.map((item) => {
                const templateId = item.template._id;
                return (
                  <div key={templateId} className="rounded-xl border border-border-subtle p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-foreground">{item.template.title}</p>
                        <p className="text-xs text-foreground/50">{item.template.category}</p>
                      </div>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                          item.status === "uploaded"
                            ? "bg-green-500/10 text-green-600 dark:text-green-400"
                            : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                        }`}
                      >
                        {item.status === "uploaded" ? <CheckCircle2 className="size-3" /> : <Clock className="size-3" />}
                        {item.status === "uploaded" ? "Uploaded" : "Pending"}
                      </span>
                    </div>

                    <a
                      href={`/api/agreements/${token}/documents/${templateId}/download`}
                      className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-navy hover:underline dark:text-white"
                    >
                      <Download className="size-4" /> Download blank form
                    </a>

                    {item.status === "uploaded" && item.upload && (
                      <p className="mt-2 text-xs text-foreground/50">
                        Uploaded {item.upload.fileName} on {formatDateTime(item.upload.uploadedAt)} — you can replace it below.
                      </p>
                    )}

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
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Container>
  );
}
