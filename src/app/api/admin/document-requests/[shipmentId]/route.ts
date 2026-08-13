import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { getAdminSession } from "@/lib/auth";
import DocumentRequest, { type IDocumentRequestItem } from "@/models/DocumentRequest";
import DocumentUpload from "@/models/DocumentUpload";
import "@/models/Shipment";
import "@/models/Customer";
import "@/models/DocumentTemplate";
import "@/models/DocumentUpload";
import { ensureDocumentRequest, setExcludedTemplates } from "@/lib/documentRequests";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ shipmentId: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { shipmentId } = await params;

  try {
    await ensureDocumentRequest(shipmentId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load document request";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  await dbConnect();
  const doc = await DocumentRequest.findOne({ shipment: shipmentId })
    .populate("shipment", "trackingNumber origin destination")
    .populate("customer", "name company email")
    .populate("items.template", "title category")
    .populate("items.upload", "fileName uploadedAt")
    .lean();

  return NextResponse.json(doc);
}

/** Updates which templates are deselected (excluded) for this shipment — everything else stays attached by default. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ shipmentId: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { shipmentId } = await params;
  const { excludedTemplateIds } = (await req.json()) as { excludedTemplateIds?: string[] };
  if (!Array.isArray(excludedTemplateIds)) {
    return NextResponse.json({ error: "excludedTemplateIds must be an array" }, { status: 400 });
  }

  try {
    const doc = await setExcludedTemplates(shipmentId, excludedTemplateIds);
    const populated = await doc.populate([
      { path: "shipment", select: "trackingNumber origin destination" },
      { path: "customer", select: "name company email" },
      { path: "items.template", select: "title category" },
      { path: "items.upload", select: "fileName uploadedAt" },
    ]);
    return NextResponse.json(populated);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update document request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/**
 * Resets every document on this shipment back to "pending" and deletes their uploaded/submitted
 * files — a bulk clear for test data (e.g. everything filled in manually while testing), without
 * touching which templates are attached/excluded.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ shipmentId: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const { shipmentId } = await params;

  const request = await DocumentRequest.findOne({ shipment: shipmentId });
  if (!request) return NextResponse.json({ error: "Document request not found" }, { status: 404 });

  const uploadIds = request.items.map((i: IDocumentRequestItem) => i.upload).filter(Boolean);
  for (const item of request.items) {
    item.status = "pending";
    item.upload = undefined;
  }
  await request.save();
  if (uploadIds.length) await DocumentUpload.deleteMany({ _id: { $in: uploadIds } });

  return NextResponse.json({ success: true, cleared: uploadIds.length });
}
