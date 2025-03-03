"use server"

import { IPv4, parseCIDR } from "ipaddr.js"
import {createParallelAction} from "next-server-actions-parallel";

const OSPF_ENDPOINT= "https://api.andrew.mesh.nycmesh.net/api/v1/mesh_ospf_data.json";

export interface OspfLookupResult {
  routerIds: string[]
}

interface OspfData {
  areas: {
    [areaId: string]: {
      networks: {
        [cidr: string]: {
          dr: string
          routers: string[]
        }
      }
      routers: {
        [routerId: string]: {
          links: {
            external?: Array<{ id: string; metric: number; via?: string }>
            router?: Array<{ id: string; metric: number }>
            network?: Array<{ id: string; metric: number }>
            stubnet?: Array<{ id: string; metric: number }>
          }
        }
      }
    }
  }
}

/**
 * Checks if an IP address is advertised in the OSPF table
 * @param ipAddress The IP address to check
 * @returns Object containing information about the advertisement
 */
async function checkOspfAdvertisementInner(ipAddress: string): Promise<OspfLookupResult> {
  try {
    // Validate IP address format
    if (!IPv4.isValidFourPartDecimal(ipAddress)) {
      throw new Error("Invalid IP address format")
    }

    const ip = IPv4.parse(ipAddress)

    // Fetch OSPF data
    const response = await fetch(OSPF_ENDPOINT, {
      next: { revalidate: 60 }, // Cache for 1 minute (the update frequency of the API)
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch OSPF data: ${response.status} ${response.statusText}`)
    }

    const ospfData: OspfData = await response.json()

    const hits: { routerId: string, cidr: string }[] = [];

    const area = ospfData.areas["0.0.0.0"];

    // First check networks
    for (const cidr in area.networks) {
      const [networkAddr, prefixLength] = parseCIDR(cidr)
      if (ip.match(networkAddr, prefixLength)) {
        hits.push({routerId: area.networks[cidr].dr, cidr});
      }
    }

    // Then check router advertisements
    for (const routerId in area.routers) {
      const router = area.routers[routerId]

      // Check external links
      const routerLinks: Array<{ id: string; metric: number }> = [
        ...router.links.external ?? [],
        ...router.links.stubnet ?? []
      ];

      for (const link of routerLinks) {
        // Skip default route
        if (link.id === "0.0.0.0/0") continue

        try {
          const [networkAddr, prefixLength] = parseCIDR(link.id)
          if (ip.match(networkAddr, prefixLength)) {
            hits.push({routerId, cidr: link.id });
          }
        } catch {}
      }
    }

    if (hits.length == 0) {
      return {routerIds: []}
    }

    // We need to determine the "most specific" route that exists to the requested address,
    // and only return router IDs that match that specificity, in order to not spew meaningless
    // garbage for 10.69/16 addresses
    const longestPrefix = hits
      .map((hit) => parseCIDR(hit.cidr)[1])
      .reduce((a, b) => Math.max(a, b), 0);

    return {
      routerIds: hits.filter((hit) => parseCIDR(hit.cidr)[1] === longestPrefix)
        .map((hit) => hit.routerId)
    }
  } catch (error) {
    console.error("Error checking OSPF advertisement:", error)
    throw error
  }
}

export const checkOspfAdvertisement = createParallelAction(checkOspfAdvertisementInner);
