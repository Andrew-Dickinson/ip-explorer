import {IPv4} from "ipaddr.js";

export enum AddressProvenance {
  MESH_RFC_1918 = "Mesh Internal\n(RFC 1918)",
  MESH_PUBLIC = "Mesh Public",
  MEMBER_PRIVATE_RFC_1918 = "Member Private\n(RFC 1918)",
}

export interface ExplainedAddress {
  address: IPv4,
  description: string,
}

export interface ExplainedCIDR {
  address: IPv4,
  length: number,
  activeSubset?: [IPv4, IPv4],
  description: string,
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

export enum PortStatus {
  OPEN= "Open",
  CLOSED = "Closed",
  TIMEOUT = "Timeout"
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

export interface NNIPsResult {
  addresses: ExplainedAddress[];
  CIDRs: ExplainedCIDR[];
}

export interface ActionResult {
  error?: string;
}


type JSONPrimitive = string | number | boolean | null | undefined;

type JSONValue = JSONPrimitive | JSONValue[] | {
  [key: string]: JSONValue;
};

export type JSONCompatible<T> = ( unknown extends T ? never : {
  [P in keyof T]:
  T[P] extends JSONValue ? T[P] :
    T[P] extends NotAssignableToJson ? never :
      JSONCompatible<T[P]>;
});

export type JSONSerializable<T> = JSONCompatible<T> | JSONValue | JSONSerializable<T>[];

export type CallbackFunctionVariadicAnyReturn = (...args: unknown[]) => unknown;

export type NotAssignableToJson =
  | bigint
  | symbol
  | CallbackFunctionVariadicAnyReturn;
