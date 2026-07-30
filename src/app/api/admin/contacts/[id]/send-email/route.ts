import Contact from "@/models/Contact";
import { createSendEmailHandler } from "@/lib/adminApi";

export const { POST } = createSendEmailHandler(Contact);
