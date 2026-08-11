import PDFDocument from "pdfkit";
import { amountInWords } from "@/lib/numberToWords";

const DARK = "#1f2937";
const GRAY = "#64748b";
const BORDER = "#475569";
const NAVY = "#0b3c91";

export type BillPdfItem = {
  description: string;
  hsnSac?: string;
  unit?: string;
  quantity: number;
  rate: number;
  amount: number;
};

type TaxType = "igst" | "cgst_sgst" | "none";

/**
 * Snaps a coordinate to the pixel half so a 1pt hairline stroke centers
 * exactly on a device pixel instead of straddling two — fractional y's
 * (very common here since they come from running text heights) otherwise
 * render as a faint, anti-aliased smear that reads as "missing" in most
 * PDF viewers.
 */
function snap(v: number) {
  return Math.round(v) + 0.5;
}

/** Draws a 1px rule spanning [x1, x2] at y. */
function hLine(doc: PDFKit.PDFDocument, x1: number, x2: number, y: number) {
  const sy = snap(y);
  doc.strokeColor(BORDER).lineWidth(1).moveTo(x1, sy).lineTo(x2, sy).stroke();
}

function vLine(doc: PDFKit.PDFDocument, x: number, y1: number, y2: number) {
  const sx = snap(x);
  doc.strokeColor(BORDER).lineWidth(1).moveTo(sx, y1).lineTo(sx, y2).stroke();
}

/** Formats a date the way Indian tax invoices conventionally do, e.g. "10-Aug-26". */
function formatInvoiceDate(date: string | Date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleDateString("en-IN", { month: "short" });
  const year = String(d.getFullYear()).slice(-2);
  return `${day}-${month}-${year}`;
}

