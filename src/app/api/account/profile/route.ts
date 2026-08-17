import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Customer from "@/models/Customer";
import { getCustomerSession } from "@/lib/customerAuth";
import { customerProfileSchema } from "@/lib/validation";

export async function GET() {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const customer = await Customer.findById(session.customerId).lean();
  if (!customer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(customer);
}

export async function PUT(req: NextRequest) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = customerProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await dbConnect();
  // Email is deliberately not editable here — it's the stable login identifier.
  const customer = await Customer.findByIdAndUpdate(session.customerId, parsed.data, {
    new: true,
    runValidators: true,
  });
  if (!customer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(customer);
}
