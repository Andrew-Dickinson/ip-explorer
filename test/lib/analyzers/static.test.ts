import {analyzeStatic} from '@/lib/analyzers/static'
import {describe, expect, it} from "@jest/globals";
import {IPv4} from "ipaddr.js";
import {AddressProvenance, AddressType, StaticAddressCategory} from "../../../lib/types";

describe("analyze static helper function", () => {
  it("handles OSPF addresses", () => {
    expect(analyzeStatic(IPv4.parse("10.69.12.34"))).toEqual({
      addressOctets: ["10", "69", "12", "34"],
      addressProvenance: AddressProvenance.MESH_RFC_1918,
      addressType: AddressType.OSPF_10_69,
      networkNumber: 1234,
      routerIndex: 0,
    })
  })

  it("handles invalid OSPF addresses", () => {
    expect(analyzeStatic(IPv4.parse("10.69.112.34"))).toEqual({
      addressOctets: ["10", "69", "112", "34"],
      addressProvenance: AddressProvenance.MESH_RFC_1918,
      addressType: AddressType.OSPF_10_69,
    })
  })

  it("handles WDS addresses", () => {
    expect(analyzeStatic(IPv4.parse("10.68.12.88"))).toEqual({
      addressOctets: ["10", "68", "12", "88"],
      addressProvenance: AddressProvenance.MESH_RFC_1918,
      addressType: AddressType.OSPF_10_68,
      networkNumber: 1288,
      routerIndex: 0,
    })
  })

  it("handles OSPF addresses for secondary routers", () => {
    expect(analyzeStatic(IPv4.parse("10.69.12.134"))).toEqual({
      addressOctets: ["10", "69", "12", "34"],
      addressProvenance: AddressProvenance.MESH_RFC_1918,
      addressType: AddressType.OSPF_10_69,
      networkNumber: 1234,
      routerIndex: 1,
    })
    expect(analyzeStatic(IPv4.parse("10.69.12.234"))).toEqual({
      addressOctets: ["10", "69", "12", "34"],
      addressProvenance: AddressProvenance.MESH_RFC_1918,
      addressType: AddressType.OSPF_10_69,
      networkNumber: 1234,
      routerIndex: 2,
    })
  })

  it("handles 10.x static addresses", () => {
    expect(analyzeStatic(IPv4.parse("10.10.10.10"))).toEqual({
      addressOctets: ["10", "10", "10", "10"],
      addressProvenance: AddressProvenance.MESH_RFC_1918,
      addressType: AddressType.STATIC_10_10,
      staticAddressCategory: StaticAddressCategory.ANYCAST,
    })
    expect(analyzeStatic(IPv4.parse("10.70.251.234"))).toEqual({
      addressOctets: ["10", "70", "251", "234"],
      addressProvenance: AddressProvenance.MESH_RFC_1918,
      addressType: AddressType.STATIC_10_70,
      staticAddressCategory: StaticAddressCategory.PTP_251_30,
    })
    expect(analyzeStatic(IPv4.parse("10.70.8.234"))).toEqual({
      addressOctets: ["10", "70", "8", "234"],
      addressProvenance: AddressProvenance.MESH_RFC_1918,
      addressType: AddressType.STATIC_10_70,
      staticAddressCategory: StaticAddressCategory.UNKNOWN,
    })
  })

  it("handles 192.168.x addresses", () => {
    expect(analyzeStatic(IPv4.parse("192.168.0.1"))).toEqual({
      addressOctets: ["192", "168", "0", "1"],
      addressProvenance: AddressProvenance.MEMBER_PRIVATE_RFC_1918,
      addressType: AddressType.MEMBER
    })
  })

  it("handles Public addresses", () => {
    expect(analyzeStatic(IPv4.parse("199.167.59.3"))).toEqual({
      addressOctets: ["199", "167", "59", "3"],
      addressProvenance: AddressProvenance.MESH_PUBLIC,
      addressType: AddressType.PUBLIC,
      staticAddressCategory: StaticAddressCategory.SN1,
    })
  })

  it("handles DHCP addresses", () => {
    expect(analyzeStatic(IPv4.parse("10.96.160.182"))).toEqual({
      addressOctets: ["10", "96", "160", "182"],
      addressProvenance: AddressProvenance.MESH_RFC_1918,
      addressType: AddressType.DHCP,
      networkNumber: 642,
      dhcpExplainerComponents: ["0x60A0B6", "0x00A0B6", "41142", "642"],
    })
  })


  it("handles unknown 10.x addresses", () => {
    expect(analyzeStatic(IPv4.parse("10.9.160.182"))).toEqual({
      addressOctets: ["10", "9", "160", "182"],
      addressProvenance: AddressProvenance.MESH_RFC_1918,
      addressType: AddressType.UNKNOWN,
    })
  })


})

