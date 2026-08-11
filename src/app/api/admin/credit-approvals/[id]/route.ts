import CreditApprovalForm from "@/models/CreditApprovalForm";
import { createItemHandlers } from "@/lib/adminApi";

export const { GET, PUT, DELETE } = createItemHandlers(CreditApprovalForm);
