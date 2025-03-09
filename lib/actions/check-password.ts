"use server"

import {createParallelAction} from "next-server-actions-parallel";

async function checkPasswordInner(password: string): Promise<boolean> {
  // Basic rate-limiting feature for bare minimum against brute force
  await new Promise(resolve => setTimeout(resolve, 1500));

  return password === process.env.SECURE_CONTENT_PSK;
}

export const checkPassword = createParallelAction(checkPasswordInner);
