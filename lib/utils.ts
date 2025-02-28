import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import ipaddr, {IPv4, IPv6} from 'ipaddr.js';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


// Function to convert integer to IP address
export function intToIp(int: number): IPv4 {
  const ip = ipaddr.fromByteArray([
    (int >>> 24) & 255,
    (int >>> 16) & 255,
    (int >>> 8) & 255,
    int & 255
  ]);
  if (ip instanceof IPv6) throw Error("Invalid: IPv6");
  return ip;
}