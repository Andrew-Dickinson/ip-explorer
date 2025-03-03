"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Network, Router, AlertTriangle } from "lucide-react"
import { checkOspfAdvertisement, type OspfLookupResult } from "@/lib/actions/ospf"
import type { IPv4 } from "ipaddr.js"
import {runParallelAction} from "next-server-actions-parallel";

export interface OspfLookupCardProps extends React.ComponentProps<"div"> {
  ipAddress: IPv4
  title?: string
  description?: string
}

const NODE_EXPLORER_PREFIX = "https://node-explorer.andrew.mesh.nycmesh.net/explorer?router=";

export function OspfLookup({
  ipAddress,
  title = "OSPF Advertisement",
  description = "Checks if this IP address is advertised in the OSPF table and which router is advertising it",
  className,
  ...props
}: OspfLookupCardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [lookupResult, setLookupResult] = useState<OspfLookupResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkAdvertisement = async () => {
      try {
        setIsLoading(true)
        const result = await runParallelAction(checkOspfAdvertisement(ipAddress.toString()));
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
  }, [ipAddress])

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
                  <Skeleton className="h-4 w-[80px]" />
                </div>
              </>
            ) : error ? (
              <>
                <div className="h-10 w-10 rounded-full bg-amber-100 flex flex-none items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Error Checking OSPF Table</p>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
              </>
            ) : lookupResult && lookupResult.routerIds.length ? (
              <>
                <div className="h-10 w-10 rounded-full bg-green-100 flex flex-none items-center justify-center">
                  <Network className="h-5 w-5 text-green-600" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Found in the OSPF table</p>
                  <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                    { lookupResult.routerIds.map((routerId) =>
                      <div key={routerId} className="flex items-center gap-1">
                        <Router className="h-3.5 w-3.5"/>
                        <span>
                        Router ID: <a
                          className="font-mono"
                          href={NODE_EXPLORER_PREFIX + routerId}
                          target="_blank"
                        >
                          {routerId}
                        </a>
                      </span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="h-10 w-10 rounded-full bg-red-100 flex flex-none items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Not advertised</p>
                  <p className="text-xs text-muted-foreground">
                    The address <span className="font-mono">{ipAddress.toString()}</span> was not found in
                    the OSPF table. This address is likely not routable on the mesh
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

