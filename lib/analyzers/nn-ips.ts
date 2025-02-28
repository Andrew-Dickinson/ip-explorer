import {ExplainedAddress, NNIPsResult} from "@/lib/types";
import {IPv4} from "ipaddr.js";

const DHCP_PREFIX_LENGTH = 26;
const POOL_START_REL = 6;
const POOL_END_REL = 57;
export const THRID_IP_CUTOFF = 55;

export function nnIps(networkNumber: number): NNIPsResult {
  const routerDHCPIP = IPv4.parse(`10.${96 + (networkNumber >> 10)}.${(networkNumber >> 2) & 255}.${(((networkNumber & 3) << 6) + 1)}`);

  const dhcpPoolStart = IPv4.parse(`10.${96 + (networkNumber >> 10)}.${(networkNumber >> 2) & 255}.${(((networkNumber & 3) << 6) + POOL_START_REL)}`);
  const dhcpPoolEnd = IPv4.parse(`10.${96 + (networkNumber >> 10)}.${(networkNumber >> 2) & 255}.${(((networkNumber & 3) << 6) + POOL_END_REL)}`);

  const otherAddresses: ExplainedAddress[] = [];

  const nnFirstPart = Math.floor(networkNumber / 100);
  const nnSecondPart = networkNumber % 100;

  otherAddresses.push({  address: IPv4.parse(`10.68.${nnFirstPart}.${nnSecondPart}`), description: "Primary router OSPF address on the WDS bridge" });
  otherAddresses.push({  address: IPv4.parse(`10.69.${nnFirstPart}.${nnSecondPart}`), description: "Primary router OSPF address on the mesh bridge" });
  otherAddresses.push({  address: IPv4.parse(`10.69.${nnFirstPart}.1${nnSecondPart.toString().padStart(2, '0')}`), description: "Secondary router OSPF address on the mesh bridge (not common)" });

  if (nnSecondPart <= THRID_IP_CUTOFF) otherAddresses.push({  address: IPv4.parse(`10.69.${nnFirstPart}.2${nnSecondPart.toString().padStart(2, '0')}`), description: "Tertiary router OSPF address on the mesh bridge (very rare)" });

  return {
    addresses: otherAddresses,
    CIDRs: [
        {  address: routerDHCPIP,
          length: DHCP_PREFIX_LENGTH,
          description: "DHCP addresses for this node",
          activeSubset: [dhcpPoolStart, dhcpPoolEnd],
        },
    ]
  }
}