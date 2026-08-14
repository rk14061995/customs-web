import PDFDocument from "pdfkit";

const NAVY = "#0b3c91";
const GRAY = "#64748b";
const DARK = "#1f2937";
const BORDER = "#e2e8f0";

export type QuotationPdfCharge = { label: string; basisLabel: string; amount: number };

export type QuotationPdfFields = {
  quoteNumber: string;
  createdAt: Date | string;
  customerName: string;
  customerCompany?: string;
  customerEmail?: string;
  customerPhone?: string;
  origin: string;
  destination: string;
  serviceType: string;
  weightKg: number;
  quantity: number;
  dimensions?: string;
  validUntil?: string;
  currency: string;
  charges: QuotationPdfCharge[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes?: string;
  companyEmail?: string;
  companyPhone?: string;
};

export function generateQuotationPdf({
  quoteNumber,
  createdAt,
  customerName,
  customerCompany,
  customerEmail,
  customerPhone,
  origin,
  destination,
  serviceType,
  weightKg,
  quantity,
  dimensions,
  validUntil,
  currency,
  charges,
  subtotal,
  taxRate,
  taxAmount,
  total,
  notes,
  companyEmail,
  companyPhone,
}: QuotationPdfFields): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const fullWidth = right - left;

    // Header
    doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(18).text("Rana Forwarder", left, 50);
    doc.fillColor(GRAY).font("Helvetica").fontSize(9).text("Logistics & Freight Forwarding", left, doc.y);
    if (companyEmail) doc.text(companyEmail, left, doc.y);
    if (companyPhone) doc.text(companyPhone, left, doc.y);

    doc.fillColor(DARK).font("Helvetica-Bold").fontSize(14).text("QUOTATION", left, 50, { width: fullWidth, align: "right" });
    doc.fillColor(GRAY).font("Helvetica").fontSize(9)
      .text(quoteNumber, left, doc.y, { width: fullWidth, align: "right" })
      .text(new Date(createdAt).toLocaleDateString(), left, doc.y, { width: fullWidth, align: "right" });

    let y = Math.max(doc.y, 120) + 10;
    doc.strokeColor(BORDER).moveTo(left, y).lineTo(right, y).stroke();
    y += 20;

    // Billed To / Shipment Details
    const colWidth = fullWidth / 2 - 15;
    const rightColX = left + fullWidth / 2 + 15;

    doc.fillColor(GRAY).font("Helvetica-Bold").fontSize(9).text("BILLED TO", left, y);
    doc.fillColor(DARK).font("Helvetica").fontSize(10);
    let leftY = doc.y + 2;
    doc.text(customerName, left, leftY, { width: colWidth });
    leftY = doc.y;
    if (customerCompany) { doc.text(customerCompany, left, leftY, { width: colWidth }); leftY = doc.y; }
    if (customerEmail) { doc.text(customerEmail, left, leftY, { width: colWidth }); leftY = doc.y; }
    if (customerPhone) { doc.text(customerPhone, left, leftY, { width: colWidth }); leftY = doc.y; }

    doc.fillColor(GRAY).font("Helvetica-Bold").fontSize(9).text("SHIPMENT DETAILS", rightColX, y);
    doc.fillColor(DARK).font("Helvetica").fontSize(10);
    let rightY = doc.y + 2;
    doc.text(`${origin} -> ${destination}`, rightColX, rightY, { width: colWidth });
    rightY = doc.y;
    doc.text(serviceType, rightColX, rightY, { width: colWidth });
    rightY = doc.y;
    doc.text(
      `${weightKg} kg . ${quantity} box${quantity === 1 ? "" : "es"}${dimensions ? ` . ${dimensions}` : ""}`,
      rightColX,
      rightY,
      { width: colWidth }
    );
    rightY = doc.y;
    if (validUntil) { doc.text(`Valid until ${validUntil}`, rightColX, rightY, { width: colWidth }); rightY = doc.y; }

    y = Math.max(leftY, rightY) + 20;

    // Charges table
    const chargeColX = left;
    const basisColX = left + fullWidth * 0.5;
    const amountColX = left + fullWidth * 0.75;
    const amountColWidth = right - amountColX;

    doc.fillColor(GRAY).font("Helvetica-Bold").fontSize(9);
    doc.text("CHARGE", chargeColX, y);
    doc.text("BASIS", basisColX, y);
    doc.text("AMOUNT", amountColX, y, { width: amountColWidth, align: "right" });
    y = doc.y + 6;
    doc.strokeColor(BORDER).moveTo(left, y).lineTo(right, y).stroke();
    y += 8;

    doc.font("Helvetica").fontSize(10);
    for (const charge of charges) {
      doc.fillColor(DARK).text(charge.label, chargeColX, y, { width: basisColX - chargeColX - 10 });
      const rowTop = y;
      doc.fillColor(GRAY).fontSize(9).text(charge.basisLabel, basisColX, y, { width: amountColX - basisColX - 10 });
      doc.fillColor(DARK).fontSize(10).text(`${currency} ${charge.amount.toLocaleString()}`, amountColX, rowTop, {
        width: amountColWidth,
        align: "right",
      });
      y = Math.max(doc.y, rowTop + 14) + 6;
      doc.strokeColor(BORDER).moveTo(left, y - 3).lineTo(right, y - 3).stroke();
    }

    y += 10;

    // Totals
    const totalsLabelX = left + fullWidth * 0.6;
    const totalsValueWidth = right - amountColX;

    doc.fillColor(GRAY).font("Helvetica").fontSize(10);
    doc.text("Subtotal", totalsLabelX, y, { width: amountColX - totalsLabelX });
    doc.text(`${currency} ${subtotal.toLocaleString()}`, amountColX, y, { width: totalsValueWidth, align: "right" });
    y = doc.y + 4;

    doc.text(`GST / Tax (${taxRate}%)`, totalsLabelX, y, { width: amountColX - totalsLabelX });
    doc.text(`${currency} ${taxAmount.toLocaleString()}`, amountColX, y, { width: totalsValueWidth, align: "right" });
    y = doc.y + 8;

    doc.strokeColor(BORDER).moveTo(totalsLabelX, y - 4).lineTo(right, y - 4).stroke();

    doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(12);
    doc.text("Total", totalsLabelX, y, { width: amountColX - totalsLabelX });
    doc.text(`${currency} ${total.toLocaleString()}`, amountColX, y, { width: totalsValueWidth, align: "right" });
    y = doc.y + 20;

    if (notes) {
      doc.strokeColor(BORDER).moveTo(left, y).lineTo(right, y).stroke();
      y += 12;
      doc.fillColor(GRAY).font("Helvetica-Bold").fontSize(9).text("NOTES", left, y);
      doc.fillColor(DARK).font("Helvetica").fontSize(10).text(notes, left, doc.y + 2, { width: fullWidth });
    }

    doc.end();
  });
}
