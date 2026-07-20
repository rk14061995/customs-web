import Testimonial from "@/models/Testimonial";
import { createItemHandlers } from "@/lib/adminApi";

export const { GET, PUT, DELETE } = createItemHandlers(Testimonial);
