import Customer from "@/models/Customer";
import { createListHandlers } from "@/lib/adminApi";

export const { GET, POST } = createListHandlers(Customer, { createdAt: -1 });
