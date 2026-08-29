"use server";

import { serverEnv } from "@/lib/server/environment";

export async function getOperationMode() {
  return serverEnv.SYNERGYBRIDGE_OPERATION_MODE;
}
