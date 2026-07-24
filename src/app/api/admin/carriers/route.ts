import Carrier from "@/models/Carrier";
import { createListHandlers } from "@/lib/adminApi";

export const { GET, POST } = createListHandlers(Carrier, { createdAt: -1 });
