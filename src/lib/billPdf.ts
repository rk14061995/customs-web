import PDFDocument from "pdfkit";

const NAVY = "#0b3c91";
const GRAY = "#64748b";
const DARK = "#1f2937";
const BORDER = "#e2e8f0";

export type BillPdfItem = { description: string; quantity: number; rate: number; amount: number };

export function generateBillPdf({
  billNumber,
  billDate,
  dueDate,
  customerName,
  customerCompany,
  customerEmail,
  customerPhone,
  shipmentTrackingNumber,
  currency,
  items,
  subtotal,
  taxRate,
  taxAmount,
  total,
  status,
  notes,
  companyEmail,
  companyPhone,
}: {
  billNumber: string;
  billDate: string;
  dueDate?: string;
  customerName: string;
  customerCompany?: string;
  customerEmail?: string;
  customerPhone?: string;
  shipmentTrackingNumber?: string;
  currency: string;
  items: BillPdfItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  status: string;
  notes?: string;
  companyEmail?: string;
  companyPhone?: string;
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

    doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(18).text("Rana Forwarder", left, 50);
    doc.fillColor(GRAY).font("Helvetica").fontSize(9).text("Logistics & Freight Forwarding", left, doc.y);
    if (companyEmail) doc.text(companyEmail, left, doc.y);
    if (companyPhone) doc.text(companyPhone, left, doc.y);

    doc.fillColor(DARK).font("Helvetica-Bold").fontSize(14).text("BILL", left, 50, { width: fullWidth, align: "right" });
    doc.fillColor(GRAY).font("Helvetica").fontSize(9)
      .text(billNumber, left, doc.y, { width: fullWidth, align: "right" })
      .text(new Date(billDate).toLocaleDateString(), left, doc.y, { width: fullWidth, align: "right" })
      .text(status.toUpperCase(), left, doc.y, { width: fullWidth, align: "right" });

    let y = Math.max(doc.y, 120) + 10;
    doc.strokeColor(BORDER).moveTo(left, y).lineTo(right, y).stroke();
    y += 20;

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

    let rightY = y;
    if (shipmentTrackingNumber || dueDate) {
      doc.fillColor(GRAY).font("Helvetica-Bold").fontSize(9).text("DETAILS", rightColX, y);
      doc.fillColor(DARK).font("Helvetica").fontSize(10);
      rightY = doc.y + 2;
      if (shipmentTrackingNumber) { doc.text(`Shipment: ${shipmentTrackingNumber}`, rightColX, rightY, { width: colWidth }); rightY = doc.y; }
      if (dueDate) { doc.text(`Due: ${new Date(dueDate).toLocaleDateString()}`, rightColX, rightY, { width: colWidth }); rightY = doc.y; }
    }

    y = Math.max(leftY, rightY) + 20;

    const descColX = left;
    const qtyColX = left + fullWidth * 0.55;
    const rateColX = left + fullWidth * 0.7;
    const amountColX = left + fullWidth * 0.85;
    const amountColWidth = right - amountColX;

    doc.fillColor(GRAY).font("Helvetica-Bold").fontSize(9);
    doc.text("DESCRIPTION", descColX, y);
    doc.text("QTY", qtyColX, y);
    doc.text("RATE", rateColX, y);
    doc.text("AMOUNT", amountColX, y, { width: amountColWidth, align: "right" });
    y = doc.y + 6;
    doc.strokeColor(BORDER).moveTo(left, y).lineTo(right, y).stroke();
    y += 8;

    doc.font("Helvetica").fontSize(10);
    for (const item of items) {
      const rowTop = y;
      doc.fillColor(DARK).text(item.description, descColX, y, { width: qtyColX - descColX - 10 });
      doc.text(String(item.quantity), qtyColX, rowTop, { width: rateColX - qtyColX - 10 });
      doc.text(`${currency} ${item.rate.toLocaleString()}`, rateColX, rowTop, { width: amountColX - rateColX - 10 });
      doc.text(`${currency} ${item.amount.toLocaleString()}`, amountColX, rowTop, { width: amountColWidth, align: "right" });
      y = Math.max(doc.y, rowTop + 14) + 6;
      doc.strokeColor(BORDER).moveTo(left, y - 3).lineTo(right, y - 3).stroke();
    }

    y += 10;

    const totalsLabelX = left + fullWidth * 0.6;
    const totalsValueWidth = right - amountColX;

    doc.fillColor(GRAY).font("Helvetica").fontSize(10);
    doc.text("Subtotal", totalsLabelX, y, { width: amountColX - totalsLabelX });
    doc.text(`${currency} ${subtotal.toLocaleString()}`, amountColX, y, { width: totalsValueWidth, align: "right" });
    y = doc.y + 4;

    doc.text(`Tax (${taxRate}%)`, totalsLabelX, y, { width: amountColX - totalsLabelX });
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
