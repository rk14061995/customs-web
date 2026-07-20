import Contact from "@/models/Contact";
import { createListHandlers } from "@/lib/adminApi";

export const { GET } = createListHandlers(Contact, { createdAt: -1 });
