"use server"

import type { OspfLookupResult } from '@/lib/actions/ospf'
import {IPv4} from "ipaddr.js";
import {analyzeStatic} from "@/lib/analyzers/static";
import {get_dhcp_match} from "@/lib/routeros_scripts/get_dhcp_match";
import {SshClient} from "@/lib/ssh-helper";
import {get_bridge_host} from "@/lib/routeros_scripts/get_bridge_hosts_match";


export interface DhcpLeaseInfo {
  ".id"?: string
  address?: string
  comment?: string
  "host-name"?: string
  "last-seen"?: string
  "mac-address"?: string
  server?: string
  status?: string
  "expires-after"?: string
  dynamic?: string
  blocked?: string
  disabled?: string
  [key: string]: string | undefined
}

export interface HostInfo {
  ".id"?: string
  "mac-address"?: string
  vid?: string
  "on-interface"?: string
  bridge?: string
  age?: string
  external?: string
  local?: string
  dynamic?: string
  invalid?: string
  disabled?: string
  [key: string]: string | undefined
}

export interface DhcpLeaseLookupResult {
  success: boolean
  leaseInfo?: DhcpLeaseInfo
  hostInfo?: HostInfo
  error?: string
}

/**
 * Parses RouterOS as-value output into a JavaScript object
 * @param output The as-value output from RouterOS
 * @returns Parsed object with key-value pairs
 */
function parseRouterOsAsValue(output: string): Record<string, string>[] {
  const parsedObjects = [];

  // Split the output by lines and process each line
  const lines = output.split('\n')

  for (const line of lines) {
    // Each line should be valid JSON
    if (line) {
      parsedObjects.push(JSON.parse(line));
    }
  }

  return parsedObjects;
}

/**
 * Looks up DHCP lease information for an IP address by SSH'ing into a router
 * @param ipAddress The IP address to look up
 * @param ospfResult The OSPF lookup result containing the router ID
 * @returns DHCP lease information if found
 */
export async function lookupDhcpLease(
  ipAddress: string,
  ospfResult: OspfLookupResult
): Promise<DhcpLeaseLookupResult> {
  if (!IPv4.isValidFourPartDecimal(ipAddress)) {
    throw new Error("Invalid IP address format")
  }

  // Throws for non-mesh addresses, so we can't be coaxed into
  // sending traffic out of the mesh
  const parsedAddress = IPv4.parse(ipAddress);
  analyzeStatic(parsedAddress);

  // Check if we have a router ID from OSPF
  if (!ospfResult.routerIds.length) {
    return {
      success: false,
      error: "No router ID available from OSPF lookup"
    }
  }
  if (ospfResult.routerIds.length > 1) {
    return {
      success: false,
      error: "RouterOS SSH not available for multicast addresses"
    }
  }

  // Get SSH credentials from environment variables
  const host = ospfResult.routerIds[0]
  const username = process.env.ROUTEROS_SSH_USER
  const password = process.env.ROUTEROS_SSH_PASSWORD

  if (!username || !password) {
    return {
      success: false,
      error: "SSH credentials not configured"
    }
  }

  const sshClient = new SshClient({host, username, password});
  try {
    await sshClient.connect();

    const leaseResults = await sshClient.executeCommand(get_dhcp_match(parsedAddress));
    const leases = parseRouterOsAsValue(leaseResults);

    if (leases.length === 0) {
      return {
        success: false,
        error: "No matching DHCP lease found"
      }
    }

    const hostResults = await sshClient.executeCommand(get_bridge_host(leases[0]["mac-address"]));
    const hosts = parseRouterOsAsValue(hostResults);

    const hostInfo = hosts.length ? hosts[0] : undefined;

    return {
      success: true,
      leaseInfo: leases[0],
      hostInfo,
    }
  } catch (error) {
    return {
      success: false,
      error: `SSH error: ${error instanceof Error ? error.message : String(error)}`,
    }
  } finally {
    sshClient.disconnect();
  }
}

// export const lookupDhcpLease = createParallelAction(lookupDhcpLeaseInner);
