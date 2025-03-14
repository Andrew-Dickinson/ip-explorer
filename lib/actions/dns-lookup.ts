"use server"

import { IPv4 } from "ipaddr.js"
import { analyzeStatic } from "@/lib/analyzers/static"
import dns from "dns"
import {createParallelAction} from "next-server-actions-parallel";
import {ActionResult} from "@/lib/types";


const MESH_AUTHORITATIVE_DNS_SERVER_ADDRESS = "23.158.16.23";

const resolver = new dns.Resolver();
resolver.setServers([MESH_AUTHORITATIVE_DNS_SERVER_ADDRESS]);
//
// // Create promisified versions of the DNS functions
// const reverse = promisify(resolver.reverse);


export interface DnsLookupResult extends ActionResult {
  hostnames: string[]
  success: boolean
}

/**
 * Performs a reverse DNS lookup for an IP address using the internal resolver
 * @param ipAddress The IP address to look up
 * @returns Object containing the hostname if found
 */
export async function performReverseDnsLookupInner(ipAddress: string): Promise<DnsLookupResult> {
  if (!IPv4.isValidFourPartDecimal(ipAddress)) {
    throw new Error("Invalid IP address format")
  }

  // Throws for non-mesh addresses, so we can't be coaxed into
  // sending traffic out of the mesh
  analyzeStatic(IPv4.parse(ipAddress))


  try {
    const hostnamesPromise = new Promise<string[]>((resolve, reject) => {
      resolver.reverse(ipAddress, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      })
    });

    return {
      hostnames: await hostnamesPromise,
      success: true,
    }
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === "ENOTFOUND") {
      return { success: true, hostnames: [] };
    }

    console.error("DNS lookup error:", error)
    return { success: false, hostnames: [], error: "DNS lookup error, check logs for more info" };
  }
}


export const performReverseDnsLookup = createParallelAction(performReverseDnsLookupInner);
