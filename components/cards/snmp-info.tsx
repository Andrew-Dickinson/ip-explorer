"use client"

import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertTriangle,
  Building2,
  ClockArrowUp,
  Cpu,
  FileText,
  MapPinned,
  Server, SquarePen
} from "lucide-react"
import {performSnmpQuery, SnmpError, SnmpResult} from "@/lib/actions/snmp-query"
import type { IPv4 } from "ipaddr.js"
import {useNextParallelDataAction} from "@/lib/hooks/use-next-data-action";

export interface SnmpInfoCardProps extends React.ComponentProps<"div"> {
  ipAddress: IPv4
  title?: string
  description?: string
  lastRefresh: Date
}

function isError(res: SnmpResult | SnmpError): res is SnmpError {
  return 'error' in res;
}

const NAME_TO_ICON: Record<string, React.ElementType> = {
  "Manufacturer": Building2,
  "Model (Unreliable)": Cpu,
  "Device Category": Server,
  "System Name": SquarePen,
  "System Description": FileText,
  "Location": MapPinned,
  "Uptime": ClockArrowUp,
};

export function SnmpInfo({
  ipAddress,
  title = "SNMP Device Information",
  description = "Shows basic device information retrieved from the device via the SNMP protocol",
  className,
  lastRefresh,
  ...props
}: SnmpInfoCardProps) {
  const [snmpResult, isLoading, error] = useNextParallelDataAction(
    performSnmpQuery,
    [ipAddress.toString()],
    lastRefresh,
  );

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
              <p className="text-sm text-muted-foreground">{error.message}</p>
            </div>
          </div>
        ) : snmpResult?.results.length ? (
          <div className="space-y-2">
            {snmpResult.results.map((result) => {
              const Icon = NAME_TO_ICON[result.displayName] ?? FileText
              return <div key={result.oid} className="flex justify-between items-center p-2 rounded-md bg-muted/50">
                <span className="w-45 ml-2 flex flex-none">
                  <Icon className="h-5 w-5 mr-2.5 mt-0.5"/>
                  <span className="font-medium">{result.displayName}</span>
                </span>
                <span className="font-mono text-sm text-right">
                  {isError(result) ? `Error: ${result.error}` : String(result.value)}
                </span>
              </div>
            })}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gray-100 flex flex-none items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-gray-600" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">No SNMP Information Available</p>
              <p className="text-xs text-muted-foreground">
                Unable to retrieve SNMP information from <span className="font-mono">{ipAddress.toString()}</span>.
                Either SNMP is not enabled on the device or the configuration is incorrect.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

