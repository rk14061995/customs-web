import Faq from "@/models/Faq";
import { createItemHandlers } from "@/lib/adminApi";

export const { GET, PUT, DELETE } = createItemHandlers(Faq);
