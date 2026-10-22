import type { ApiClient } from "@/api/types";
import { liveClient } from "@/api/client";

export const api: ApiClient = liveClient;
export type { ApiClient } from "@/api/types";
