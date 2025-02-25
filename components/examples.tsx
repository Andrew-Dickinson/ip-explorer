import {Input} from "@/components/ui/input";
import {IpExplainerCard} from "@/components/ui/ip-explainer";
import {AddressProvenance, AddressType, StaticAddressCategory} from "@/lib/types";


export const IPExplainerExamples = () => {
  return <div className="space-y-4">
    <IpExplainerCard
      addressOctets={["10", "68", "12", "23"]}
      addressProvenance={AddressProvenance.MESH_RFC_1918}
      addressType={AddressType.OSPF_10_68}
      networkNumber={1223}
      routerIndex={0}
    />
    <IpExplainerCard
      addressOctets={["10", "69", "12", "88"]}
      addressProvenance={AddressProvenance.MESH_RFC_1918}
      addressType={AddressType.OSPF_10_69}
      networkNumber={1288}
      routerIndex={1}
    />
    <IpExplainerCard
      addressOctets={["10", "70", "251", "23"]}
      addressProvenance={AddressProvenance.MESH_RFC_1918}
      addressType={AddressType.STATIC_10_70}
      staticAddressCategory={StaticAddressCategory.PTP_251_30}
    />
    <IpExplainerCard
      addressOctets={["10", "96", "160", "182"]}
      addressProvenance={AddressProvenance.MESH_RFC_1918}
      addressType={AddressType.DHCP}
      networkNumber={642}
      dhcpExplainerComponents={["0x60A0B6", "0x00A0B6", "41143", "642"]}
    />
    <IpExplainerCard
      addressOctets={["10", "10", "10", "10"]}
      addressProvenance={AddressProvenance.MESH_RFC_1918}
      addressType={AddressType.STATIC_10_10}
      staticAddressCategory={StaticAddressCategory.ANYCAST}
    />
    <IpExplainerCard
      addressOctets={["199", "167", "59", "3"]}
      addressProvenance={AddressProvenance.MESH_PUBLIC}
      addressType={AddressType.PUBLIC}
      staticAddressCategory={StaticAddressCategory.SN1}
    />
    <IpExplainerCard
      addressOctets={["192", "168", "0", "1"]}
      addressProvenance={AddressProvenance.MEMBER_PRIVATE_RFC_1918}
      addressType={AddressType.MEMBER}
    />
  </div>
}