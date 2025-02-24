import {AddressProvenance, AddressType, StaticAddressCategory} from "@/lib/types";


export const addressProvenanceCIDRs : Record<string, AddressProvenance> = {
  "10.0.0.0/8": AddressProvenance.MESH_RFC_1918,
  "199.167.59.0/24": AddressProvenance.MESH_PUBLIC,
  "199.170.132.0/24": AddressProvenance.MESH_PUBLIC,
  "208.68.5.0/24": AddressProvenance.MESH_PUBLIC,
  "23.158.16.0/24": AddressProvenance.MESH_PUBLIC,
  "192.168.0.0/16": AddressProvenance.MEMBER_PRIVATE_RFC_1918,
};

export const addressTypeCIDRs : Record<string, AddressType> = {
  "10.10.0.0/16": AddressType.STATIC_10_10,
  "10.68.0.0/16": AddressType.OSPF_10_68,
  "10.69.0.0/16": AddressType.OSPF_10_69,
  "10.70.0.0/16": AddressType.STATIC_10_70,
  "10.96.0.0/13": AddressType.DHCP,
  "199.167.59.0/24": AddressType.PUBLIC,
  "199.170.132.0/24":  AddressType.PUBLIC,
  "208.68.5.0/24":  AddressType.PUBLIC,
  "23.158.16.0/24":  AddressType.PUBLIC,
  "192.168.0.0/16":  AddressType.MEMBER,
};

export const staticCategoryCIDRs : Record<string, StaticAddressCategory> = {
  "10.10.10.0/24": StaticAddressCategory.ANYCAST,
  "10.70.71.0/20": StaticAddressCategory.SN1,
  "10.70.70.0/24": StaticAddressCategory.SN1,
  "10.70.88.0/21": StaticAddressCategory.SN3,
  "10.70.96.0/21": StaticAddressCategory.SN10,
  "10.70.104.0/22": StaticAddressCategory.SN11,
  "10.70.112.0/22": StaticAddressCategory.HUB_DHCP,
  "10.70.247.0/24": StaticAddressCategory.VPN,
  "10.70.248.0/24": StaticAddressCategory.VPN,
  "10.70.250.0/24": StaticAddressCategory.VPN,
  "10.70.251.0/24": StaticAddressCategory.PTP_251_30,
  "10.70.253.0/24": StaticAddressCategory.PTP_253_31,
  "10.70.254.0/24": StaticAddressCategory.LOOPBACKS,
};