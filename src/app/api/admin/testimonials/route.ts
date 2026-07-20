import Testimonial from "@/models/Testimonial";
import { createListHandlers } from "@/lib/adminApi";

export const { GET, POST } = createListHandlers(Testimonial, { createdAt: -1 });
