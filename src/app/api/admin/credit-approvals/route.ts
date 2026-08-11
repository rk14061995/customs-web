import CreditApprovalForm from "@/models/CreditApprovalForm";
import { createListHandlers } from "@/lib/adminApi";

export const { GET, POST } = createListHandlers(CreditApprovalForm, { createdAt: -1 });
