import { NextResponse } from "next/server";

/** Streams a stored file back as a download — shared by every template/upload "file" route. */
export function fileResponse(fileData: Buffer, mimeType: string, fileName: string) {
  // RFC 5987 encoding so non-ASCII filenames (e.g. accented customer names) don't break the header.
  const encoded = encodeURIComponent(fileName);
  return new NextResponse(new Uint8Array(fileData), {
    headers: {
      "Content-Type": mimeType || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${fileName.replace(/[^\x20-\x7e]/g, "_")}"; filename*=UTF-8''${encoded}`,
      "Content-Length": String(fileData.length),
    },
  });
}

/** Shared by every route that accepts a raw file upload (template uploads, customer uploads). */
export const MAX_DOCUMENT_FILE_SIZE = 10 * 1024 * 1024; // 10MB — comfortably under Mongo's 16MB document limit

export class DocumentFileError extends Error {}

/**
 * Duck-typed instead of `instanceof File` — Node 18 (this project's runtime) doesn't expose
 * File as a global by default, only via node:buffer, and which constructor a given value's
 * prototype chain resolves to can vary across bundling/runtime boundaries. Every spec-compliant
 * File/Blob a browser or curl's multipart encoder produces has these members.
 */
function isFileLike(value: FormDataEntryValue | null): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { arrayBuffer?: unknown }).arrayBuffer === "function" &&
    typeof (value as { size?: unknown }).size === "number"
  );
}

/**
 * Pulls a File out of a multipart FormData field and reads it into a Buffer, enforcing the
 * shared size cap. Throws DocumentFileError with a user-facing message on any problem so
 * callers can turn it straight into a 400 response.
 */
export async function readUploadedFile(formData: FormData, field: string) {
  const file = formData.get(field);
  if (!isFileLike(file)) {
    throw new DocumentFileError(`Missing "${field}" file in the upload.`);
  }
  if (file.size === 0) {
    throw new DocumentFileError("The uploaded file is empty.");
  }
  if (file.size > MAX_DOCUMENT_FILE_SIZE) {
    throw new DocumentFileError(
      `File is too large (${Math.round(file.size / 1024 / 1024)}MB) — the limit is ${MAX_DOCUMENT_FILE_SIZE / 1024 / 1024}MB.`
    );
  }
  const fileData = Buffer.from(await file.arrayBuffer());
  return {
    fileName: file.name || "upload",
    mimeType: file.type || "application/octet-stream",
    fileSize: file.size,
    fileData,
  };
}
