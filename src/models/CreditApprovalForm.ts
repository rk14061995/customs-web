import { Schema, model, models, Types, type Document } from "mongoose";

export const CREDIT_APPROVAL_STATUSES = ["pending", "approved", "rejected"] as const;

export interface ICreditApprovalForm extends Document {
  customer?: Types.ObjectId;
  customerName: string;
  directorName?: string;
  panNumber?: string;
  registeredAddress?: string;
  invoiceAddress?: string;
  businessContactPerson?: string;
  financeContactPerson?: string;
  phone?: string;
  projectedMonthlyRevenue?: string;
  creditTermDays?: number;
  specialInstructions?: string;
  proposedBySalesman?: string;
  supportedByDirector?: string;
  authorizedByFinanceDirector?: string;
  status: (typeof CREDIT_APPROVAL_STATUSES)[number];
  createdAt: Date;
  updatedAt: Date;
}

const CreditApprovalFormSchema = new Schema<ICreditApprovalForm>(
  {
    customer: { type: Schema.Types.ObjectId, ref: "Customer" },
    customerName: { type: String, required: true },
    directorName: { type: String },
    panNumber: { type: String },
    registeredAddress: { type: String },
    invoiceAddress: { type: String },
    businessContactPerson: { type: String },
    financeContactPerson: { type: String },
    phone: { type: String },
    projectedMonthlyRevenue: { type: String },
    creditTermDays: { type: Number, default: 30 },
    specialInstructions: { type: String },
    proposedBySalesman: { type: String },
    supportedByDirector: { type: String },
    authorizedByFinanceDirector: { type: String },
    status: { type: String, enum: CREDIT_APPROVAL_STATUSES, default: "pending" },
  },
  { timestamps: true }
);

export default models.CreditApprovalForm ||
  model<ICreditApprovalForm>("CreditApprovalForm", CreditApprovalFormSchema);
