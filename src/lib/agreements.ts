import crypto from "crypto";
import dbConnect from "@/lib/dbConnect";
import Shipment from "@/models/Shipment";
import Agreement, { type IAgreement } from "@/models/Agreement";
import AgreementTemplate from "@/models/AgreementTemplate";
import "@/models/Customer";

const AGREEMENT_VALIDITY_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Creates (or refreshes) the signing Agreement for a shipment. Safe to call
 * multiple times (e.g. "Renew Link") — reuses the existing token so a
 * previously shared link keeps working. No-ops on an already-signed
 * agreement rather than resetting it back to pending.
 *
 * Does not send any email — admin shares the signing link / PDF manually.
 */
export async function ensureAgreement(shipmentId: string): Promise<IAgreement> {
  await dbConnect();

  const shipment = await Shipment.findById(shipmentId);
  if (!shipment) throw new Error("Shipment not found");

  const existing = await Agreement.findOne({ shipment: shipment._id });
  if (existing?.status === "signed") return existing;

  let template = await AgreementTemplate.findOne();
  if (!template) template = await AgreementTemplate.create({});

  const token = existing?.token ?? crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + AGREEMENT_VALIDITY_MS);

  const agreement = await Agreement.findOneAndUpdate(
    { shipment: shipment._id },
    {
      $set: {
        customer: shipment.customer,
        token,
        status: "pending",
        expiresAt,
        generatedAt: new Date(),
        template: {
          title: template.title,
          forwarderName: template.forwarderName,
          forwarderAddress: template.forwarderAddress,
          subject: template.subject,
          clauses: template.clauses,
          authorizedSignatoryName: template.authorizedSignatoryName,
          authorizedSignatoryDesignation: template.authorizedSignatoryDesignation,
        },
      },
    },
    { upsert: true, new: true, runValidators: true }
  );
  if (!agreement) throw new Error("Failed to create agreement");

  return agreement;
}
