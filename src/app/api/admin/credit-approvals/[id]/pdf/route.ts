import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import CreditApprovalForm, { type ICreditApprovalForm } from "@/models/CreditApprovalForm";
import { getAdminSession } from "@/lib/auth";
import { generateCreditApprovalPdf } from "@/lib/creditApprovalPdf";
import { getSettings } from "@/lib/queries";
import { siteConfig } from "@/lib/data";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const { id } = await params;

  const form = await CreditApprovalForm.findById(id).lean<ICreditApprovalForm>();
  if (!form) return NextResponse.json({ error: "Credit approval form not found" }, { status: 404 });

  const settings = await getSettings();
  const resolved = settings ?? siteConfig;
  const companyPhone = resolved.alternatePhone ? `${resolved.phone} / ${resolved.alternatePhone}` : resolved.phone;
  const companyName = "siteName" in resolved ? resolved.siteName : resolved.name;

  const pdf = await generateCreditApprovalPdf({
    companyName,
    companyAddress: resolved.address,
    companyPhone,
    customerName: form.customerName,
    directorName: form.directorName,
    panNumber: form.panNumber,
    registeredAddress: form.registeredAddress,
    invoiceAddress: form.invoiceAddress,
    businessContactPerson: form.businessContactPerson,
    financeContactPerson: form.financeContactPerson,
    phone: form.phone,
    projectedMonthlyRevenue: form.projectedMonthlyRevenue,
    creditTermDays: form.creditTermDays,
    specialInstructions: form.specialInstructions,
    proposedBySalesman: form.proposedBySalesman,
    supportedByDirector: form.supportedByDirector,
    authorizedByFinanceDirector: form.authorizedByFinanceDirector,
    status: form.status,
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="credit-approval-${id}.pdf"`,
    },
  });
}
