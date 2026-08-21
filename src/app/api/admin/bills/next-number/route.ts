import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { getAdminSession } from "@/lib/auth";
import { generateBillNumber } from "@/lib/shipmentUtils";

/**
 * Reserves and returns the next sequential bill/invoice number, so the "Add Bill" form can show
 * it (and quote it inside an auto-filled item description) before the bill itself is saved. The
 * bill is later created with this same number — see the POST handler in ../route.ts.
 */
export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const billNumber = await generateBillNumber();
  return NextResponse.json({ billNumber });
}
