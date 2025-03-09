"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {AlertTriangle, Info, Tag, User, Layers, FileText, Table2} from "lucide-react"
import { checkIpRange, type IpRangeLookupResult } from "@/lib/actions/ip-ranges-ips"
import type { IPv4 } from "ipaddr.js"
import {runParallelAction} from "next-server-actions-parallel";

export interface IpRangeLookupCardProps extends React.ComponentProps<"div"> {
  ipAddress: IPv4
  title?: string
  description?: string
}

export function IpRangesIps({
  ipAddress,
  title = "IPRanges Google Sheet Lookup - IPs",
  description = "Searches the IPRanges spreadsheet to see if this address falls into any of the static ranges defined there",
  className,
  ...props
}: IpRangeLookupCardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [lookupResult, setLookupResult] = useState<IpRangeLookupResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkRange = async () => {
      try {
        setIsLoading(true)
        const result = await runParallelAction(checkIpRange(ipAddress.toString()))
        setLookupResult(result)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
        setLookupResult(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkRange()
  }, [ipAddress])

  return (
    <Card className={className} {...props}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent>
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
              <p className="font-medium">Error Checking IPRanges Sheet</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        ) : lookupResult && lookupResult.found && lookupResult.rangeData ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex flex-none items-center justify-center">
                <Table2 className="h-5 w-5 text-green-600" />
              </div>
              <div className="space-y-1">
                <p className="font-medium">Address Found in Sheet</p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-mono">{ipAddress.toString()}</span> is part of{" "}
                  <span className="font-mono">{lookupResult.rangeData.prefix}</span> on row number{" "}
                  <span className="font-mono">{lookupResult.rangeData.rowNum}</span>
                </p>
              </div>
            </div>

            <div className="grid gap-3 text-sm">
              <div className="grid gap-y-4  gap-x-0 sm:grid-cols-1 md:grid-cols-2 ml-13">
                <InfoTag icon={Tag} label="Prefix" value={lookupResult.rangeData.prefix}/>
                <InfoTag icon={Info} label="Purpose" value={lookupResult.rangeData.purpose}/>
                <InfoTag icon={User} label="From" value={lookupResult.rangeData.from}/>
                {/*<InfoTag*/}
                {/*  icon={lookupResult.rangeData.inUse.toLowerCase() === "y" ? Check : X}*/}
                {/*  label="In Use"*/}
                {/*  value={lookupResult.rangeData.inUse}*/}
                {/*/>*/}
                {/*<InfoTag*/}
                {/*  icon={lookupResult.rangeData.directlyUse.toLowerCase() === "y" ? Check : X}*/}
                {/*  label="Directly Use"*/}
                {/*  value={lookupResult.rangeData.directlyUse}*/}
                {/*/>*/}
                <InfoTag icon={User} label="Controlled By" value={lookupResult.rangeData.controlledBy}/>
                <InfoTag icon={Layers} label="VLAN" value={lookupResult.rangeData.vlan}/>
                <InfoTag icon={FileText} label="Notes" value={lookupResult.rangeData.notes}/>
                <InfoTag icon={FileText} label="Comment" value={lookupResult.rangeData.comment}/>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-red-100 flex flex-none items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600"/>
            </div>
            <div className="space-y-1">
              <p className="font-medium">Address not found in sheeet</p>
              <p className="text-xs text-muted-foreground">
                The IP address <span className="font-mono">{ipAddress.toString()}</span> was not found in any of the
                defined IP ranges.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


interface InfoTagProps {
  icon: React.ElementType
  label: string
  value: string
}

function InfoTag({icon: Icon, label, value}: InfoTagProps) {
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