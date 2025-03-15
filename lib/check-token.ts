"use server"
import {incrementRateCounter} from "@/lib/rate-limits";
import {EndpointName} from "@/lib/constants";


export async function checkToken(token: string, handler: EndpointName) {
  // Check if the request is rate limited
  await incrementRateCounter(handler);

  return token !== process.env.SECURE_CONTENT_TOKEN
}