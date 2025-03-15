"use client"

import type React from "react"
import {MapPin, Server, User, FileText, Table2, Wrench} from "lucide-react"
import { checkIpHost } from "@/lib/actions/ip-ranges-hosts"
import type { IPv4 } from "ipaddr.js"
import {TOKEN_STORAGE_KEY} from "@/lib/constants";
import {useLocalStorage} from "@/lib/hooks/use-local-storage";
import {SecureCard} from "@/components/cards/secure-card";
import {useNextParallelDataAction} from "@/lib/hooks/use-next-data-action";

export interface IpHostsLookupCardProps extends React.ComponentProps<"div"> {
  ipAddress: IPv4
  title?: string
  description?: string
  lastRefresh: Date
}

export function IpRangesHosts({
  ipAddress,
  title = "IPRanges Google Sheet Lookup - Hosts",
  description = "Searches the IPRanges spreadsheet to see if this address matches any of the hosts defined there",
  className,
  lastRefresh,
  ...props
}: IpHostsLookupCardProps) {
  const secureContentToken = useLocalStorage<string>(TOKEN_STORAGE_KEY)[0];

  const [lookupResult, isLoading, error] = useNextParallelDataAction(
    checkIpHost,
    [ipAddress.toString(), secureContentToken ?? ""],
    lastRefresh,
    !!ipAddress?.toString() && !!secureContentToken
  );

  if (secureContentToken && (isLoading || error || !lookupResult?.hostData)) {
    return <></>
  }

  return (
    <SecureCard title={title} description={description} className={className} {...props}>
      { lookupResult?.hostData &&
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-100 flex flex-none items-center justify-center">
              <Table2 className="h-5 w-5 text-green-600" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">Address Found in Sheet</p>
              <p className="text-sm text-muted-foreground">
                <span className="font-mono">{ipAddress.toString()}</span>
                {
                  lookupResult.hostData.hostname ? <>
                    {" "}is assigned to <span className="font-mono">{lookupResult.hostData.hostname}</span>
                  </> : <>{" "}found</>
                }
                {" "}on row number <span className="font-mono">{lookupResult.hostData.rowNum}</span>
              </p>
            </div>
          </div>

          <div className="grid gap-y-4  gap-x-0 sm:grid-cols-1 md:grid-cols-2 ml-13">
            <InfoTag icon={Server} label="Hostname" value={lookupResult.hostData.hostname} />
            <InfoTag icon={MapPin} label="Location" value={lookupResult.hostData.location} />
            <InfoTag icon={Wrench} label="Use" value={lookupResult.hostData.use} />
            <InfoTag icon={User} label="Controlled By" value={lookupResult.hostData.controlledBy} />
            <InfoTag icon={FileText} label="Notes" value={lookupResult.hostData.notes} />
          </div>
        </div>
      }
    </SecureCard>
  )
}

interface InfoTagProps {
  icon: React.ElementType
  label: string
  value: string
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

