"use client";
import {IPExplainerExamples} from "@/components/examples";
import {Input} from "@/components/ui/input";
import {IpExplainerCard} from "@/components/ui/ip-explainer";
import React, {useState} from "react";
import {IPv4} from "ipaddr.js";
import {analyzeStatic} from "@/lib/analyzers/static";
import {StaticAnalysisResult} from "@/lib/types";


export default function Home() {
  const [inputAddress, setInputAddress] = useState<string>("");

  let parsedAddress: IPv4 | undefined = undefined;
  let staticResult: StaticAnalysisResult | undefined = undefined;
  try {
    parsedAddress = IPv4.parse(inputAddress);
    staticResult = analyzeStatic(parsedAddress);
  } catch {}

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 w-full items-center sm:items-start">
        <div className="w-full max-w-2xl mx-auto p-6 space-y-6">
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Enter IP address..."
              className="w-full text-lg"
              value={inputAddress}
              onInput={(e: React.ChangeEvent<HTMLInputElement>) => setInputAddress(e.target.value)}
            />
            { staticResult ?
              <IpExplainerCard {...staticResult}/>
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
