"use server"

import {checkOspfAdvertisementInner} from '@/lib/actions/ospf'
import {IPv4} from "ipaddr.js";
import {analyzeStatic} from "@/lib/analyzers/static";
import {get_dhcp_match} from "@/lib/routeros_scripts/get_dhcp_match";
import {SshClient} from "@/lib/ssh-helper";
import {get_bridge_host} from "@/lib/routeros_scripts/get_bridge_hosts_match";
import {createParallelAction} from "next-server-actions-parallel";
import {ActionResult} from "@/lib/types";
import {checkToken} from "@/lib/check-token";
import {EndpointName} from "@/lib/constants";


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

export interface DhcpLeaseLookupResult extends ActionResult {
  connectionSuccess: boolean
  leaseInfo?: DhcpLeaseInfo
  hostInfo?: HostInfo
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
 * @param token The authentication token to access this endpoint
 * @returns DHCP lease information if found
 */
export async function lookupDhcpLeaseInner(
  ipAddress: string,
  token: string,
): Promise<DhcpLeaseLookupResult> {
  // Validate token (and do rate limiting)
  try {
    if (await checkToken(token, EndpointName.ROUTEROS_SSH_DHCP)) {
      return {connectionSuccess: false, invalidToken: true};
    }
  } catch {
    return {connectionSuccess: false, rateLimit: true};
  }

  if (!IPv4.isValidFourPartDecimal(ipAddress)) {
    throw new Error("Invalid IP address format")
  }

  // Throws for non-mesh addresses, so we can't be coaxed into
  // sending traffic out of the mesh
  const parsedAddress = IPv4.parse(ipAddress);
  analyzeStatic(parsedAddress);

  // Do our own lookup of the OSPF router that advertises this IP, so the frontend can't lie to us
  const ospfResult =  await checkOspfAdvertisementInner(ipAddress);

  // Check if we have a router ID from OSPF
  if (ospfResult.routerIds.length === 0) {
    return {
      connectionSuccess: false,
      error: "No router ID available from OSPF lookup"
    }
  }
  if (ospfResult.routerIds.length > 1) {
    return {
      connectionSuccess: false,
      error: "RouterOS SSH not available for multicast addresses"
    }
  }

  // Get SSH credentials from environment variables
  const host = ospfResult.routerIds[0]

  //Validate that the host corresponds to a valid IPv4 address
  if (!IPv4.isValidFourPartDecimal(host)) {
    throw new Error("Invalid Router ID format")
  }

  // Throws for non-mesh addresses, so we can't be coaxed into
  // sending traffic out of the mesh
  const parsedHostAddr = IPv4.parse(host);
  analyzeStatic(parsedHostAddr);

  const username = process.env.ROUTEROS_SSH_USER
  const password = process.env.ROUTEROS_SSH_PASSWORD

  if (!username || !password) {
    return {
      connectionSuccess: false,
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
        connectionSuccess: true,
        error: "No matching DHCP lease found"
      }
    }

    const hostResults = await sshClient.executeCommand(get_bridge_host(leases[0]["mac-address"]));
    const hosts = parseRouterOsAsValue(hostResults);

    const hostInfo = hosts.length ? hosts[0] : undefined;

    return {
      connectionSuccess: true,
      leaseInfo: leases[0],
      hostInfo,
    }
  } catch (error) {
    if (error instanceof Error && 'level' in error) {
      return {
        connectionSuccess: false,
        error: `SSH error connecting to ${host}. Maybe this is not a RouterOS device, it has non-standard credentials, 
        or is not set up to allow such connections?`,
      }
    }
    console.error(error);
    return {
      connectionSuccess: false,
      error: `Unknown error, check logs for more info`,
    }
  } finally {
    sshClient.disconnect();
  }
}

export const lookupDhcpLease = createParallelAction(lookupDhcpLeaseInner);
