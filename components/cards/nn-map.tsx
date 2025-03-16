import React, {useCallback, useEffect, useRef, useState} from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {IPv4} from "ipaddr.js";
import {ospfIP} from "@/lib/analyzers/nn-ips";
import {Loader2} from "lucide-react";
import {disambiguateNumberMeshDB} from "@/lib/actions/disambiguate-nn";
import {runParallelAction} from "next-server-actions-parallel";

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
      iframeRef.current.contentWindow?.postMessage({selectedNodes: networkNumber?.toString()}, "*");
    }
  }, [iframeRef]);

  useEffect(() => {
    if (networkNumber) {
      syncMap(networkNumber)
    }

    const listener = async (event: unknown) => {
      if (event instanceof Object && 'data' in event && event.data instanceof Object){
        if ('type' in event.data && event.data.type == "FETCH_NODES_SUCCESS") {
          setMapLoaded(true);
          if (networkNumber) syncMap(networkNumber)
        } else if ('selectedNodes' in event.data && typeof event.data.selectedNodes === "string") {
          const parsedNum = parseInt(event.data.selectedNodes);
          let resolved_number: number | undefined;
          try {
            resolved_number = await runParallelAction(disambiguateNumberMeshDB(parsedNum));
          } catch {
            resolved_number = undefined;
          }

          if (resolved_number) {
            updateParsedAddress(ospfIP(resolved_number, 0))
            // This will get repeated on a later call after the new address is pasred,
            // but doing it here first makes the UI snappier
            syncMap(resolved_number);
          } else {
            // If the user selected an Install dot with no NN, tell them "No!" by deselecting it
            syncMap(undefined);
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