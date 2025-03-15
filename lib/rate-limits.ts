import { LRUCache } from 'lru-cache';
import {EndpointName} from "@/lib/constants";
import {headers} from "next/headers";


export const rateLimitsByEndpoint: Record<EndpointName, number> = {
  [EndpointName.UISP]: 20,
  [EndpointName.IP_RANGES_HOSTS]: 20,
  [EndpointName.IP_RANGES_RANGES]: 20,
  [EndpointName.ROUTEROS_SSH_DHCP]: 20,
  [EndpointName.ICMP_PING]: 20,
  [EndpointName.TCP_SCAN]: 20,
  [EndpointName.SNMP_QUERY]: 20,
  [EndpointName.REVERSE_DNS]: 20,
  [EndpointName.OSPF_LOOKUP]: 20,
};

const limitPeriodMs = 5 * 60 * 1000; // 5 minutes
const rateLimitCache = new LRUCache({
  max: 1000, // Maximum number of items to store, represents the max number of unique IPs per period
  ttl: limitPeriodMs
});


export async function incrementRateCounter(handler: EndpointName) {
  const headersList = await headers()
  const ip = headersList.get("x-forwarded-for") || "127.0.0.1"

  const identifier = `${handler}-${ip}`;
  const currentCount = (rateLimitCache.get(identifier) as number || 0) + 1;
  rateLimitCache.set(identifier, currentCount);

  const limit = rateLimitsByEndpoint[handler];
  if (currentCount > limit) {
    throw new Error(
        `Rate limit of ${limit} invocations per ${limitPeriodMs}ms exceeded against ${handler} for ${ip}`
    );
  }
}