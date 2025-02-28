import {describe, expect, it} from "@jest/globals";
import {nnIps} from "@/lib/analyzers/nn-ips";
import {IPv4} from "ipaddr.js";

describe("analyze ips for NN helper function", () => {
  it("handles low NNs", () => {
    expect(nnIps(3)).toEqual({
      addresses: [
        {
          address: IPv4.parse("10.68.0.3"),
          description: "Primary router OSPF address on the WDS bridge",
        },
        {
          address: IPv4.parse("10.69.0.3"),
          description: "Primary router OSPF address on the mesh bridge",
        },
        {
          address: IPv4.parse("10.69.0.103"),
          description: "Secondary router OSPF address on the mesh bridge (not common)",
        },
        {
          address: IPv4.parse("10.69.0.203"),
          description: "Tertiary router OSPF address on the mesh bridge (very rare)",
        },
      ],
      CIDRs: [{
        address: IPv4.parse("10.96.0.193"),
        length: 26,
        activeSubset: [IPv4.parse("10.96.0.198"), IPv4.parse("10.96.0.249")],
        description: "DHCP addresses for this node",
      }],
    })
  })

  it("handles high NNs", () => {
    expect(nnIps(7888)).toEqual({
      addresses: [
        {
          address: IPv4.parse("10.68.78.88"),
          description: "Primary router OSPF address on the WDS bridge",
        },
        {
          address: IPv4.parse("10.69.78.88"),
          description: "Primary router OSPF address on the mesh bridge",
        },
        {
          address: IPv4.parse("10.69.78.188"),
          description: "Secondary router OSPF address on the mesh bridge (not common)",
        },
      ],
      CIDRs: [{
        address: IPv4.parse("10.103.180.1"),
        length: 26,
        activeSubset: [IPv4.parse("10.103.180.6"), IPv4.parse("10.103.180.57")],
        description: "DHCP addresses for this node",
      }],
    })
  })
});