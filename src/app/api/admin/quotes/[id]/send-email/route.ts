import Quote from "@/models/Quote";
import { createSendEmailHandler } from "@/lib/adminApi";

export const { POST } = createSendEmailHandler(Quote);
