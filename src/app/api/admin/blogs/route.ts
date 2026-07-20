import Blog from "@/models/Blog";
import { createListHandlers } from "@/lib/adminApi";

export const { GET, POST } = createListHandlers(Blog, { createdAt: -1 });
