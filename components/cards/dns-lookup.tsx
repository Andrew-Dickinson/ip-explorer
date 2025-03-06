"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {AlertTriangle, Globe} from "lucide-react"
import { performReverseDnsLookup, type DnsLookupResult } from "@/lib/actions/dns-lookup"
import type { IPv4 } from "ipaddr.js"

export interface DnsLookupCardProps extends React.ComponentProps<"div"> {
  ipAddress: IPv4
  title?: string
  description?: string
}

export function DnsLookup({
  ipAddress,
  title = "DNS Lookup",
  description = "Shows reverse DNS lookup results for this IP address",
  className,
  ...props
}: DnsLookupCardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [dnsResult, setDnsResult] = useState<DnsLookupResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const lookupHostname = async () => {
      try {
        setIsLoading(true)
        const result = await performReverseDnsLookup(ipAddress.toString())
        setDnsResult(result)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
        setDnsResult(null)
      } finally {
        setIsLoading(false)
      }
    }

    lookupHostname()
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
                <div className="h-10 w-10 rounded-full bg-red-100 flex flex-none items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Error Performing DNS Lookup</p>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
              </>
            ) : dnsResult && dnsResult.hostnames.length > 0 ? (
              <>
                <div className="h-10 w-10 rounded-full bg-green-100 flex flex-none items-center justify-center">
                  <Globe className="h-5 w-5 text-green-600" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium">DNS Hostname Found</p>
                  <p className="text-sm font-mono text-muted-foreground">{dnsResult.hostnames}</p>
                </div>
              </>
            ) : (
              <>
                <div className="h-10 w-10 rounded-full bg-amber-100 flex flex-none items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium">No DNS Name Found</p>
                  <p className="text-xs text-muted-foreground">
                    No reverse DNS record exists for <span className="font-mono">{ipAddress.toString()}</span> in the
                    mesh authoritative DNS server
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

