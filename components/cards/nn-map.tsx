import React, {useCallback, useEffect, useRef, useState} from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {IPv4} from "ipaddr.js";
import {ospfIP} from "@/lib/analyzers/nn-ips";
import {Loader2} from "lucide-react";

export interface NnMapProps extends React.ComponentProps<"div"> {
  networkNumber?: number;
  lastRefresh: Date;
  updateParsedAddress: (addr: IPv4) => void;
}

export function NnMap({networkNumber, lastRefresh, updateParsedAddress, className, ...props}: NnMapProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);

  const syncMap = useCallback((networkNumber: number | undefined) => {
    if (iframeRef.current) {
      if (networkNumber) {
        iframeRef.current.contentWindow?.postMessage({selectedNodes: networkNumber.toString()}, "*");
      }
    }
  }, [iframeRef]);

  useEffect(() => {
    if (networkNumber) {
      syncMap(networkNumber)
    }

    const listener = (event: unknown) => {
      if (event instanceof Object && 'data' in event && event.data instanceof Object){
        if ('type' in event.data && event.data.type == "FETCH_NODES_SUCCESS") {
          setMapLoaded(true);
          syncMap(networkNumber)
        } else if ('selectedNodes' in event.data && typeof event.data.selectedNodes === "string") {
          const parsedNum = parseInt(event.data.selectedNodes);
          if (parsedNum <= 8000) {
            updateParsedAddress(ospfIP(parsedNum, 0))
          }
        }
      }
    }

    window.addEventListener("message", listener);
    return () => {window.removeEventListener("message", listener);}
  }, [updateParsedAddress, networkNumber, lastRefresh, syncMap]);

  return <Card
    className={className + " gap-3 " + (!networkNumber ? "hidden" : "")}
    {...props}>
    <CardHeader>
      <CardTitle>Node Map</CardTitle>
      <CardDescription className={"text-xs"}>
        Uses MeshDB to check where the network number corresponding to this address is located
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className={"flex pt-3"}>
        <div className={"relative flex-1 h-80" + (mapLoaded ? "" : " opacity-50")}>
          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <Loader2 className="h-15 w-15 animate-spin text-gray-500" />
            </div>
          )}
          <iframe className={"w-full h-full rounded-xl"} src={"https://adminmap.db.nycmesh.net/"} ref={iframeRef}/>
        </div>
      </div>

    </CardContent>
  </Card>
}