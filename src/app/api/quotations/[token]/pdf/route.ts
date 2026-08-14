import { NextResponse } from "next/server";
import { buildQuotationPdfFieldsByToken } from "@/lib/quotationEmail";
import { generateQuotationPdf } from "@/lib/quotationPdf";

/** Public, unauthenticated PDF download for a quotation — gated by an unguessable share token
 * (not the Mongo id) rather than an admin session, so a customer can open it straight from a
 * WhatsApp/email link without logging in. Same pattern as the agreement signing PDF link. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const result = await buildQuotationPdfFieldsByToken(token);
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
