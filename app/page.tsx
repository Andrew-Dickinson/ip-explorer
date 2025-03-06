"use client";
import {IPExplainerExamples} from "@/components/examples";
import {Input} from "@/components/ui/input";
import {IpExplainerCard} from "@/components/cards/ip-explainer";
import React, {useEffect, useState} from "react";
import {IPv4} from "ipaddr.js";
import {analyzeStatic} from "@/lib/analyzers/static";
import {NNIPsResult, StaticAnalysisResult} from "@/lib/types";
import {Button} from "@/components/ui/button";
import {Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger} from "@/components/ui/sheet";
import {ScrollArea} from "@/components/ui/scroll-area";
import {ArrowRight, Ban, Lightbulb, RefreshCcw} from "lucide-react";
import {nnIps} from "@/lib/analyzers/nn-ips";
import {IpsForNN} from "@/components/cards/ips-for-nn";
import {IcmpReachability} from "@/components/cards/icmp-reachability";
import {Card, CardContent} from "@/components/ui/card";
import {TcpConnectivity} from "@/components/cards/tcp-connectivity";
import {SnmpInfo} from "@/components/cards/snmp-info";
import {OspfLookup} from "@/components/cards/ospf-lookup";
import {UispLookup} from "@/components/cards/uisp-lookup";
import {IpRangesIps} from "@/components/cards/ip-ranges-ips";
import {IpRangesHosts} from "@/components/cards/ip-ranges-hosts";
import {DnsLookup} from "@/components/cards/dns-lookup";
import {checkOspfAdvertisement, OspfLookupResult} from "@/lib/actions/ospf";
import {runParallelAction} from "next-server-actions-parallel";

const TCP_PORTS_TO_SCAN = [22, 80, 443];

export default function Home() {
  const [inputAddress, setInputAddress] = useState<string>("");
  const inputAddressValid = IPv4.isValidFourPartDecimal(inputAddress);

  const [parsedAddress, setParsedAddress] = useState<IPv4 | null>();

  const [staticResult, setStaticResult] = useState<StaticAnalysisResult | null>();
  const [nnIPsResult, setNnnIPsResult] = useState<NNIPsResult | null>();

  const [ospfQueryLoading, setIsLoading] = useState(true)
  const [ospfLookupResult, setLookupResult] = useState<OspfLookupResult | null>(null)
  const [ospfError, setError] = useState<string | null>(null)

  useEffect(() => {
    if (parsedAddress) {
      try {
          const res = analyzeStatic(parsedAddress);
          if (res.networkNumber) {
            setNnnIPsResult(nnIps(res.networkNumber));
          }
          setStaticResult(res);
      } catch {}

      const checkAdvertisement = async () => {
        try {
          setIsLoading(true)
          const result = await runParallelAction(checkOspfAdvertisement(parsedAddress.toString()));
          setLookupResult(result)
          setError(null)
        } catch (err) {
          setError(err instanceof Error ? err.message : "Unknown error")
          setLookupResult(null)
        } finally {
          setIsLoading(false)
        }
      }

    checkAdvertisement()
  }
  }, [parsedAddress]);

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen pb-20 sm:px-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 w-full items-center sm:items-start">
        <div className="w-full max-w-2xl mx-auto p-6 space-y-6">
          <div className="space-y-4">
            <h2 className={"font-bold text-2xl"}><img src={"NYC_mesh_logo.svg"} className={"h-10 inline mr-1 -mt-1"}/> NYC Mesh <span className={"font-normal"}>|</span> <span className={"font-normal"}>IP Explorer</span></h2>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                placeholder="Enter IP address..."
                className="text-lg max-w-md"
                value={inputAddress}
                onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setInputAddress(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && inputAddressValid) setParsedAddress(IPv4.parse(inputAddress));
                }}
              />
              <Button variant={"default"}
                      icon={!inputAddressValid || inputAddress !== parsedAddress?.toString() ? ArrowRight : RefreshCcw}
                      disabled={!inputAddressValid}
                      onClick={() => setParsedAddress(IPv4.parse(inputAddress))}/>
            </div>
            {
              parsedAddress && staticResult?.addressProvenance !== undefined ?
                <>
                  <IcmpReachability
                    ipAddress={parsedAddress}
                  />
                  <TcpConnectivity
                    ipAddress={parsedAddress}
                    ports={TCP_PORTS_TO_SCAN}
                  />
                  <DnsLookup ipAddress={parsedAddress}/>
                  <SnmpInfo ipAddress={parsedAddress}/>
                  <OspfLookup ipAddress={parsedAddress}
                              isLoading={ospfQueryLoading}
                              lookupResult={ospfLookupResult}
                              error={ospfError}/>
                  <UispLookup ipAddress={parsedAddress} />
                  <IpRangesIps ipAddress={parsedAddress}/>
                  <IpRangesHosts ipAddress={parsedAddress}/>
                </>
                :
                <></>
            }
            {
              !parsedAddress &&
              <Sheet>
                <SheetTrigger asChild><Button variant={"secondary"} icon={Lightbulb}>Examples</Button></SheetTrigger>
                <SheetContent className="w-[100vw] sm:max-w-2xl">
                  <SheetHeader>
                    <SheetTitle>Address Breakdown Examples</SheetTitle>
                  </SheetHeader>
                  <ScrollArea className="h-full">
                    <div className="max-w-[590px] mx-auto">
                      <IPExplainerExamples/>
                    </div>
                  </ScrollArea>
                </SheetContent>
              </Sheet>
            }
            { staticResult ?
              <IpExplainerCard {...staticResult}/>
              :
              parsedAddress && <Card className={"max-w-lg"}>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-5">
                            <div
                                className="h-10 w-10 rounded-full bg-red-100 flex flex-none items-center justify-center">
                                <Ban className="h-5 w-5 text-red-600"/>
                            </div>
                            <div className="space-y-1">
                                <p className="font-medium">Invalid Address</p>
                                <p className="text-xs text-muted-foreground">
                                    This doesn&#39;t look like a valid NYC Mesh IP address. Please check that the entered address is correct and try again
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
                </Card>
            }
            {staticResult && staticResult.networkNumber && nnIPsResult ?
              <IpsForNN
                networkNumber={staticResult.networkNumber}
                addresses={nnIPsResult.addresses}
                CIDRs={nnIPsResult.CIDRs}
              />
              :
              <></>
            }
          </div>
        </div>
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">

      </footer>
    </div>
  );
}
