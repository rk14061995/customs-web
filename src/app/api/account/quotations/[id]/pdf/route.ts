import { NextResponse } from "next/server";
import { buildQuotationPdfFieldsByIdForCustomer } from "@/lib/quotationEmail";
import { generateQuotationPdf } from "@/lib/quotationPdf";
import { getCustomerSession } from "@/lib/customerAuth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await buildQuotationPdfFieldsByIdForCustomer(id, session.customerId);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

  try {
    const pdf = await generateQuotationPdf(result.pdfFields);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Quotation-${result.quoteNumber}.pdf"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate PDF";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
