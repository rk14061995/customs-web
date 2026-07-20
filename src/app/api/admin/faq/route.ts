import Faq from "@/models/Faq";
import { createListHandlers } from "@/lib/adminApi";

export const { GET, POST } = createListHandlers(Faq, { order: 1 });
