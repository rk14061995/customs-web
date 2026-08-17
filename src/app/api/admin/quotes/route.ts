import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Quote, { type IQuote } from "@/models/Quote";
import "@/models/Customer";
import type { ICustomer } from "@/models/Customer";
import { getAdminSession } from "@/lib/auth";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const docs = await Quote.find()
    .sort({ createdAt: -1 })
    .populate("customer", "name email")
    .lean<(Omit<IQuote, "customer"> & { customer: ICustomer | null })[]>();

  // Flattened to a plain string so the generic SubmissionsManager table (which just does
  // String(row[col.key])) can render it without knowing about populated refs.
  const withCustomerLabel = docs.map(({ customer, ...doc }) => ({
    ...doc,
    customerLabel: customer ? `Registered: ${customer.name}` : "",
  }));
  return NextResponse.json(withCustomerLabel);
}
