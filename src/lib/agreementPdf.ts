import PDFDocument from "pdfkit";
import type { IAgreementTemplateSnapshot, IAgreementSignature } from "@/models/Agreement";

const GRAY = "#64748b";
const DARK = "#1f2937";
const BORDER = "#e2e8f0";

function dataUrlToBuffer(dataUrl: string): Buffer {
  const base64 = dataUrl.split(",").pop() ?? "";
  return Buffer.from(base64, "base64");
}

export function generateAgreementPdf({
  template,
  customerName,
  customerAddress,
  customerPhone,
  trackingNumber,
  signature,
}: {
  template: IAgreementTemplateSnapshot;
  customerName: string;
  customerAddress?: string;
  customerPhone?: string;
  trackingNumber: string;
  signature?: IAgreementSignature;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const fullWidth = right - left;

    doc.fillColor(DARK).font("Helvetica-Bold").fontSize(14).text(template.title.toUpperCase(), left, 50, {
      width: fullWidth,
      align: "center",
    });
    doc.fillColor(GRAY).font("Helvetica-Bold").fontSize(11).text(template.forwarderName.toUpperCase(), left, doc.y + 6, {
      width: fullWidth,
      align: "center",
    });

    let y = doc.y + 20;
    doc.fillColor(DARK).font("Helvetica").fontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, left, y);
    y = doc.y + 12;

    doc.text("This Agreement is executed between:", left, y);
    y = doc.y + 10;

    doc.font("Helvetica-Bold").text(template.forwarderName, left, y);
    doc.font("Helvetica").text(`Address: ${template.forwarderAddress}`, left, doc.y + 2, { width: fullWidth });
    doc.text('(Hereinafter referred to as the "Forwarder")', left, doc.y + 2);
    y = doc.y + 10;

    doc.text("AND", left, y);
    y = doc.y + 10;

    doc.font("Helvetica-Bold").text(`Customer Name: ${customerName}`, left, y);
    doc.font("Helvetica").text(`Address: ${customerAddress || "-"}`, left, doc.y + 2, { width: fullWidth });
    doc.text(`Mobile: ${customerPhone || "-"}`, left, doc.y + 2);
    doc.text(`Shipment Tracking #: ${trackingNumber}`, left, doc.y + 2);
    y = doc.y + 14;

    doc.strokeColor(BORDER).moveTo(left, y).lineTo(right, y).stroke();
    y += 12;

    doc.font("Helvetica-Bold").fontSize(10).text(`Subject: ${template.subject}`, left, y, { width: fullWidth });
    y = doc.y + 10;

    doc.font("Helvetica").fontSize(10).text(
      "I the undersigned customer, hereby declare and agree as follows:",
      left,
      y,
      { width: fullWidth }
    );
    y = doc.y + 10;

    template.clauses.forEach((clause, i) => {
      doc.font("Helvetica").fontSize(10).text(`${i + 1}. ${clause}`, left, y, { width: fullWidth });
      y = doc.y + 8;
    });

    y += 6;
    doc.font("Helvetica").fontSize(10).text(
      "I have read, understood, and voluntarily accepted the above terms and conditions.",
      left,
      y,
      { width: fullWidth }
    );
    y = doc.y + 24;

    if (y > doc.page.height - 220) {
      doc.addPage();
      y = doc.page.margins.top;
    }

    const colWidth = fullWidth / 2 - 15;
    const rightColX = left + fullWidth / 2 + 15;

    doc.font("Helvetica-Bold").fontSize(10).text("Customer", left, y);
    let leftY = doc.y + 8;
    doc.font("Helvetica").fontSize(9);
    if (signature) {
      const imgBuffer = dataUrlToBuffer(signature.signatureDataUrl);
      try {
        doc.image(imgBuffer, left, leftY, { width: Math.min(colWidth, 160), height: 50 });
        leftY += 55;
      } catch {
        doc.strokeColor(BORDER).moveTo(left, leftY + 20).lineTo(left + colWidth, leftY + 20).stroke();
        leftY += 28;
      }
      doc.text(`Name: ${signature.signedName}`, left, leftY, { width: colWidth });
      leftY = doc.y + 2;
      doc.text(`Signed: ${new Date(signature.signedAt).toLocaleString()}`, left, leftY, { width: colWidth });
      if (signature.ip) {
        leftY = doc.y + 2;
        doc.text(`IP: ${signature.ip}`, left, leftY, { width: colWidth });
      }
    } else {
      doc.strokeColor(BORDER).moveTo(left, leftY + 20).lineTo(left + colWidth, leftY + 20).stroke();
      leftY += 28;
      doc.text("Name: ______________________", left, leftY, { width: colWidth });
      leftY = doc.y + 2;
      doc.text("Date: ______________________", left, leftY, { width: colWidth });
    }

    doc.font("Helvetica-Bold").fontSize(10).text(`For ${template.forwarderName}`, rightColX, y);
    doc.font("Helvetica").fontSize(9);
    let rightY = doc.y + 30;
    doc.text(`Name: ${template.authorizedSignatoryName || "______________________"}`, rightColX, rightY, {
      width: colWidth,
    });
    rightY = doc.y + 2;
    doc.text(`Designation: ${template.authorizedSignatoryDesignation || "______________________"}`, rightColX, rightY, {
      width: colWidth,
    });
    rightY = doc.y + 2;
    doc.text(`Date: ${new Date().toLocaleDateString()}`, rightColX, rightY, { width: colWidth });

    doc.end();
  });
}
