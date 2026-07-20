import Seo from "@/models/Seo";
import { createListHandlers } from "@/lib/adminApi";

export const { GET, POST } = createListHandlers(Seo, { page: 1 });
