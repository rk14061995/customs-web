import Quote from "@/models/Quote";
import { createListHandlers } from "@/lib/adminApi";

export const { GET } = createListHandlers(Quote, { createdAt: -1 });
