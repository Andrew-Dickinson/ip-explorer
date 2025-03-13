"use client"

import React from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertTriangle, Wifi, Server } from "lucide-react"
import { lookupUispDeviceByIp } from "@/lib/actions/uisp"
import {IPv4} from "ipaddr.js";
import {PSK_STORAGE_KEY, UISP_URL} from "@/lib/constants";
import {SecureCard} from "@/components/cards/secure-card";
import {useLocalStorage} from "@/lib/hooks/use-local-storage";
import {useNextParallelDataAction} from "@/lib/hooks/use-next-data-action";

export interface UispLookupCardProps extends React.ComponentProps<"div"> {
  ipAddress: IPv4
  title?: string
  description?: string
  lastRefresh: Date
}

export function UispLookup({
  ipAddress,
  title = "UISP Device Lookup",
  description = "Searches UISP to find devices with the specified IP address",
  className,
  lastRefresh,
  ...props
}: UispLookupCardProps) {
  const secureContentPSK = useLocalStorage<string>(PSK_STORAGE_KEY)[0];

  const ipAddrString = ipAddress.toString();
  const [devices, isLoading, error] = useNextParallelDataAction(
    lookupUispDeviceByIp,
    [ipAddrString, secureContentPSK ?? ""],
    lastRefresh,
  );

  return (
    <SecureCard
      title={title}
      description={description}
      className={className} {...props}>
        {isLoading ? (
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full"/>
            <div className="items-center gap-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-[170px]"/>
                <div className="flex gap-3">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[100px]"/>
                    <Skeleton className="h-4 w-[100px]"/>
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[100px]"/>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : !devices ? (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-100 flex flex-none items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">Error Looking Up Device in UISP</p>
              <p className="text-sm text-muted-foreground">{error?.message}</p>
            </div>
          </div>
        ) : devices.length === 0 ? (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gray-100 flex flex-none items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-gray-600" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">No Devices Found</p>
              <p className="text-sm text-muted-foreground">
                No UISP devices were found with the IP address <span className="font-mono">{ipAddress.toString()}</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {devices.map((device, index) => (
              <div key={index} className="border rounded-md p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-10 w-10 rounded-full bg-neutral-100 flex flex-none items-center justify-center`}
                  >
                    {device.type === "ap" || device.type === "station" ? (
                      <Wifi className={`h-5 w-5 "text-neutral-600"`} />
                    ) : (
                      <Server className={`h-5 w-5"text-neutral-600"`} />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <a className="font-medium"
                         href={`${UISP_URL}/devices#id=${device.id}&panelType=device-panel`}
                         target="_blank">
                        {device.name}
                      </a>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${device.isOnline ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                      >
                        {device.isOnline ? "Online" : "Offline"}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <div>
                        <span className="font-semibold">Model:</span> {device.model}
                      </div>
                      <div>
                        <span className="font-semibold">Type:</span> {device.type}
                      </div>
                      <div>
                        <span className="font-semibold">Site:</span> {device.siteName}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </SecureCard>
  )
}

