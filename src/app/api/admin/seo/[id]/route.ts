import Seo from "@/models/Seo";
import { createItemHandlers } from "@/lib/adminApi";

export const { GET, PUT, DELETE } = createItemHandlers(Seo);
