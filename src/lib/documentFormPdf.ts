import PDFDocument from "pdfkit";
import type { IDocumentTemplateField } from "@/models/DocumentTemplate";

const NAVY = "#0b3c91";
const GRAY = "#64748b";
const DARK = "#1f2937";
const BORDER = "#94a3b8";

/** Draws one label/value row inside the bordered box, wrapping the value and returning the next y. */
function drawRow(
  doc: PDFKit.PDFDocument,
  label: string,
  value: string,
  x: number,
  y: number,
  labelW: number,
  fullW: number
): number {
  doc.font("Helvetica").fontSize(9.5).fillColor(DARK).text(label, x + 8, y + 7, { width: labelW - 16 });
  doc.font("Helvetica-Bold").fontSize(10).fillColor(DARK).text(value || "—", x + labelW + 8, y + 7, {
    width: fullW - labelW - 16,
  });
  const rowH = Math.max(doc.y - y, 24);
  return y + rowH + 4;
}

/**
 * Renders a customer's online form submission as a clean letterhead-style PDF — one bordered
 * box of label/value rows, same visual language as creditApprovalPdf.ts's fixed-field version,
 * generalized to loop over whatever fields a DocumentTemplate defines.
 */
export function generateFilledFormPdf({
  title,
  companyName,
  companyAddress,
  companyPhone,
  fields,
  answers,
  submittedByName,
  submittedAt,
}: {
  title: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  fields: IDocumentTemplateField[];
  answers: Record<string, string>;
  submittedByName?: string;
  submittedAt: Date;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const fullWidth = right - left;
    const name = companyName || "Rana Forwarder";

    // ---- Letterhead ----
    doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(22).text(name, left, 40);
    doc.fillColor(GRAY).font("Helvetica").fontSize(9);
    const letterheadLine = [companyAddress, companyPhone].filter(Boolean).join("  ·  ");
    if (letterheadLine) doc.text(letterheadLine, left, doc.y + 2, { width: fullWidth });
    doc.strokeColor(NAVY).lineWidth(2).moveTo(left, doc.y + 8).lineTo(right, doc.y + 8).stroke();
    doc.strokeColor(NAVY).lineWidth(0.75).moveTo(left, doc.y + 3).lineTo(right, doc.y + 3).stroke();

    let y = doc.y + 20;
    doc.fillColor(DARK).font("Helvetica-Bold").fontSize(12).text(title.toUpperCase(), left, y, {
      width: fullWidth,
      underline: true,
    });
    y = doc.y + 16;

    // ---- Details box ----
    const boxTop = y;
    const labelW = fullWidth * 0.4;

    fields.forEach((field) => {
      if (y > doc.page.height - 100) {
        doc.addPage();
        y = doc.page.margins.top;
      }
      y = drawRow(doc, field.label, answers[field.key] ?? "", left, y, labelW, fullWidth);
      doc.strokeColor(BORDER).lineWidth(0.5).moveTo(left, y - 2).lineTo(right, y - 2).stroke();
    });

    doc.strokeColor(BORDER).lineWidth(1).rect(left, boxTop, fullWidth, y - boxTop - 4).stroke();
    doc.strokeColor(BORDER).lineWidth(0.5).moveTo(left + labelW, boxTop).lineTo(left + labelW, y - 4).stroke();

    y += 24;
    doc.font("Helvetica").fontSize(9).fillColor(GRAY).text(
      `Submitted online${submittedByName ? ` by ${submittedByName}` : ""} on ${submittedAt.toLocaleString("en-IN")}.`,
      left,
      y,
      { width: fullWidth }
    );

    doc.end();
  });
}
