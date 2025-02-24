
export enum AddressProvenance {
  MESH_RFC_1918 = "Mesh Internal\n(RFC 1918)",
  MESH_PUBLIC = "Mesh Public",
  MEMBER_PRIVATE_RFC_1918 = "Member Private\n(RFC 1918)",
}

export enum AddressType {
  OSPF_10_68 = "10.68 OSPF\n(WDS Bridge)",
  OSPF_10_69 = "10.69 OSPF\n(Mesh Bridge)",
  STATIC_10_70 = "10.70 Static",
  STATIC_10_10 = "10.10 Core Services",
  DHCP = "10.96 - 10.103 DHCP\n(Mesh Bridge)",
  PUBLIC = "Publicly Routable",
  MEMBER = "Member LAN",
  UNKNOWN = "Unknown",
}

export enum StaticAddressCategory {
  SN1 = "Supernode 1",
  SN3 = "Supernode 3",
  SN10 = "Supernode 10 (POP 10)",
  SN11 = "Supernode 11 (POP 11)",
  HUB_DHCP = "Hub Supplemental DHCP",
  VPN = "VPN Infra",
  PTP_251_30 = "PtPs Sized /30",
  PTP_253_31 = "PtPs Sized /31",
  LOOPBACKS = "Router Loopbacks",
  ANYCAST = "Anycast",
  UNKNOWN = "Unknown",
}


export interface StaticAnalysisResult {
  addressOctets: string[];
  addressProvenance: AddressProvenance;
  addressType: AddressType;
  networkNumber?: number;
  routerIndex?: number;
  dhcpExplainerComponents?: string[];
  staticAddressCategory?: StaticAddressCategory;
}