import {AddressProvenance, AddressType, StaticAddressCategory, StaticAnalysisResult} from "@/lib/types";
import {IPv4} from "ipaddr.js";
import {addressProvenanceCIDRs, addressTypeCIDRs, staticCategoryCIDRs} from "@/lib/range-lookups";

export function isMeshAddress(address: IPv4) {
  let addressProvenance: AddressProvenance | undefined = undefined;
  for (const cidr in addressProvenanceCIDRs) {
    if (address.match(IPv4.parseCIDR(cidr))){
      addressProvenance = addressProvenanceCIDRs[cidr];
    }
  }
  if (!addressProvenance) return false

  return [AddressProvenance.MESH_RFC_1918, AddressProvenance.MESH_PUBLIC].includes(addressProvenance);
}

export function analyzeStatic(address: IPv4): StaticAnalysisResult {
  let addressProvenance: AddressProvenance | undefined = undefined;
  for (const cidr in addressProvenanceCIDRs) {
    if (address.match(IPv4.parseCIDR(cidr))){
      addressProvenance = addressProvenanceCIDRs[cidr];
    }
  }
  if (addressProvenance === undefined) { throw new Error("Non-mesh address"); }

  let addressType: AddressType | undefined = undefined;
  for (const cidr in addressTypeCIDRs) {
    if (address.match(IPv4.parseCIDR(cidr))){
      addressType = addressTypeCIDRs[cidr];
    }
  }
  if (addressType === undefined) { addressType = AddressType.UNKNOWN; }

  const searchForRouterIndex = [AddressType.OSPF_10_69, AddressType.OSPF_10_68].includes(addressType);

  let networkNumber: number | undefined = undefined;
  let routerIndex: number | undefined = undefined;
  if (searchForRouterIndex) {
    routerIndex = Math.floor(address.octets[3] / 100);
    if (address.octets[2] >= 100) {
      routerIndex = undefined;
      networkNumber = undefined;
    } else {
      networkNumber = address.octets[2] * 100 + address.octets[3] % 100;
    }
  }

  let staticAddressCategory: StaticAddressCategory | undefined = undefined;
  if ([AddressType.STATIC_10_10, AddressType.STATIC_10_70, AddressType.PUBLIC].includes(addressType)) {
    for (const cidr in staticCategoryCIDRs) {
      if (address.match(IPv4.parseCIDR(cidr))){
        staticAddressCategory = staticCategoryCIDRs[cidr];
      }
    }
    if (staticAddressCategory === undefined ) { staticAddressCategory = StaticAddressCategory.UNKNOWN;}
  }

  let dhcpExplainerComponents: string[] | undefined = undefined;
  if (addressType === AddressType.DHCP) {
    const numericAddress = address.toByteArray().reduce((int, byte) => int * 256 + byte, 0) >>> 0;
    const dhcpComponentNumeric = numericAddress - 0xA000000;
    const dhcpOffset = dhcpComponentNumeric - 0x600000;
    networkNumber = Math.floor(dhcpOffset / 64);
    dhcpExplainerComponents = [
      "0x" + dhcpComponentNumeric.toString(16).toUpperCase(),
      "0x" + dhcpOffset.toString(16).padStart(6, "0").toUpperCase(),
      dhcpOffset.toString(),
      networkNumber.toString(),
    ];
  }

  return {
    addressOctets: address.octets
      .map((oct, i) => i == 3 && searchForRouterIndex ? (oct % 100).toString().padStart(2, "0") : oct)
      .map((oct) => oct.toString()),
    addressProvenance,
    addressType,
    networkNumber,
    routerIndex,
    staticAddressCategory,
    dhcpExplainerComponents,
  }
}