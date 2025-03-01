"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {AlertTriangle, Server} from "lucide-react"
import {performSnmpQuery, SnmpError, type SnmpQueryResult, SnmpResult} from "@/lib/actions/snmp-query"
import type { IPv4 } from "ipaddr.js"
import {runParallelAction} from "next-server-actions-parallel";

export interface SnmpInfoCardProps extends React.ComponentProps<"div"> {
  ipAddress: IPv4
  title?: string
  description?: string
}

function isError(res: SnmpResult | SnmpError): res is SnmpError {
  return 'error' in res;
}

export function SnmpInfo({
  ipAddress,
  title = "SNMP Device Information",
  description = "Shows basic device information retrieved from the device via the SNMP protocol",
  className,
  ...props
}: SnmpInfoCardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [snmpResult, setSnmpResult] = useState<SnmpQueryResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSnmpInfo = async () => {
      try {
        setIsLoading(true)
        const result = await runParallelAction(performSnmpQuery(ipAddress.toString()));
        setSnmpResult(result)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
        setSnmpResult(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSnmpInfo()
  }, [ipAddress])

  return (
    <Card className={className} {...props}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-100 flex flex-none items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">Error Fetching SNMP Information</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        ) : snmpResult ? (
          <div className="space-y-2">
            {snmpResult.results.map((result) => (
              <div key={result.oid} className="flex justify-between items-center">
                <span className="font-medium">{result.displayName}:</span>
                <span className="font-mono text-sm text-right">
                  {isError(result) ? `Error: ${result.error}` : String(result.value) }
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-100 flex flex-none items-center justify-center">
              <Server className="h-5 w-5 text-amber-600" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">No SNMP Information Available</p>
              <p className="text-xs text-muted-foreground">
                Unable to retrieve SNMP information from <span className="font-mono">{ipAddress.toString()}</span>.
                Ensure that SNMP is enabled on the device and the configuration is correct.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

