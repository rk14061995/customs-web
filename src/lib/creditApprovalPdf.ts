import PDFDocument from "pdfkit";

const NAVY = "#0b3c91";
const GRAY = "#64748b";
const DARK = "#1f2937";
const BORDER = "#94a3b8";

type Row = { label: string; value?: string };

function drawRow(
  doc: PDFKit.PDFDocument,
  row: Row,
  x: number,
  y: number,
  labelW: number,
  fullW: number
): number {
  doc.font("Helvetica").fontSize(9.5).fillColor(DARK).text(row.label, x + 8, y + 7, { width: labelW - 16 });
  doc.font("Helvetica-Bold").fontSize(10).fillColor(DARK).text(row.value || "", x + labelW + 8, y + 7, {
    width: fullW - labelW - 16,
  });
  const rowH = Math.max(doc.y - y, 24);
  return y + rowH + 4;
}

export function generateCreditApprovalPdf({
  companyName,
  companyAddress,
  companyPhone,
  customerName,
  directorName,
  panNumber,
  registeredAddress,
  invoiceAddress,
  businessContactPerson,
  financeContactPerson,
  phone,
  projectedMonthlyRevenue,
  creditTermDays,
  specialInstructions,
  proposedBySalesman,
  supportedByDirector,
  authorizedByFinanceDirector,
  status,
}: {
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  customerName: string;
  directorName?: string;
  panNumber?: string;
  registeredAddress?: string;
  invoiceAddress?: string;
  businessContactPerson?: string;
  financeContactPerson?: string;
  phone?: string;
  projectedMonthlyRevenue?: string;
  creditTermDays?: number;
  specialInstructions?: string;
  proposedBySalesman?: string;
  supportedByDirector?: string;
  authorizedByFinanceDirector?: string;
  status: string;
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
    doc.fillColor(DARK).font("Helvetica-Bold").fontSize(12).text("CREDIT APPROVAL FORM", left, y, {
      width: fullWidth,
      underline: true,
    });
    y = doc.y + 16;

    // ---- Details box ----
    const boxTop = y;
    const labelW = fullWidth * 0.38;
    const rows: Row[] = [
      { label: "Customer Name:", value: customerName },
      { label: "Director/Proprietor's Name:", value: directorName },
      { label: "Business Registration Number/PAN:", value: panNumber },
      { label: "Registered Office Address:", value: registeredAddress },
      { label: "Address for Invoice or Correspondence:", value: invoiceAddress || "Same as above" },
      { label: "Business Contact Person:", value: businessContactPerson },
      { label: "Finance Contact Person:", value: financeContactPerson },
      { label: "General Main Line Phone Number:", value: phone },
      { label: "Projected Monthly Revenue:", value: projectedMonthlyRevenue },
      { label: "Credit Terms:", value: "7 Days, 30 Days" },
      { label: "Credit Limit:", value: creditTermDays ? `${creditTermDays} days` : undefined },
      { label: "Special Instructions:", value: specialInstructions },
      { label: "Status:", value: status.toUpperCase() },
    ];

    for (const row of rows) {
      y = drawRow(doc, row, left, y, labelW, fullWidth);
      doc.strokeColor(BORDER).lineWidth(0.5).moveTo(left, y - 2).lineTo(right, y - 2).stroke();
    }

    doc.strokeColor(BORDER).lineWidth(1).rect(left, boxTop, fullWidth, y - boxTop - 4).stroke();
    doc.strokeColor(BORDER).lineWidth(0.5).moveTo(left + labelW, boxTop).lineTo(left + labelW, y - 4).stroke();

    y += 24;

    if (y > doc.page.height - 200) {
      doc.addPage();
      y = doc.page.margins.top;
    }

    // ---- Approval signatures ----
    doc.font("Helvetica-Bold").fontSize(10).fillColor(GRAY).text("APPROVAL SIGNATURES", left, y);
    y = doc.y + 16;

    const sigColW = fullWidth / 2 - 15;
    const sigRightX = left + fullWidth / 2 + 15;

    const drawSignatureLine = (title: string, name2: string | undefined, x: number, rowY: number) => {
      doc.font("Helvetica").fontSize(9).fillColor(GRAY).text(title, x, rowY);
      doc.strokeColor(BORDER).lineWidth(0.75).moveTo(x, rowY + 30).lineTo(x + sigColW, rowY + 30).stroke();
      doc.font("Helvetica").fontSize(9).fillColor(DARK).text(`Name: ${name2 || "______________________"}`, x, rowY + 34, {
        width: sigColW,
      });
      doc.text("Signature: ______________________", x, doc.y + 3, { width: sigColW });
      return doc.y;
    };

    let rowY = y;
    let bottom1 = drawSignatureLine("Proposed by (Salesman)", proposedBySalesman, left, rowY);
    let bottom2 = drawSignatureLine(`For ${name}`, undefined, sigRightX, rowY);
    rowY = Math.max(bottom1, bottom2) + 24;

    bottom1 = drawSignatureLine("Supported by (Director)", supportedByDirector, left, rowY);
    bottom2 = drawSignatureLine("Authorized by (Director – Finance)", authorizedByFinanceDirector, sigRightX, rowY);
    y = Math.max(bottom1, bottom2) + 24;

    // ---- Footer ----
    if (companyAddress) {
      doc.strokeColor(BORDER).lineWidth(0.5).moveTo(left, y).lineTo(right, y).stroke();
      y += 8;
      doc.font("Helvetica").fontSize(8).fillColor(GRAY).text(
        `Office address: ${companyAddress}${companyPhone ? `  Mob. ${companyPhone}` : ""}`,
        left,
        y,
        { width: fullWidth }
      );
    }

    doc.end();
  });
}
