"use client";
import {IPExplainerExamples} from "@/components/examples";
import {Input} from "@/components/ui/input";
import {IpExplainerCard} from "@/components/cards/ip-explainer";
import React, {useState} from "react";
import {IPv4} from "ipaddr.js";
import {analyzeStatic} from "@/lib/analyzers/static";
import {NNIPsResult, StaticAnalysisResult} from "@/lib/types";
import {Button} from "@/components/ui/button";
import {Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger} from "@/components/ui/sheet";
import {ScrollArea} from "@/components/ui/scroll-area";
import {ArrowRight, Ban, Lightbulb} from "lucide-react";
import {nnIps} from "@/lib/analyzers/nn-ips";
import {IpsForNN} from "@/components/cards/ips-for-nn";
import {IcmpReachability} from "@/components/cards/icmp-reachability";
import {Card, CardContent} from "@/components/ui/card";
import {TcpConnectivity} from "@/components/cards/tcp-connectivity";
import {SnmpInfo} from "@/components/cards/snmp-info";
import {OspfLookup} from "@/components/cards/ospf-lookup";
import {UispLookup} from "@/components/cards/uisp-lookup";
import {IpRangeLookup} from "@/components/cards/ip-range-lookup";


export default function Home() {
  const [inputAddress, setInputAddress] = useState<string>("");
  const [analysisAddress, setAnalysisAddress] = useState<string>("");

  const addressValid = IPv4.isValidFourPartDecimal(inputAddress);
  let parsedAddress: IPv4 | undefined = undefined;
  let staticResult: StaticAnalysisResult | undefined = undefined;
  let nnIPsResult: NNIPsResult | undefined = undefined;

  const showResults = inputAddress && inputAddress == analysisAddress;
  if (showResults) {
    try {
      parsedAddress = IPv4.parse(analysisAddress);
      staticResult = analyzeStatic(parsedAddress);
      if (staticResult.networkNumber) {
        nnIPsResult = nnIps(staticResult.networkNumber);
      }
    } catch {
    }
  }

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
                  setAnalysisAddress("");
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && addressValid) setAnalysisAddress(inputAddress);
                }}
              />
              <Button variant={"default"}
                      icon={ArrowRight}
                      disabled={!addressValid}
                      onClick={() => setAnalysisAddress(inputAddress)}/>
            </div>
            {
              parsedAddress !== undefined && staticResult?.addressProvenance !== undefined ?
                <>
                  <IcmpReachability
                    ipAddress={parsedAddress}
                  />
                  <TcpConnectivity
                    ipAddress={parsedAddress}
                    ports={[22, 80, 443]}
                  />
                  <SnmpInfo ipAddress={parsedAddress}/>
                  <OspfLookup ipAddress={parsedAddress}/>
                  <UispLookup ipAddress={parsedAddress} />
                  <IpRangeLookup ipAddress={parsedAddress}/>
                </>
                :
                <></>
            }
            {
              !showResults &&
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
              showResults && <Card className={"max-w-lg"}>
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
