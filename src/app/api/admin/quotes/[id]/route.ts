import Quote from "@/models/Quote";
import { createItemHandlers } from "@/lib/adminApi";

export const { GET, PUT, DELETE } = createItemHandlers(Quote);
