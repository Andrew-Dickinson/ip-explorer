"use server"

import {createParallelAction} from "next-server-actions-parallel";
import {incrementRateCounter} from "@/lib/rate-limits";
import {EndpointName} from "@/lib/constants";

async function getTokenInner(password: string): Promise<string | undefined> {
  // Throws if the rate limit is exceeded, gives the user "unknown error" which is not ideal
  // but probably fine
  await incrementRateCounter(EndpointName.GET_TOKEN);

  if (!process.env.SECURE_CONTENT_PSK || !process.env.SECURE_CONTENT_TOKEN) {
    throw new Error(`SECURE_CONTENT_PSK or SECURE_CONTENT_TOKEN is missing from env vars`);

  }

  if (password === process.env.SECURE_CONTENT_PSK) {
    return process.env.SECURE_CONTENT_TOKEN;
  }
}

export const getToken = createParallelAction(getTokenInner);
