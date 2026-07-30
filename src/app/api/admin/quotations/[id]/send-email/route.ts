import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { buildQuotationEmail } from "@/lib/quotationEmail";
import { sendCustomerConfirmationEmail } from "@/lib/mail";
import { generateQuotationPdf } from "@/lib/quotationPdf";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await buildQuotationEmail(id);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

  try {
    const pdfBuffer = await generateQuotationPdf(result.emailFields);
    await sendCustomerConfirmationEmail({
      to: result.to,
      subject: result.subject,
      html: result.html,
      attachments: [
        {
          filename: `Quotation-${result.quoteNumber}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
