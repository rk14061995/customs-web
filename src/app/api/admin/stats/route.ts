import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getAdminStats } from "@/lib/queries";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const stats = await getAdminStats();
  return NextResponse.json(stats);
}
