import Team from "@/models/Team";
import { createListHandlers } from "@/lib/adminApi";

export const { GET, POST } = createListHandlers(Team, { order: 1 });
