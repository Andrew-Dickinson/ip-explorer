"use client"
import { IPExplainerExamples } from "@/components/examples"
import { Input } from "@/components/ui/input"
import { IpExplainerCard } from "@/components/cards/ip-explainer"
import React, {useEffect, useRef, useState, useMemo, useCallback} from "react"
import { IPv4 } from "ipaddr.js"
import { analyzeStatic } from "@/lib/analyzers/static"
import { AddressType } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import {ArrowRight, Ban, Lightbulb, RefreshCcw} from "lucide-react"
import { SiGithub } from "@icons-pack/react-simple-icons"
import { IpsForNN } from "@/components/cards/ips-for-nn"
import { IcmpReachability } from "@/components/cards/icmp-reachability"
import { Card, CardContent } from "@/components/ui/card"
import { TcpConnectivity } from "@/components/cards/tcp-connectivity"
import { SnmpInfo } from "@/components/cards/snmp-info"
import { OspfLookup } from "@/components/cards/ospf-lookup"
import { UispLookup } from "@/components/cards/uisp-lookup"
import { IpRangesIps } from "@/components/cards/ip-ranges-ips"
import { IpRangesHosts } from "@/components/cards/ip-ranges-hosts"
import { DnsLookup } from "@/components/cards/dns-lookup"
import { checkOspfAdvertisement } from "@/lib/actions/ospf"
import { DhcpLeaseLookup } from "@/components/cards/routeros-info"
import styles from "../masonry.module.css"
import {useNextParallelDataAction} from "@/lib/hooks/use-next-data-action";
import {useUrlState} from "@/lib/hooks/use-url-state";

const TCP_PORTS_TO_SCAN = [22, 80, 443]

