"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {Clock, ArrowUpDown, Activity, AlertTriangle} from "lucide-react"
import {checkIcmpReachability} from "@/lib/actions/ping"
import {IPv4} from "ipaddr.js";
import {useNextParallelDataAction} from "@/lib/hooks/use-next-data-action";

export interface IcmpReachabilityCardProps extends React.ComponentProps<"div"> {
  ipAddress: IPv4
  title?: string
  description?: string
  lastRefresh: Date
}

export function IcmpReachability({
  ipAddress,
  title = "ICMP Reachability",
  description = "Shows ping results and latency for this IP address (from Supernode 3 & 10)",
  className,
  lastRefresh,
  ...props
}: IcmpReachabilityCardProps) {
  const [pingResult, isLoading, error] = useNextParallelDataAction(
    checkIcmpReachability,
    [ipAddress.toString()],
    lastRefresh,
    !!ipAddress?.toString()
  );

  return (
    <Card className={className} {...props}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isLoading ? (
              <>
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[180px]" />
                </div>
              </>
            ) : error ? (
              <>
                <div className="h-10 w-10 rounded-full bg-amber-100 flex flex-none items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Error Determining Reachability</p>
                  <p className="text-sm text-muted-foreground">{error.message}</p>
                </div>
              </>
            ) : pingResult?.pingData?.reachable ? (
              <>
                <div className="h-10 w-10 rounded-full bg-green-100 flex flex-none items-center justify-center">
                  <ArrowUpDown className="h-5 w-5 text-green-600" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Host is reachable</p>
                  <div className="flex items-center gap-5 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5"/>
                      <span className="font-mono">{pingResult.pingData.averageLatency?.toFixed(2)} ms</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Activity className="h-3.5 w-3.5"/>
                      <span className="font-mono">{(pingResult.pingData.packetLoss * 100).toFixed(0)}% loss</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="h-10 w-10 rounded-full bg-red-100 flex flex-none items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600"/>
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Host is unreachable</p>
                  <p className="text-xs text-muted-foreground">
                    No response received for multiple ICMP requests to <span className={"font-mono"}>
                    {ipAddress.toString()}</span>. The host corresponding to this address could be
                    non-existent, powered off, disconnected from the rest of the mesh, or configured
                    to ignore ICMP traffic
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

