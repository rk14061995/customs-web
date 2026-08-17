import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import Customer from "@/models/Customer";
import { getCustomerSession } from "@/lib/customerAuth";
import { customerPasswordChangeSchema } from "@/lib/validation";

export async function PUT(req: NextRequest) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = customerPasswordChangeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await dbConnect();
  const customer = await Customer.findById(session.customerId).select("+passwordHash");
  if (!customer || !customer.passwordHash) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const valid = await bcrypt.compare(parsed.data.currentPassword, customer.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
  }

  customer.passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await customer.save();
  return NextResponse.json({ success: true });
}
