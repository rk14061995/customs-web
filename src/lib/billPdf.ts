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

/** Renders one label/value cell of the invoice-details grid, Tally style: small caption, value directly below. */
function metaCell(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  w: number,
  label: string,
  value?: string
) {
  doc.font("Helvetica").fontSize(7.5).fillColor(GRAY).text(label, x + 6, y + 4, { width: w - 10 });
  if (value) {
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor(DARK).text(value, x + 6, y + 13, { width: w - 10 });
  }
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
  /**
   * Draws the full invoice onto `doc` and returns the final y. `extraStretch` is
   * blank space inserted into the items table (below the last line item, Tally
   * style) so the whole invoice can be stretched to fill the page height — see
   * the two-pass measure/render dance in the promise body below.
   */
  function drawInvoice(doc: PDFKit.PDFDocument, extraStretch: number): number {
    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const fullWidth = right - left;
    const resolvedCompanyName = companyName || "Rana Forwarder";
    const rounded = total - (subtotal + taxAmount);

    doc.fillColor(DARK).font("Helvetica-Bold").fontSize(13).text("TAX INVOICE", left, 30, {
      width: fullWidth,
      align: "center",
    });

    let y = 52;
    const outerTop = y;
    hLine(doc, left, right, outerTop);

    // ---- Seller (left) / invoice-details grid (right), Tally-style ----
    const metaColX = left + fullWidth * 0.6;
    const metaSubColX = metaColX + (right - metaColX) * 0.46;
    const rowH = 21;

    doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(12).text(resolvedCompanyName, left + 8, y + 6, {
      width: metaColX - left - 16,
    });
    doc.fillColor(DARK).font("Helvetica").fontSize(8.5);
    if (companyAddress) doc.text(companyAddress, left + 8, doc.y + 2, { width: metaColX - left - 16 });
    if (companyUdyam) doc.text(`UDYAM : ${companyUdyam}`, left + 8, doc.y + 2, { width: metaColX - left - 16 });
    if (companyGstin) doc.text(`GSTIN/UIN: ${companyGstin}`, left + 8, doc.y + 2, { width: metaColX - left - 16 });
    if (companyState) doc.text(`State Name : ${companyState}`, left + 8, doc.y + 2, { width: metaColX - left - 16 });
    if (companyEmail || companyPhone) {
      doc.text([companyEmail, companyPhone].filter(Boolean).join("  ·  "), left + 8, doc.y + 2, {
        width: metaColX - left - 16,
      });
    }
    const sellerBottom = doc.y + 8;

    doc.fillColor(GRAY).font("Helvetica-Bold").fontSize(8).text("Buyer (Bill to)", left + 8, sellerBottom + 6);
    doc.fillColor(DARK).font("Helvetica-Bold").fontSize(10).text(
      customerCompany || customerName,
      left + 8,
      doc.y + 2,
      { width: metaColX - left - 16 }
    );
    doc.font("Helvetica").fontSize(8.5);
    if (customerCompany && customerName) doc.text(customerName, left + 8, doc.y + 1, { width: metaColX - left - 16 });
    if (customerAddress) doc.text(customerAddress, left + 8, doc.y + 1, { width: metaColX - left - 16 });
    const contactLine = [customerEmail, customerPhone].filter(Boolean).join("  ·  ");
    if (contactLine) doc.text(contactLine, left + 8, doc.y + 1, { width: metaColX - left - 16 });
    if (customerGstin) doc.text(`GSTIN/UIN : ${customerGstin}`, left + 8, doc.y + 1, { width: metaColX - left - 16 });
    if (customerState) doc.text(`State Name : ${customerState}`, left + 8, doc.y + 1, { width: metaColX - left - 16 });
    const buyerBottom = doc.y + 8;

    const metaRows: [string, string | undefined, string, string | undefined][] = [
      ["Invoice No.", billNumber, "Dated", formatInvoiceDate(billDate)],
      ["Delivery Note", undefined, "Mode/Terms of Payment", dueDate ? `Due ${formatInvoiceDate(dueDate)}` : undefined],
      ["Reference No. & Date.", undefined, "Other References", `Status: ${status.toUpperCase()}`],
      ["Buyer's Order No.", undefined, "Dated", undefined],
      ["Dispatch Doc No.", undefined, "Delivery Note Date", undefined],
      ["Dispatched through", shipmentTrackingNumber, "Destination", undefined],
    ];
    metaRows.forEach(([label1, value1, label2, value2], i) => {
      const rowTop = outerTop + i * rowH;
      if (i > 0) hLine(doc, metaColX, right, rowTop);
      metaCell(doc, metaColX, rowTop, metaSubColX - metaColX, label1, value1);
      metaCell(doc, metaSubColX, rowTop, right - metaSubColX, label2, value2);
    });
    const metaRow6Bottom = outerTop + metaRows.length * rowH;
    hLine(doc, metaColX, right, metaRow6Bottom);
    doc.font("Helvetica").fontSize(7.5).fillColor(GRAY).text("Terms of Delivery", metaColX + 6, metaRow6Bottom + 4, {
      width: right - metaColX - 10,
    });

    const boxBottom = Math.max(buyerBottom, metaRow6Bottom + rowH);
    hLine(doc, left, metaColX, sellerBottom);
    hLine(doc, left, right, boxBottom);
    vLine(doc, left, outerTop, boxBottom);
    vLine(doc, right, outerTop, boxBottom);
    vLine(doc, metaColX, outerTop, boxBottom);
    vLine(doc, metaSubColX, outerTop, metaRow6Bottom);

    y = boxBottom;

    // ---- Items table ----
    const slColX = left;
    const slColW = 24;
    const hsnColW = 65;
    const qtyColW = 75;
    const amtColW = 95;
    const descColX = slColX + slColW;
    const hsnColX = right - amtColW - qtyColW - hsnColW;
    const qtyColX = hsnColX + hsnColW;
    const amtColX = qtyColX + qtyColW;
    const descColW = hsnColX - descColX;

    const tableTop = y;
    const headerH = 18;
    doc.fillColor(GRAY).font("Helvetica-Bold").fontSize(8);
    doc.text("SL", slColX, y + 5, { width: slColW, align: "center" });
    doc.text("DESCRIPTION OF SERVICES", descColX + 4, y + 5, { width: descColW - 8 });
    doc.text("HSN/SAC", hsnColX, y + 5, { width: hsnColW, align: "center" });
    doc.text("QUANTITY", qtyColX, y + 5, { width: qtyColW, align: "center" });
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
      doc.text(`${item.amount.toLocaleString("en-IN")}`, amtColX, rowTop, { width: amtColW - 8, align: "right" });
      y = Math.max(descBottom, rowTop + 12) + 6;
      // No rule below the last item — it flows straight into the blank filler
      // cell / tax lines below, Tally style. Rows between items are still ruled.
      if (i < items.length - 1) hLine(doc, left, right, y);
    });

    // Blank filler cell so the item table (and everything stacked below it)
    // stretches down to fill the page, as Tally-generated invoices do.
    if (extraStretch > 0) {
      [left, descColX, hsnColX, qtyColX, amtColX, right].forEach((x) => vLine(doc, x, y, y + extraStretch));
      y += extraStretch;
    }

    // ---- Tax adjustment lines, floated in the same table (Tally style) ----
    function taxLine(label: string, amount: number) {
      const rowTop = y + 5;
      doc.font("Helvetica-Oblique").fontSize(9).fillColor(DARK).text(label, descColX + 4, rowTop, { width: descColW - 8, align: "right" });
      doc.font("Helvetica").fontSize(9).fillColor(DARK).text(amount.toLocaleString("en-IN"), amtColX, rowTop, {
        width: amtColW - 8,
        align: "right",
      });
      y = doc.y + 6;
      hLine(doc, left, right, y);
    }
    if (taxType === "igst") {
      taxLine(`IGST (${taxRate}%)`, taxAmount);
    } else if (taxType === "cgst_sgst") {
      const half = Math.round((taxAmount / 2) * 100) / 100;
      const halfRate = taxRate / 2;
      taxLine(`CGST (${halfRate}%)`, half);
      taxLine(`SGST (${halfRate}%)`, taxAmount - half);
    }
    if (Math.abs(rounded) >= 0.005) {
      taxLine("Rounded Off", rounded);
    }

    // ---- Total row ----
    const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalUnit = items[0]?.unit || "";
    doc.font("Helvetica-Bold").fontSize(9.5).fillColor(NAVY);
    doc.text("Total", descColX + 4, y + 6, { width: descColW - 8 });
    doc.text(`${totalQty} ${totalUnit}`.trim(), qtyColX, y + 6, { width: qtyColW, align: "center" });
    doc.text(`${currency} ${total.toLocaleString("en-IN")}`, amtColX, y + 6, { width: amtColW - 8, align: "right" });
    y = doc.y + 8;
    hLine(doc, left, right, y);

    // table outer verticals
    [left, descColX, hsnColX, qtyColX, amtColX, right].forEach((x) => vLine(doc, x, tableTop, y));

    // ---- Amount chargeable in words ----
    const wordsTop = y;
    y += 8;
    doc.font("Helvetica-Bold").fontSize(8).fillColor(GRAY).text("Amount Chargeable (in words)", left + 8, y);
    doc.font("Helvetica-Oblique").fontSize(8).fillColor(GRAY).text("E. & O.E", left + 8, y, {
      width: fullWidth - 16,
      align: "right",
    });
    doc.font("Helvetica-Bold").fontSize(9.5).fillColor(DARK).text(amountInWords(total, currency), left + 8, doc.y + 2, {
      width: fullWidth - 16,
    });
    y = doc.y + 8;
    hLine(doc, left, right, y);

    // ---- HSN/SAC-wise tax summary table ----
    if (taxType !== "none") {
      const taxable = new Map<string, number>();
      items.forEach((item) => {
        const key = item.hsnSac || "-";
        taxable.set(key, (taxable.get(key) || 0) + item.amount);
      });

      const summaryTop = y;
      let hsnW: number, taxableW: number, cgstRateW: number, cgstAmtW: number, sgstRateW: number, sgstAmtW: number, totalW: number;
      let hX: number, tX: number, r1X: number, a1X: number, r2X: number, a2X: number, totX: number;

      if (taxType === "igst") {
        hsnW = 110; taxableW = 110; cgstRateW = 60; cgstAmtW = 110; totalW = fullWidth - hsnW - taxableW - cgstRateW - cgstAmtW;
        hX = left; tX = hX + hsnW; r1X = tX + taxableW; a1X = r1X + cgstRateW; totX = a1X + cgstAmtW;
        sgstRateW = 0; sgstAmtW = 0; r2X = 0; a2X = 0;
      } else {
        hsnW = 90; taxableW = 90; cgstRateW = 45; cgstAmtW = 80; sgstRateW = 45; sgstAmtW = 80;
        totalW = fullWidth - hsnW - taxableW - cgstRateW - cgstAmtW - sgstRateW - sgstAmtW;
        hX = left; tX = hX + hsnW; r1X = tX + taxableW; a1X = r1X + cgstRateW; r2X = a1X + cgstAmtW; a2X = r2X + sgstRateW; totX = a2X + sgstAmtW;
      }

      const rowsY = summaryTop + 22;
      doc.font("Helvetica-Bold").fontSize(7.5).fillColor(GRAY);
      doc.text("HSN/SAC", hX + 4, summaryTop + 4, { width: hsnW - 8 });
      doc.text("Taxable\nValue", tX, summaryTop + 4, { width: taxableW - 6, align: "right" });
      if (taxType === "igst") {
        doc.text("IGST\nRate", r1X, summaryTop + 4, { width: cgstRateW - 6, align: "right" });
        doc.text("IGST\nAmount", a1X, summaryTop + 4, { width: cgstAmtW - 8, align: "right" });
      } else {
        doc.text("CGST\nRate", r1X, summaryTop + 4, { width: cgstRateW - 6, align: "right" });
        doc.text("CGST\nAmt", a1X, summaryTop + 4, { width: cgstAmtW - 8, align: "right" });
        doc.text("SGST\nRate", r2X, summaryTop + 4, { width: sgstRateW - 6, align: "right" });
        doc.text("SGST\nAmt", a2X, summaryTop + 4, { width: sgstAmtW - 8, align: "right" });
      }
      doc.text("Total\nTax Amount", totX, summaryTop + 4, { width: totalW - 8, align: "right" });
      hLine(doc, left, right, rowsY);

      let ry = rowsY;
      let taxableSum = 0;
      let taxSum = 0;
      doc.font("Helvetica").fontSize(8.5).fillColor(DARK);
      for (const [hsn, groupTaxable] of taxable) {
        const groupTax = subtotal > 0 ? (taxAmount * groupTaxable) / subtotal : 0;
        taxableSum += groupTaxable;
        taxSum += groupTax;
        const rt = ry + 5;
        doc.text(hsn, hX + 4, rt, { width: hsnW - 8 });
        doc.text(groupTaxable.toLocaleString("en-IN"), tX, rt, { width: taxableW - 6, align: "right" });
        if (taxType === "igst") {
          doc.text(`${taxRate}%`, r1X, rt, { width: cgstRateW - 6, align: "right" });
          doc.text(groupTax.toLocaleString("en-IN"), a1X, rt, { width: cgstAmtW - 8, align: "right" });
        } else {
          const half = groupTax / 2;
          doc.text(`${taxRate / 2}%`, r1X, rt, { width: cgstRateW - 6, align: "right" });
          doc.text(half.toLocaleString("en-IN"), a1X, rt, { width: cgstAmtW - 8, align: "right" });
          doc.text(`${taxRate / 2}%`, r2X, rt, { width: sgstRateW - 6, align: "right" });
          doc.text(half.toLocaleString("en-IN"), a2X, rt, { width: sgstAmtW - 8, align: "right" });
        }
        doc.text(groupTax.toLocaleString("en-IN"), totX, rt, { width: totalW - 8, align: "right" });
        ry += 14;
        hLine(doc, left, right, ry);
      }

      doc.font("Helvetica-Bold").fontSize(8.5).fillColor(DARK);
      const trt = ry + 5;
      doc.text("Total", hX + 4, trt, { width: hsnW - 8 });
      doc.text(taxableSum.toLocaleString("en-IN"), tX, trt, { width: taxableW - 6, align: "right" });
      if (taxType === "igst") {
        doc.text(taxSum.toLocaleString("en-IN"), a1X, trt, { width: cgstAmtW - 8, align: "right" });
      } else {
        const half = taxSum / 2;
        doc.text(half.toLocaleString("en-IN"), a1X, trt, { width: cgstAmtW - 8, align: "right" });
        doc.text(half.toLocaleString("en-IN"), a2X, trt, { width: sgstAmtW - 8, align: "right" });
      }
      doc.text(taxSum.toLocaleString("en-IN"), totX, trt, { width: totalW - 8, align: "right" });
      ry += 14;
      hLine(doc, left, right, ry);

      const summaryBottom = ry;
      const summaryCols = taxType === "igst" ? [hX, tX, r1X, a1X, totX, right] : [hX, tX, r1X, a1X, r2X, a2X, totX, right];
      summaryCols.forEach((x) => vLine(doc, x, summaryTop, summaryBottom));
      y = summaryBottom;
    }

    // ---- Tax amount in words + Company PAN ----
    y += 8;
    if (taxAmount > 0) {
      doc.font("Helvetica").fontSize(8.5).fillColor(GRAY).text("Tax Amount (in words) : ", left + 8, y, { continued: true });
      doc.font("Helvetica-Bold").fillColor(DARK).text(amountInWords(taxAmount, currency));
      y = doc.y + 6;
    }
    if (companyPan) {
      doc.font("Helvetica").fontSize(8.5).fillColor(GRAY).text("Company's PAN : ", left + 8, y, { continued: true });
      doc.font("Helvetica-Bold").fillColor(DARK).text(companyPan);
      y = doc.y + 8;
    }
    hLine(doc, left, right, y);

    // ---- Declaration (left) / Bank details (right) ----
    const bankColX = left + fullWidth * 0.55;
    const declTop = y;
    doc.font("Helvetica-Bold").fontSize(8).fillColor(GRAY).text("Declaration", left + 8, y + 6);
    doc.font("Helvetica").fontSize(8).fillColor(DARK).text(
      `*ALL PAYMENT TO BE MADE BY A/C PAYEE CHEQUE IN FAVOUR OF "${resolvedCompanyName.toUpperCase()}".\n*INTEREST RATE @18%P.A ON DELAYED PAYMENT.`,
      left + 8,
      doc.y + 3,
      { width: bankColX - left - 20 }
    );
    const declBottom = doc.y;

    if (bank && (bank.accountHolder || bank.bankName || bank.accountNumber)) {
      doc.font("Helvetica-Bold").fontSize(8).fillColor(GRAY).text("Company's Bank Details", bankColX + 8, declTop + 6);
      doc.font("Helvetica").fontSize(8).fillColor(DARK);
      let by = doc.y + 3;
      if (bank.accountHolder) { doc.text(`A/c Holder's Name : ${bank.accountHolder}`, bankColX + 8, by, { width: right - bankColX - 16 }); by = doc.y + 1; }
      if (bank.bankName) { doc.text(`Bank Name : ${bank.bankName}`, bankColX + 8, by, { width: right - bankColX - 16 }); by = doc.y + 1; }
      if (bank.accountNumber) { doc.text(`A/c No. : ${bank.accountNumber}`, bankColX + 8, by, { width: right - bankColX - 16 }); by = doc.y + 1; }
      if (bank.branch || bank.ifsc) {
        doc.text(
          `Branch & IFS Code : ${[bank.branch, bank.ifsc].filter(Boolean).join(" & ")}`,
          bankColX + 8,
          by,
          { width: right - bankColX - 16 }
        );
      }
    }
    y = Math.max(declBottom, doc.y) + 12;
    hLine(doc, left, right, y);

    const lowerBoxBottom = y;
    vLine(doc, left, wordsTop, lowerBoxBottom);
    vLine(doc, right, wordsTop, lowerBoxBottom);
    vLine(doc, bankColX, declTop, lowerBoxBottom);

    if (notes) {
      y += 6;
      doc.font("Helvetica-Bold").fontSize(8).fillColor(GRAY).text("NOTES", left, y);
      doc.font("Helvetica").fontSize(9).fillColor(DARK).text(notes, left, doc.y + 2, { width: fullWidth });
      y = doc.y + 8;
    }

    // ---- Signature block (bordered box, Tally style) ----
    const sigTop = y;
    const sigBottom = sigTop + 55;
    doc.font("Helvetica").fontSize(8.5).fillColor(GRAY).text("Customer's Seal and Signature", left + 8, sigTop + 6);
    doc.font("Helvetica-Bold").fontSize(9).fillColor(DARK).text(`for ${resolvedCompanyName}`, left, sigTop + 6, {
      width: fullWidth - 8,
      align: "right",
    });
    doc.font("Helvetica").fontSize(8.5).fillColor(GRAY).text("Authorised Signatory", left, sigBottom - 18, {
      width: fullWidth - 8,
      align: "right",
    });
    vLine(doc, left, sigTop, sigBottom);
    vLine(doc, right, sigTop, sigBottom);
    hLine(doc, left, right, sigBottom);

    // ---- Footer ----
    doc.font("Helvetica").fontSize(7.5).fillColor(GRAY).text(
      jurisdiction ? `SUBJECT TO ${jurisdiction.toUpperCase()} JURISDICTION` : "",
      left,
      sigBottom + 8,
      { width: fullWidth, align: "center" }
    );
    doc.text("This is a Computer Generated Invoice", left, doc.y + 2, { width: fullWidth, align: "center" });

    return doc.y;
  }

  return new Promise((resolve, reject) => {
    // Pass 1: draw onto a throwaway document (nothing consumes its output) purely
    // to measure how tall a compact, unstretched invoice comes out.
    const measureDoc = new PDFDocument({ size: "A4", margin: 36 });
    measureDoc.on("data", () => {});
    measureDoc.on("error", reject);
    const compactBottom = drawInvoice(measureDoc, 0);
    measureDoc.end();

    // Leave a small safety margin below the target bottom: PDFKit's own
    // page-break check compares against the bottom margin using the *actual*
    // render pass, which runs slightly differently line-by-line than this
    // measure pass, so landing exactly on the margin can tip a trailing line
    // onto a second page.
    const safetyBuffer = 24;
    const pageBottom = measureDoc.page.height - measureDoc.page.margins.bottom - safetyBuffer;
    const extraStretch = Math.max(0, pageBottom - compactBottom);

    // Pass 2: the real render, stretched to land flush with the bottom margin.
    const doc = new PDFDocument({ size: "A4", margin: 36 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    drawInvoice(doc, extraStretch);
    doc.end();
  });
}