export default function Home() {
  const [inputAddress, setInputAddress] = useState<string>("")
  const inputAddressValid = IPv4.isValidFourPartDecimal(inputAddress)

  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // undefined = default value inside useUrlState (we haven't checked the address bar yet)
  // null = we checked the address bar and it was invalid or empty
  const [parsedAddress, setParsedAddress] = useUrlState<IPv4 | null>({
    paramName: "query",
    serializer: useCallback((addr) => addr?.toString() ?? "", []),
    deserializer: useCallback((str) => str ? (IPv4.isValidFourPartDecimal(str) ? IPv4.parse(str) : null) : null, [])
  });

  // Keep the text box in sync with the browser bar on page load
  useEffect(() => {
    if (parsedAddress) {
      setInputAddress(parsedAddress.toString())
    }
  }, [parsedAddress]);

  const staticResult = useMemo(
    () => {
      try {
        return parsedAddress ? analyzeStatic(parsedAddress) : undefined
      } catch {
        return undefined
      }
    },
    [parsedAddress]
  );

  const [ospfLookupResult, ospfQueryLoading, ospfError] = useNextParallelDataAction(
    checkOspfAdvertisement,
    [parsedAddress?.toString() ?? ""],
    lastRefresh
  );

  const masonryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!masonryRef.current || !parsedAddress) return

    const updateMasonryHeight = () => {
      const container = masonryRef.current
      if (!container) return

      const items = container.querySelectorAll<HTMLElement>(`.${styles.masonryItem}`)
      if (!items.length) return

      let columns = 1
      if (window.innerWidth >= 2200) columns = 4  // ~4xl
      else if (window.innerWidth >= 1636) columns = 3 // ~3xl
      else if (window.innerWidth >= 1024) columns = 2  // ~lg

      let maxHeight = 0
      let currentCol = 0
      const colHeights = Array(columns).fill(0)

      items.forEach((item) => {
        // Find the column with the smallest height
        currentCol = colHeights.indexOf(Math.min(...colHeights))

        // Position the item
        item.style.position = "absolute"
        item.style.top = `${colHeights[currentCol]}px`
        item.style.left = `${(100 / columns) * currentCol}%`
        item.style.width = `${100 / columns - 2}%`

        // Update the height of the current column
        colHeights[currentCol] += item.offsetHeight + 16 // 16px for margin

        // Update the max height
        maxHeight = Math.max(maxHeight, colHeights[currentCol])
      })

      // Set the container height
      container.style.height = `${maxHeight}px`
      container.style.position = "relative"
    }

    // Initial update
    setTimeout(updateMasonryHeight, 100)

    // Update on window resize
    window.addEventListener("resize", updateMasonryHeight)

    // Update when content changes
    const observer = new MutationObserver(updateMasonryHeight)
    observer.observe(masonryRef.current, { childList: true, subtree: true })

    return () => {
      window.removeEventListener("resize", updateMasonryHeight)
      observer.disconnect()
    }
  }, [parsedAddress, staticResult, ospfLookupResult])

  // If we haven't yet parsed the query address from the browser bar,
  // keep the page blank to avoid a flicker of the search bar in the center of the page
  if (parsedAddress === undefined) return <></>

  return (
    <div className={"min-h-screen flex flex-col"}>
    <div
      className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center px-0 md:px-20 lg:px-0 font-[family-name:var(--font-geist-sans)] flex-1">
      <main className="flex flex-col gap-8 row-start-2 w-full items-center sm:items-start">
        <div className="w-full mx-auto p-6 space-y-6 max-w-2xl lg:max-w-none">
          <div className="space-y-4">
            <div className={"mr-9 mb-8"}>
              <div className="space-y-4 mx-auto max-w-[500px]">
                <h2 className={"font-bold text-2xl"}>
                  <img src={"NYC_Mesh_logo.svg"} alt={"NYC Mesh Logo"} className="h-10 inline mr-1 -mt-1"/> NYC Mesh{" "}
                  <span className={"font-normal"}>|</span> <span className={"font-normal"}>IP Explorer</span>
                </h2>
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    placeholder="Enter IP address..."
                    className="text-lg max-w-md"
                    value={inputAddress}
                    onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setInputAddress(e.target.value)
                      if (e.target.value === "") {
                        setParsedAddress(null)
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && inputAddressValid) {
                        setLastRefresh(new Date());
                        setParsedAddress(IPv4.parse(inputAddress))
                      }
                    }}
                  />
                  <Button
                    variant={"default"}
                    icon={!inputAddressValid || inputAddress !== parsedAddress?.toString() ? ArrowRight : RefreshCcw}
                    disabled={!inputAddressValid}
                    onClick={() => {
                      setLastRefresh(new Date())
                      setParsedAddress(IPv4.parse(inputAddress))
                    }}
                  />
                </div>
                {!parsedAddress && (
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant={"secondary"} icon={Lightbulb}>
                        Examples
                      </Button>
                    </SheetTrigger>
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
                )}
              </div>
            </div>
            {parsedAddress && (
              <div className={styles.masonry} style={{height: "auto", maxHeight: "none"}} ref={masonryRef}>
                {parsedAddress && staticResult ? (
                  <div className={styles.masonryItem}>
                    <IpExplainerCard {...staticResult} />
                  </div>
                ) : (
                  parsedAddress && (
                    <div className={styles.masonryItem}>
                      <Card className={"max-w-lg"}>
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
                                  This doesn&#39;t look like a valid NYC Mesh IP address. Please check that the entered
                                  address is correct and try again
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )
                )}
                {parsedAddress && staticResult?.addressProvenance !== undefined ? (
                  <>
                    <div className={styles.masonryItem}>
                      <OspfLookup
                        ipAddress={parsedAddress}
                        isLoading={ospfQueryLoading}
                        lookupResult={ospfLookupResult}
                        error={ospfError}
                      />
                    </div>
                    <div className={styles.masonryItem}>
                      <UispLookup ipAddress={parsedAddress} lastRefresh={lastRefresh} />
                    </div>
                    <div className={styles.masonryItem}>
                      <IcmpReachability ipAddress={parsedAddress} lastRefresh={lastRefresh}/>
                    </div>
                    <div className={styles.masonryItem}>
                      <TcpConnectivity ipAddress={parsedAddress} ports={TCP_PORTS_TO_SCAN} lastRefresh={lastRefresh}/>
                    </div>
                    <div className={styles.masonryItem}>
                      <DnsLookup ipAddress={parsedAddress} lastRefresh={lastRefresh}/>
                    </div>
                    <div className={styles.masonryItem}>
                      <SnmpInfo ipAddress={parsedAddress} lastRefresh={lastRefresh}/>
                    </div>
                    <div className={styles.masonryItem}>
                      <IpRangesIps ipAddress={parsedAddress} lastRefresh={lastRefresh}/>
                    </div>
                    <div className={styles.masonryItem}>
                      <IpRangesHosts ipAddress={parsedAddress} lastRefresh={lastRefresh}/>
                    </div>
                    {ospfLookupResult?.routerIds.length === 1 &&
                    [AddressType.STATIC_10_70, AddressType.DHCP].includes(staticResult.addressType) ? (
                      <div className={styles.masonryItem}>
                        <DhcpLeaseLookup ipAddress={parsedAddress} ospfResult={ospfLookupResult} lastRefresh={lastRefresh}/>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <></>
                )}
                {parsedAddress && staticResult && staticResult.networkNumber ? (
                  <div className={styles.masonryItem}>
                    <IpsForNN
                      networkNumber={staticResult.networkNumber}
                    />
                  </div>
                ) : (
                  <></>
                )}
              </div>
            )
            }
          </div>
        </div>
      </main>
    </div>
  <footer className="w-full py-6 border-t bg-gray-50 dark:bg-gray-900 flex-none">
    <div className="container mx-auto px-4 max-w-[1000px]">
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
        <div className="flex flex-wrap gap-4 justify-center md:justify-start">
          <span>Other projects: </span>
          <a
            href="https://node-explorer.andrew.mesh.nycmesh.net/"
            className="mt-0.5 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            Node Explorer
          </a>
          <a
            href="https://node-explorer.andrew.mesh.nycmesh.net/outage-analyzer"
            className="mt-0.5 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            Outage Simulator
          </a>
          <a
            href="http://api.andrew.mesh/api/v1/mesh_ospf_data.json"
            className="mt-0.5 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            OSPF API v1
          </a>
          <a
            href="http://api.andrew.mesh/api/v2/mesh_ospf_data.json"
            className="mt-0.5 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            OSPF API v2
          </a>
          <a
            href="http://api.andrew.mesh/api/v2/ospf-event-stream/viewer.html"
            className="mt-0.5 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            OSPF Event Feed
          </a>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="https://github.com/Andrew-Dickinson/ip-explorer"
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            target="_blank"
            rel="noopener noreferrer"
          >
            <SiGithub size={16}/>
            <span>Source Code</span>
          </a>
          {process.env.NEXT_PUBLIC_GIT_COMMIT_SHA && (
            <span className={"mt-0.5 text-xs text-gray-500 dark:text-gray-500"}>
              (<a
                href={`https://github.com/Andrew-Dickinson/ip-explorer/commit/${process.env.NEXT_PUBLIC_GIT_COMMIT_SHA}`}
                className="hover:text-gray-700 dark:hover:text-gray-300"
                target="_blank"
                rel="noopener noreferrer"
                >{process.env.NEXT_PUBLIC_GIT_COMMIT_SHA.substring(0, 7)}</a>
              )
            </span>
          )}
        </div>
      </div>
    </div>
  </footer>
  </div>
)
}

