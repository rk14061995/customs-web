import Service from "@/models/Service";
import { createListHandlers } from "@/lib/adminApi";

export const { GET, POST } = createListHandlers(Service, { order: 1 });
