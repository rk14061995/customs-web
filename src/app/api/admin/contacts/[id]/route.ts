import Contact from "@/models/Contact";
import { createItemHandlers } from "@/lib/adminApi";

export const { GET, PUT, DELETE } = createItemHandlers(Contact);
