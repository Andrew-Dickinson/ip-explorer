"use client"

import type React from "react"
import {useEffect, useState} from "react"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Skeleton} from "@/components/ui/skeleton"
import {BrickWall, Cable, ClockAlert, CloudAlert} from "lucide-react"
import {checkTcpConnectivity, type TcpConnectivityResult} from "@/lib/actions/tcp-check"
import type {IPv4} from "ipaddr.js"
import {Badge} from "@/components/ui/badge"
import {PortStatus} from "@/lib/types";

export interface TcpConnectivityCardProps extends React.ComponentProps<"div"> {
  ipAddress: IPv4
  ports: number[]
  title?: string
  description?: string
}

export function TcpConnectivity({
  ipAddress,
  ports = [80, 443, 22],
  title = "TCP Connectivity",
  description = "Shows TCP port status for common services",
  className,
  ...props
}: TcpConnectivityCardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [tcpResults, setTcpResults] = useState<TcpConnectivityResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkConnectivity = async () => {
      try {
        setIsLoading(true)
        const result = await checkTcpConnectivity(ipAddress.toString(), ports)
        setTcpResults(result)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
        setTcpResults(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkConnectivity()
  }, [ipAddress, ports])

  return (
    <Card className={className} {...props}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
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
                <CloudAlert className="h-5 w-5 text-amber-600" />
              </div>
              <div className="space-y-1">
                <p className="font-medium">Error Checking TCP Connectivity</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
          ) : tcpResults ? (
            <>
              <div className="grid gap-2">
                {tcpResults.results.map((result) => (
                  <div key={result.port} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-6 w-6 rounded-full ${result.status == PortStatus.OPEN ? "bg-green-100" : "bg-red-100"} flex items-center justify-center`}
                      >
                        {result.status == PortStatus.OPEN && (
                          <Cable className="h-3 w-3 text-green-600" />
                        )}
                        {(result.status == PortStatus.CLOSED) && (
                          <BrickWall className="h-3 w-3 text-red-600" />
                        )}
                        {(result.status == PortStatus.TIMEOUT) && (
                          <ClockAlert className="h-3 w-3 text-amber-600" />
                        )}
                      </div>
                      <div>
                        <span className="font-mono text-sm">Port {result.port}</span>
                        <>
                          {result.port === 80 && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              HTTP
                            </Badge>
                          )}
                          {result.port === 443 && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              HTTPS
                            </Badge>
                          )}
                          {result.port === 22 && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              SSH
                            </Badge>
                          )}
                        </>
                        <>
                          {result.status === PortStatus.OPEN && (
                            <Badge className="ml-2 text-xs bg-green-600">
                              Open
                            </Badge>
                          )}
                          {result.status === PortStatus.CLOSED && (
                            <Badge className="ml-2 text-xs bg-red-600">
                              Closed
                            </Badge>
                          )}
                          {result.status === PortStatus.TIMEOUT && (
                            <Badge className="ml-2 text-xs bg-amber-600">
                              Timeout
                            </Badge>
                          )}
                        </>
                      </div>
                    </div>
                    <div className="text-sm hidden sm:flex">
                      {result.port === 80 && (
                        <a href={`http://${ipAddress}`} target={"_blank"}>http://{ipAddress.toString()}:80</a>
                      )}
                      {result.port === 443 && (
                        <a href={`https://${ipAddress}`} target={"_blank"}>https://{ipAddress.toString()}:443</a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