export function generateBillPdf({
  billNumber,
  billDate,
  dueDate,
  customerName,
  customerCompany,
  customerEmail,
  customerPhone,
  customerAddress,
  customerGstin,
  customerState,
  shipmentTrackingNumber,
  currency,
  items,
  subtotal,
  taxType,
  taxRate,
  taxAmount,
  total,
  status,
  notes,
  companyName,
  companyAddress,
  companyEmail,
  companyPhone,
  companyGstin,
  companyPan,
  companyUdyam,
  companyState,
  jurisdiction,
  bank,
}: {
  billNumber: string;
  billDate: string;
  dueDate?: string;
  customerName: string;
  customerCompany?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  customerGstin?: string;
  customerState?: string;
  shipmentTrackingNumber?: string;
  currency: string;
  items: BillPdfItem[];
  subtotal: number;
  taxType: TaxType;
  taxRate: number;
  taxAmount: number;
  total: number;
  status: string;
  notes?: string;
  companyName?: string;
  companyAddress?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyGstin?: string;
  companyPan?: string;
  companyUdyam?: string;
  companyState?: string;
  jurisdiction?: string;
  bank?: {
    accountHolder?: string;
    bankName?: string;
    accountNumber?: string;
    branch?: string;
    ifsc?: string;
  };
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 36 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const fullWidth = right - left;
    const rounded = total - (subtotal + taxAmount);

    doc.fillColor(DARK).font("Helvetica-Bold").fontSize(13).text("TAX INVOICE", left, 30, {
      width: fullWidth,
      align: "center",
    });

    let y = 52;
    const outerTop = y;
    hLine(doc, left, right, outerTop);

    // ---- Seller (left) / Invoice meta (right) header row ----
    const metaColX = left + fullWidth * 0.62;
    doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(13).text(companyName || "Rana Forwarder", left + 8, y + 6, {
      width: metaColX - left - 16,
    });
    doc.fillColor(DARK).font("Helvetica").fontSize(8.5);
    if (companyAddress) doc.text(companyAddress, left + 8, doc.y + 2, { width: metaColX - left - 16 });
    if (companyUdyam) doc.text(`UDYAM: ${companyUdyam}`, left + 8, doc.y + 2, { width: metaColX - left - 16 });
    if (companyGstin) doc.text(`GSTIN/UIN: ${companyGstin}`, left + 8, doc.y + 2, { width: metaColX - left - 16 });
    if (companyState) doc.text(`State Name: ${companyState}`, left + 8, doc.y + 2, { width: metaColX - left - 16 });
    if (companyEmail || companyPhone) {
      doc.text([companyEmail, companyPhone].filter(Boolean).join("  ·  "), left + 8, doc.y + 2, {
        width: metaColX - left - 16,
      });
    }
    const sellerBottom = doc.y + 8;

    doc.fillColor(GRAY).font("Helvetica-Bold").fontSize(8).text("Invoice No.", metaColX + 8, y + 6);
    doc.fillColor(DARK).font("Helvetica").fontSize(9).text(billNumber, metaColX + 8, doc.y + 1);
    doc.fillColor(GRAY).font("Helvetica-Bold").fontSize(8).text("Dated", metaColX + 8, doc.y + 6);
    doc.fillColor(DARK).font("Helvetica").fontSize(9).text(formatInvoiceDate(billDate), metaColX + 8, doc.y + 1);
    if (dueDate) {
      doc.fillColor(GRAY).font("Helvetica-Bold").fontSize(8).text("Payment Due", metaColX + 8, doc.y + 6);
      doc.fillColor(DARK).font("Helvetica").fontSize(9).text(formatInvoiceDate(dueDate), metaColX + 8, doc.y + 1);
    }
    if (shipmentTrackingNumber) {
      doc.fillColor(GRAY).font("Helvetica-Bold").fontSize(8).text("Shipment / Ref.", metaColX + 8, doc.y + 6);
      doc.fillColor(DARK).font("Helvetica").fontSize(9).text(shipmentTrackingNumber, metaColX + 8, doc.y + 1);
    }
    doc.fillColor(GRAY).font("Helvetica-Bold").fontSize(8).text("Status", metaColX + 8, doc.y + 6);
    doc.fillColor(DARK).font("Helvetica-Bold").fontSize(9).text(status.toUpperCase(), metaColX + 8, doc.y + 1);
    const metaBottom = doc.y + 8;

    y = Math.max(sellerBottom, metaBottom);
    vLine(doc, metaColX, outerTop, y);
    hLine(doc, left, right, y);

    // ---- Buyer box ----
    const buyerTop = y;
    doc.fillColor(GRAY).font("Helvetica-Bold").fontSize(8).text("BUYER (BILL TO)", left + 8, y + 6);
    doc.fillColor(DARK).font("Helvetica-Bold").fontSize(10).text(customerCompany || customerName, left + 8, doc.y + 2, {
      width: fullWidth - 16,
    });
    doc.font("Helvetica").fontSize(8.5);
    if (customerCompany && customerName) doc.text(customerName, left + 8, doc.y + 1, { width: fullWidth - 16 });
    if (customerAddress) doc.text(customerAddress, left + 8, doc.y + 1, { width: fullWidth - 16 });
    const contactLine = [customerEmail, customerPhone].filter(Boolean).join("  ·  ");
    if (contactLine) doc.text(contactLine, left + 8, doc.y + 1, { width: fullWidth - 16 });
    const gstLine = [customerGstin ? `GSTIN/UIN: ${customerGstin}` : null, customerState ? `State: ${customerState}` : null]
      .filter(Boolean)
      .join("  ·  ");
    if (gstLine) doc.text(gstLine, left + 8, doc.y + 1, { width: fullWidth - 16 });
    y = doc.y + 8;
    hLine(doc, left, right, y);
    vLine(doc, left, outerTop, y);
    vLine(doc, right, outerTop, y);
    void buyerTop;

    // ---- Items table ----
    const slColX = left;
    const slColW = 24;
    const hsnColW = 60;
    const qtyColW = 60;
    const rateColW = 70;
    const amtColW = 90;
    const descColX = slColX + slColW;
    const hsnColX = right - amtColW - rateColW - qtyColW - hsnColW;
    const qtyColX = hsnColX + hsnColW;
    const rateColX = qtyColX + qtyColW;
    const amtColX = rateColX + rateColW;
    const descColW = hsnColX - descColX;

    const tableTop = y;
    const headerH = 18;
    doc.fillColor(GRAY).font("Helvetica-Bold").fontSize(8);
    doc.text("SL", slColX, y + 5, { width: slColW, align: "center" });
    doc.text("DESCRIPTION OF SERVICES", descColX + 4, y + 5, { width: descColW - 8 });
    doc.text("HSN/SAC", hsnColX, y + 5, { width: hsnColW, align: "center" });
    doc.text("QTY", qtyColX, y + 5, { width: qtyColW, align: "center" });
    doc.text("RATE", rateColX, y + 5, { width: rateColW - 6, align: "right" });
    doc.text("AMOUNT", amtColX, y + 5, { width: amtColW - 8, align: "right" });
    y += headerH;
    hLine(doc, left, right, y);

    doc.font("Helvetica").fontSize(9).fillColor(DARK);
    items.forEach((item, i) => {
      const rowTop = y + 5;
      doc.text(String(i + 1), slColX, rowTop, { width: slColW, align: "center" });
      doc.text(item.description, descColX + 4, rowTop, { width: descColW - 8 });
      const descBottom = doc.y;
      doc.text(item.hsnSac || "-", hsnColX, rowTop, { width: hsnColW, align: "center" });
      doc.text(`${item.quantity} ${item.unit || ""}`.trim(), qtyColX, rowTop, { width: qtyColW, align: "center" });
      doc.text(`${item.rate.toLocaleString("en-IN")}`, rateColX, rowTop, { width: rateColW - 6, align: "right" });
      doc.text(`${item.amount.toLocaleString("en-IN")}`, amtColX, rowTop, { width: amtColW - 8, align: "right" });
      y = Math.max(descBottom, rowTop + 12) + 6;
      hLine(doc, left, right, y);
    });

    // ---- Totals within the table (right-aligned rows) ----
    const totalsLabelX = rateColX - 100;
    const totalsLabelW = rateColX - totalsLabelX - 6;

    doc.font("Helvetica").fontSize(9).fillColor(GRAY);
    doc.text("Taxable Value", totalsLabelX, y + 5, { width: totalsLabelW, align: "right" });
    doc.fillColor(DARK).text(subtotal.toLocaleString("en-IN"), amtColX, y + 5, { width: amtColW - 8, align: "right" });
    y = doc.y + 6;
    hLine(doc, left, right, y);

    if (taxType === "igst") {
      doc.fillColor(GRAY).text(`IGST (${taxRate}%)`, totalsLabelX, y + 5, { width: totalsLabelW, align: "right" });
      doc.fillColor(DARK).text(taxAmount.toLocaleString("en-IN"), amtColX, y + 5, { width: amtColW - 8, align: "right" });
      y = doc.y + 6;
      hLine(doc, left, right, y);
    } else if (taxType === "cgst_sgst") {
      const half = Math.round((taxAmount / 2) * 100) / 100;
      const halfRate = taxRate / 2;
      doc.fillColor(GRAY).text(`CGST (${halfRate}%)`, totalsLabelX, y + 5, { width: totalsLabelW, align: "right" });
      doc.fillColor(DARK).text(half.toLocaleString("en-IN"), amtColX, y + 5, { width: amtColW - 8, align: "right" });
      y = doc.y + 6;
      hLine(doc, left, right, y);
      doc.fillColor(GRAY).text(`SGST (${halfRate}%)`, totalsLabelX, y + 5, { width: totalsLabelW, align: "right" });
      doc.fillColor(DARK).text((taxAmount - half).toLocaleString("en-IN"), amtColX, y + 5, { width: amtColW - 8, align: "right" });
      y = doc.y + 6;
      hLine(doc, left, right, y);
    }

    if (Math.abs(rounded) >= 0.005) {
      doc.fillColor(GRAY).text("Rounded Off", totalsLabelX, y + 5, { width: totalsLabelW, align: "right" });
      doc.fillColor(DARK).text(rounded.toFixed(2), amtColX, y + 5, { width: amtColW - 8, align: "right" });
      y = doc.y + 6;
      hLine(doc, left, right, y);
    }

    doc.font("Helvetica-Bold").fontSize(10).fillColor(NAVY);
    doc.text("Total", totalsLabelX, y + 6, { width: totalsLabelW, align: "right" });
    doc.text(`${currency} ${total.toLocaleString("en-IN")}`, amtColX, y + 6, { width: amtColW - 8, align: "right" });
    y = doc.y + 8;
    hLine(doc, left, right, y);

    // table outer verticals
    [left, descColX, hsnColX, qtyColX, rateColX, amtColX, right].forEach((x) => vLine(doc, x, tableTop, y));

    // Left/right borders for the amount-in-words / tax-in-words / declaration
    // block below the table start here and are closed off once we know
    // where that block ends (see lowerBoxBottom below).
    const lowerBoxTop = y;

    // ---- Amount chargeable in words ----
    y += 8;
    doc.font("Helvetica-Bold").fontSize(8).fillColor(GRAY).text("Amount Chargeable (in words)", left + 8, y);
    doc.font("Helvetica-Bold").fontSize(9.5).fillColor(DARK).text(amountInWords(total, currency), left + 8, doc.y + 2, {
      width: fullWidth - 16,
    });
    y = doc.y + 8;
    hLine(doc, left, right, y);
    y += 10;

    // ---- Tax amount in words + Company PAN ----
    if (taxAmount > 0) {
      doc.font("Helvetica").fontSize(8.5).fillColor(GRAY).text("Tax Amount (in words): ", left + 8, y, { continued: true });
      doc.font("Helvetica-Bold").fillColor(DARK).text(amountInWords(taxAmount, currency));
      y = doc.y + 6;
    }
    if (companyPan) {
      doc.font("Helvetica").fontSize(8.5).fillColor(GRAY).text("Company's PAN: ", left + 8, y, { continued: true });
      doc.font("Helvetica-Bold").fillColor(DARK).text(companyPan);
      y = doc.y + 8;
    }
    hLine(doc, left, right, y);
    y += 10;

    // ---- Declaration (left) / Bank details (right) ----
    const bankColX = left + fullWidth * 0.55;
    const declTop = y;
    doc.font("Helvetica-Bold").fontSize(8).fillColor(GRAY).text("DECLARATION", left + 8, y);
    doc.font("Helvetica").fontSize(8).fillColor(DARK).text(
      "We declare that this invoice shows the actual price of the services described and that all particulars are true and correct." +
        (taxRate > 0 ? " Interest @18% p.a. is applicable on delayed payment." : ""),
      left + 8,
      doc.y + 3,
      { width: bankColX - left - 20 }
    );
    const declBottom = doc.y;

    if (bank && (bank.accountHolder || bank.bankName || bank.accountNumber)) {
      doc.font("Helvetica-Bold").fontSize(8).fillColor(GRAY).text("COMPANY'S BANK DETAILS", bankColX + 8, declTop);
      doc.font("Helvetica").fontSize(8).fillColor(DARK);
      let by = doc.y + 3;
      if (bank.accountHolder) { doc.text(`A/c Holder: ${bank.accountHolder}`, bankColX + 8, by, { width: right - bankColX - 16 }); by = doc.y + 1; }
      if (bank.bankName) { doc.text(`Bank: ${bank.bankName}`, bankColX + 8, by, { width: right - bankColX - 16 }); by = doc.y + 1; }
      if (bank.accountNumber) { doc.text(`A/c No.: ${bank.accountNumber}`, bankColX + 8, by, { width: right - bankColX - 16 }); by = doc.y + 1; }
      if (bank.branch || bank.ifsc) {
        doc.text(`${bank.branch ? `Branch: ${bank.branch}` : ""}${bank.branch && bank.ifsc ? "  ·  " : ""}${bank.ifsc ? `IFSC: ${bank.ifsc}` : ""}`, bankColX + 8, by, { width: right - bankColX - 16 });
      }
    }
    y = Math.max(declBottom, doc.y) + 12;
    hLine(doc, left, right, y);

    const lowerBoxBottom = y;
    vLine(doc, left, lowerBoxTop, lowerBoxBottom);
    vLine(doc, right, lowerBoxTop, lowerBoxBottom);
    vLine(doc, bankColX, declTop, lowerBoxBottom);
    y += 6;

    if (notes) {
      doc.font("Helvetica-Bold").fontSize(8).fillColor(GRAY).text("NOTES", left, y);
      doc.font("Helvetica").fontSize(9).fillColor(DARK).text(notes, left, doc.y + 2, { width: fullWidth });
      y = doc.y + 10;
    }

    // ---- Signature block ----
    const sigY = Math.max(y, doc.page.height - 140);
    doc.font("Helvetica").fontSize(8.5).fillColor(GRAY).text("Customer's Seal and Signature", left, sigY);
    doc.font("Helvetica-Bold").fontSize(9).fillColor(DARK).text(`for ${companyName || "Rana Forwarder"}`, left, sigY, {
      width: fullWidth,
      align: "right",
    });
    doc.font("Helvetica").fontSize(8.5).fillColor(GRAY).text("Authorised Signatory", left, sigY + 40, {
      width: fullWidth,
      align: "right",
    });

    const footerY = sigY + 60;
    hLine(doc, left, right, footerY);
    doc.font("Helvetica").fontSize(7.5).fillColor(GRAY).text(
      jurisdiction ? `SUBJECT TO ${jurisdiction.toUpperCase()} JURISDICTION` : "",
      left,
      footerY + 6,
      { width: fullWidth, align: "center" }
    );
    doc.text("This is a Computer Generated Invoice", left, doc.y + 2, { width: fullWidth, align: "center" });

    doc.end();
  });
}
