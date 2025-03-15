"use server"

import {createParallelAction} from "next-server-actions-parallel";

async function getTokenInner(password: string): Promise<string | undefined> {
  // Basic rate-limiting feature for bare minimum against brute force
  await new Promise(resolve => setTimeout(resolve, 1500));

  if (!process.env.SECURE_CONTENT_PSK || !process.env.SECURE_CONTENT_TOKEN) {
    throw new Error(`SECURE_CONTENT_PSK or SECURE_CONTENT_TOKEN is missing from env vars`);

  }

  if (password === process.env.SECURE_CONTENT_PSK) {
    return process.env.SECURE_CONTENT_TOKEN;
  }
}

export const getToken = createParallelAction(getTokenInner);
