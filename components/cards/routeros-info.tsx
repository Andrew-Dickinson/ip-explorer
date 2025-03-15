"use client"

import type React from "react"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertTriangle,
  Clock,
  Server,
  Calendar,
  Activity,
  FileText,
  EthernetPort, ChevronsLeftRightEllipsis, Shrink, SquarePen
} from "lucide-react"
import { lookupDhcpLease } from "@/lib/actions/routeros-ssh"
import type { OspfLookupResult } from "@/lib/actions/ospf"
import type { IPv4 } from "ipaddr.js"
import {TOKEN_STORAGE_KEY} from "@/lib/constants";
import {useLocalStorage} from "@/lib/hooks/use-local-storage";
import {SecureCard} from "@/components/cards/secure-card";
import {useNextParallelDataAction} from "@/lib/hooks/use-next-data-action";

export interface DhcpLeaseLookupCardProps extends React.ComponentProps<"div"> {
  ipAddress: IPv4
  ospfResult: OspfLookupResult
  title?: string
  description?: string
  lastRefresh: Date
}

export function DhcpLeaseLookup({
  ipAddress,
  ospfResult,
  title = "RouterOS DHCP Lease Lookup",
  description = "Retrieves DHCP lease information from RouterOS devices",
  className,
  lastRefresh,
  ...props
}: DhcpLeaseLookupCardProps) {
  const secureContentToken = useLocalStorage<string>(TOKEN_STORAGE_KEY)[0];

  // Only proceed if we have a router ID from OSPF
  // if (ospfResult.routerIds.length !== 1) {
  //   setError("No router ID available from OSPF lookup")
  //   setLookupResult(null)
  //   return
  // }

  const [lookupResult, isLoading, error] = useNextParallelDataAction(
    lookupDhcpLease,
    [ipAddress.toString(), ospfResult, secureContentToken ?? ""],
    lastRefresh,
    !!ipAddress?.toString() && !!secureContentToken
  );

  // if (!result.connectionSuccess) {
  //   setError(result.error || "SSH Connection Failed")
  // } else {
  //   setError(null)
  // }

  return (
    <SecureCard title={title} description={description} className={className} {...props}>
        {isLoading ? (
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-[80px]" />
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-100 flex flex-none items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">Error Retrieving Lease</p>
              <p className="text-sm text-muted-foreground">{error.message}</p>
            </div>
          </div>
        ) : lookupResult && lookupResult.connectionSuccess && lookupResult.leaseInfo ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex flex-none items-center justify-center">
                <SquarePen className="h-5 w-5 text-green-600"/>
              </div>
              <div className="space-y-1">
                <p className="font-medium">DHCP Lease Found</p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-mono">{ipAddress.toString()}</span> is leased to{" "}
                  <span className="font-medium">
                    {lookupResult.leaseInfo["host-name"] || lookupResult.leaseInfo["mac-address"] || "Unknown Device"}
                  </span>
                  {" "}on router{" "}
                  <span className="font-mono">
                    {ospfResult.routerIds[0]}
                  </span>
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 ml-13">
              <InfoTag icon={ChevronsLeftRightEllipsis} label="MAC Address" value={lookupResult.leaseInfo["mac-address"]}/>
              <InfoTag icon={Server} label="Hostname" value={lookupResult.leaseInfo["host-name"]}/>
              <InfoTag icon={Activity} label="Status" value={lookupResult.leaseInfo.status}/>
              <InfoTag icon={Clock} label="Expires After" value={lookupResult.leaseInfo["expires-after"]}/>
              <InfoTag icon={Calendar} label="Last Seen" value={lookupResult.leaseInfo["last-seen"]}/>
              <InfoTag icon={Server} label="DHCP Server" value={lookupResult.leaseInfo.server}/>

              { lookupResult.hostInfo ?
                <>
                  <InfoTag icon={Shrink} label="Bridge" value={lookupResult.hostInfo.bridge}/>
                  <InfoTag icon={EthernetPort} label="Interface" value={lookupResult.hostInfo["on-interface"]}/>
                </>
                : null
              }
              <InfoTag icon={FileText} label="Comment" value={lookupResult.leaseInfo.comment}/>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gray-100 flex flex-none items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-gray-600" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">No Lease Found</p>
              <p className="text-xs text-muted-foreground">
                We succesfully connected to a RouterOS device at{" "}
                <span className={"font-mono"}>{ospfResult.routerIds[0]}</span>, but no DHCP lease  was found for
                <span className="font-mono">{ipAddress.toString()}</span>. This IP might be statically assigned
                or not currently active.
              </p>
            </div>
          </div>
        )}
    </SecureCard>
  )
}

interface InfoTagProps {
  icon: React.ElementType
  label: string
  value?: string
}

function InfoTag({ icon: Icon, label, value }: InfoTagProps) {
  if (!value) return null

  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{value}</p>
      </div>
    </div>
  )
}

