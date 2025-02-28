"use client";
import {IPExplainerExamples} from "@/components/examples";
import {Input} from "@/components/ui/input";
import {IpExplainerCard} from "@/components/ui/cards/ip-explainer";
import React, {useState} from "react";
import {IPv4} from "ipaddr.js";
import {analyzeStatic} from "@/lib/analyzers/static";
import {NNIPsResult, StaticAnalysisResult} from "@/lib/types";
import {Button} from "@/components/ui/button";
import {Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger} from "@/components/ui/sheet";
import {ScrollArea} from "@/components/ui/scroll-area";
import {Lightbulb} from "lucide-react";
import {nnIps} from "@/lib/analyzers/nn-ips";
import {IpsForNN} from "@/components/ui/cards/ips-for-nn";


export default function Home() {
  const [inputAddress, setInputAddress] = useState<string>("");

  let parsedAddress: IPv4 | undefined = undefined;
  let staticResult: StaticAnalysisResult | undefined = undefined;
  let nnIPsResult: NNIPsResult | undefined = undefined;
  try {
    parsedAddress = IPv4.parse(inputAddress);
    staticResult = analyzeStatic(parsedAddress);
    if (staticResult.networkNumber) {
      nnIPsResult = nnIps(staticResult.networkNumber);
    }
  } catch {}

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 w-full items-center sm:items-start">
        <div className="w-full max-w-2xl mx-auto p-6 space-y-6">
          <div className="space-y-4">
            <h2 className={"font-bold text-2xl"}>IP Explorer</h2>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                placeholder="Enter IP address..."
                className="w-full text-lg"
                value={inputAddress}
                onInput={(e: React.ChangeEvent<HTMLInputElement>) => setInputAddress(e.target.value)}
              />
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
            </div>
            { staticResult ?
              <IpExplainerCard {...staticResult}/>
              : <></>
            }
            { staticResult && staticResult.networkNumber && nnIPsResult ?
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
