import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Customer from "@/models/Customer";
import WalletTransaction from "@/models/WalletTransaction";
import { getCustomerSession } from "@/lib/customerAuth";

export async function GET() {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const [customer, transactions] = await Promise.all([
    Customer.findById(session.customerId).select("walletBalance").lean<{ walletBalance: number }>(),
    WalletTransaction.find({ customer: session.customerId }).sort({ createdAt: -1 }).limit(100).lean(),
  ]);
  if (!customer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({ balance: customer.walletBalance, transactions });
}
