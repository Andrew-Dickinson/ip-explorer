import {IPv4} from "ipaddr.js";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import React from "react";
import {ExplainedAddress, ExplainedCIDR} from "@/lib/types";
import {intToIp} from "@/lib/utils";

export interface IpsForNNProps extends React.ComponentProps<"div"> {
  networkNumber: number;
  addresses: ExplainedAddress[];
  CIDRs?: ExplainedCIDR[];
}

export function IpsForNN({
  networkNumber,
  addresses,
  CIDRs,
className,
...props}: IpsForNNProps) {
  return <Card
        className={className + " gap-3"}
      {...props}>
      <CardHeader>
        <CardTitle>Expected Addresses for NN{networkNumber}</CardTitle>
      <CardDescription className={"text-xs"}>
        Shows all the IP addresses that we&#39;d expect to find at this network number
        (based on mesh convention, these may not actually be in use)
      </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap">
          {
            addresses.map((addr) => {
              return <div key={addr.address.toString()} className="w-full md:w-1/2 w-min-50 mb-3 last:mb-0">
                <div className="grid gap-1">
                  <span className="font-bold font-mono">{addr.address.toString()}</span>
                  <p className="text-sm text-muted-foreground">{addr.description}</p>
                </div>
              </div>
            })
          }
          {
            CIDRs ? CIDRs.map((addr) => {
              const cidr = addr.address.toString() + "/" + addr.length;
              const networkAddress = IPv4.networkAddressFromCIDR(cidr).toByteArray().reduce((int, byte) => int * 256 + byte, 0) >>> 0;
              const broadcastAddress = IPv4.broadcastAddressFromCIDR(cidr).toByteArray().reduce((int, byte) => int * 256 + byte, 0) >>> 0;
              const firstAddress = intToIp(networkAddress + 1);
              const lastAddress = intToIp(broadcastAddress - 1);
              return <div key={cidr} className="w-full md:w-1/2 w-min-50 mb-3 last:mb-0">
                <div className="grid gap-1">
                  <div className="grid">
                    <span className="font-mono">
                      <span className="font-bold">{addr.address.toString()}</span><span className="text-muted-foreground">/{addr.length}</span>
                    </span>
                    <span className="text-xs font-mono">{firstAddress.toString()} - {lastAddress.toString()}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {addr.description}.
                    { addr.activeSubset ?
                      <> For Omnis, its likely only <span className="font-mono">{addr.activeSubset[0].toString()} - {addr.activeSubset[1].toString()}</span> are actually used</>
                      : <></>
                    }
                  </p>
                </div>
              </div>
              })
              : <></>
          }
        </div>
      </CardContent>
  </Card>;
}
