"use client";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Separator} from "@/components/ui/separator";
import {Globe, Hash, Info, Network, Router, Server} from "lucide-react"
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";
import {AspectRatio} from "@/components/ui/aspect-ratio";
import {useEffect, useRef, useState} from 'react';
import {AddressProvenance, AddressType, StaticAddressCategory} from "@/lib/types";

export interface IpExplainerCardProps extends React.ComponentProps<"div"> {
  addressOctets: string[];
  addressProvenance: AddressProvenance;
  addressType: AddressType;
  networkNumber?: number;
  routerIndex?: number;
  dhcpExplainerComponents?: string[];
  staticAddressCategory?: StaticAddressCategory;
}

export function IpExplainerCard({
    className, addressOctets, addressProvenance,
    addressType, networkNumber, routerIndex, dhcpExplainerComponents, staticAddressCategory, ...props
}: IpExplainerCardProps) {
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)

  const ipAddressStart = 20;
  const ipAddressWidth = 190;
  const ipAddressHeight = 35;
  const ipAddressSpacing = ipAddressWidth / 4;
  const dotOffset = 24;

  const ipAddressLocations = Array(4).fill(0).map((_, i) => ipAddressStart + i * ipAddressSpacing);
  const fourthOctetLineOffset = routerIndex !== undefined ? 6 : 0;

  // 4th location isn't real, but useful as a reference point
  const dotLocations = Array(4).fill(0).map((_, i) => dotOffset + ipAddressStart + i * ipAddressSpacing);

  const explainerStartY = 10;
  const explainerSpacing = 30;
  const explainerLocations = Array(4).fill(0).map((_, i) => explainerStartY + i * explainerSpacing);

  const showThirdAndForthExplainers = ([AddressType.OSPF_10_69, AddressType.OSPF_10_68].includes(addressType) && networkNumber !== undefined)
    || addressType === AddressType.STATIC_10_70;

  const ipAddressTop = 120 - (showThirdAndForthExplainers ? 0 : explainerSpacing * 2);
  const explainerStartX = 200;
  const explainerWidth = 400;


  const routerIndexXPos = addressOctets[3].length < 2 ? 156 : 150;
  const bottomBendPointRelY = 20;

  const dhcpShrink = 5;
  const dhcpExplainerOriginX =  ipAddressLocations[2];
  const dhcpExplainerOriginY = ipAddressTop + ipAddressHeight + bottomBendPointRelY + 30;
  const dhcpExplainerYSpacing = 60;

  let containerHeight = ipAddressTop + ipAddressHeight + 10;
  if (routerIndex !== undefined) { containerHeight += bottomBendPointRelY + 10; }
  else if (addressType == AddressType.DHCP) { containerHeight += bottomBendPointRelY + 220; }
  const containerWidth = 574;

  const thirdRouterPossible = routerIndex !== undefined ? Number.parseInt(addressOctets[3]) <= 55 : undefined;

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current && innerRef.current) {
        const containerWidth = containerRef.current.offsetWidth
        const innerWidth = innerRef.current.offsetWidth
        const newScale = containerWidth / innerWidth
        setScale(newScale)
      }
    }

    updateScale()
    window.addEventListener("resize", updateScale)
    return () => window.removeEventListener("resize", updateScale)
  }, []);

  return <Card
    className={className + " gap-3"}
    {...props}>
    <CardHeader>
      <CardTitle>Address Breakdown</CardTitle>
      <CardDescription>Shows information obtained directly from the bytes of the IP address</CardDescription>
    </CardHeader>
    <CardContent>
      <AspectRatio ratio={containerWidth / containerHeight} ref={containerRef}>
        <div className="relative" ref={innerRef} style={{
          width: containerWidth,
          height: containerHeight,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
        >
          {/* IP Address Display */}
          <div className="relative font-mono text-xl" style={{top: ipAddressTop + 5}}>
                      <span className="absolute" style={{
                        color: "var(--chart-1)",
                        left: ipAddressLocations[0],
                        transform: "translate(-50%, 0)"
                      }}>
                        {addressOctets[0]}</span>
            <span className="absolute" style={{left: dotLocations[0], transform: "translate(-50%, 0)"}}>
                        .
            </span>
            <span className="absolute"
                  style={{color: "var(--chart-2)", left: ipAddressLocations[1], transform: "translate(-50%, 0)"}}>
                        {addressOctets[1]}
            </span>
            <span className="absolute" style={{left: dotLocations[1], transform: "translate(-50%, 0)"}}>
                        .
            </span>
            <span className="absolute"
                  style={{color: "var(--chart-3)", left: ipAddressLocations[2], transform: "translate(-50%, 0)"}}>
                        {addressOctets[2]}
            </span>
            <span className="absolute" style={{left: dotLocations[2], transform: "translate(-50%, 0)"}}>
                        .
            </span>
            <span className="absolute"
                  style={{left: ipAddressLocations[3], transform: "translate(-50%, 0)"}}>
              {routerIndex !== undefined ? <span style={{color: "var(--chart-5)"}}>{routerIndex}</span> : <></>}
              <span style={{color: "var(--chart-4)"}}>{addressOctets[3]}</span>
            </span>
          </div>

          {/* Connecting Lines */}
          <svg className="absolute h-full" style={{pointerEvents: "none"}}>
            <defs>
              <marker
                id='head'
                orient="auto"
                markerWidth='8'
                markerHeight='8'
                refX='0.8'
                refY='4'
              >
                <path d='M0,0 V8 L4,4 Z' fill="var(--muted-foreground)"/>
              </marker>
            </defs>

            <path
              d={`M ${ipAddressLocations[0]} ${ipAddressTop} L ${ipAddressLocations[0]} ${explainerLocations[0]} L ${explainerStartX} ${explainerLocations[0]}`}
              stroke="var(--chart-1)" fill="none" strokeWidth="1.5"></path>
            <path
              d={`M ${ipAddressLocations[1]} ${ipAddressTop} L ${ipAddressLocations[1]} ${explainerLocations[1]} L ${explainerStartX} ${explainerLocations[1]}`}
              stroke="var(--chart-2)" fill="none" strokeWidth="1.5"></path>
            {showThirdAndForthExplainers ?
              <>
                <path
                  d={`M ${ipAddressLocations[2]} ${ipAddressTop} L ${ipAddressLocations[2]} ${explainerLocations[2]} L ${explainerStartX} ${explainerLocations[2]}`}
                  stroke="var(--chart-3)" fill="none" strokeWidth="1.5"></path>
                <path
                  d={`M ${ipAddressLocations[3] + fourthOctetLineOffset} ${ipAddressTop} L ${ipAddressLocations[3] + fourthOctetLineOffset} ${explainerLocations[3]} L ${explainerStartX} ${explainerLocations[3]}`}
                  stroke="var(--chart-4)" fill="none" strokeWidth="1.5"></path>
              </>
              : <></>
            }
            {routerIndex !== undefined ?
              <path
                d={`M ${routerIndexXPos} ${ipAddressTop + ipAddressHeight} L ${routerIndexXPos} ${bottomBendPointRelY + ipAddressHeight + ipAddressTop} L ${explainerStartX} ${bottomBendPointRelY + ipAddressHeight + ipAddressTop}`}
                stroke="var(--chart-5)" fill="none" strokeWidth="1.5"></path>
              : <></>
            }

            {dhcpExplainerComponents !== undefined ?
              <>
                <path
                  markerEnd='url(#head)'
                  d={`M ${dotLocations[0] + dhcpShrink} ${ipAddressTop + ipAddressHeight} L ${dotLocations[3] - dhcpShrink} ${ipAddressTop + ipAddressHeight} L ${ipAddressLocations[2]}  ${ipAddressTop + ipAddressHeight} L  ${ipAddressLocations[2]} ${dhcpExplainerOriginY - 20}`}
                  stroke="var(--muted-foreground)" fill="none" strokeWidth="1.5"></path>
                {
                  dhcpExplainerComponents.slice(undefined, -1).map((_, i) => {
                    return <path
                      key={i}
                      markerEnd='url(#head)'
                      d={`M ${dhcpExplainerOriginX} ${dhcpExplainerOriginY + dhcpExplainerYSpacing * i + 16} L ${dhcpExplainerOriginX} ${dhcpExplainerOriginY + dhcpExplainerYSpacing * i + 39}`}
                      stroke="var(--muted-foreground)" fill="none" strokeWidth="1.5"></path>;
                  })
                }
              </>
              : <></>
            }
          </svg>

          {/* DHCP Math Text */}
          {dhcpExplainerComponents ?
            <div className="relative font-mono text-xl"
                 style={{top: dhcpExplainerOriginY, left: dhcpExplainerOriginX}}>
              <span className="absolute" style={{
                transform: "translate(-50%, -50%)"
              }}>
                <span style={{color: "var(--muted-foreground)"}}>{dhcpExplainerComponents[0].substring(0, 2)}</span>
                <span style={{color: "var(--chart-2)"}}>{dhcpExplainerComponents[0].substring(2, 4)}</span>
                <span style={{color: "var(--chart-3)"}}>{dhcpExplainerComponents[0].substring(4, 6)}</span>
                <span style={{color: "var(--chart-4)"}}>{dhcpExplainerComponents[0].substring(6, 8)}</span>
              </span>
              <span className="absolute" style={{
                top: dhcpExplainerYSpacing,
                left: 0,
                transform: "translate(-50%, -50%)"
              }}>
                <span style={{color: "var(--muted-foreground)"}}>{dhcpExplainerComponents[1].substring(0, 2)}</span>
                <span style={{color: "var(--chart-2)"}}>{dhcpExplainerComponents[1].substring(2, 4)}</span>
                <span style={{color: "var(--chart-3)"}}>{dhcpExplainerComponents[1].substring(4, 6)}</span>
                <span style={{color: "var(--chart-4)"}}>{dhcpExplainerComponents[1].substring(6, 8)}</span>
              </span>
              <span className="absolute" style={{
                top: dhcpExplainerYSpacing * 2,
                left: 0,
                color: "var(--foreground)",
                transform: "translate(-50%, -50%)"
              }}>
                {dhcpExplainerComponents[2]}
              </span>
              <span className="absolute" style={{
                top: dhcpExplainerYSpacing * 3,
                left: 0,
                color: "var(--foreground)",
                transform: "translate(-50%, -50%)"
              }}>
                {dhcpExplainerComponents[3]}
              </span>
            </div>
            :
            <></>
          }

          {/* Explanatory Text */}
          <div className="absolute text-sm" style={{left: "5px"}}>
            <div className="absolute" style={{
              left: explainerStartX,
              top: explainerLocations[0],
              width: explainerWidth,
              transform: "translate(0, -50%)",
              color: "var(--chart-1)"
            }}>
              {
                [AddressProvenance.MESH_RFC_1918].includes(addressProvenance) ?
                  "First Octet: Always 10 for internal mesh addresses"
                    :
                  "First Octet: Not 10, " +  ( addressProvenance === AddressProvenance.MESH_PUBLIC ? "this is a public mesh address" : "non-mesh RFC1918")
              }
            </div>
            <div className="absolute" style={{
              left: explainerStartX,
              top: explainerLocations[1],
              width: explainerWidth,
              transform: "translate(0, -50%)",
              color: "var(--chart-2)"
            }}>
              {
                [AddressProvenance.MESH_RFC_1918].includes(addressProvenance) ?
                  "Second Octet: Address Type"
                  :
                  "Second Octet: " + ( addressProvenance === AddressProvenance.MESH_PUBLIC ? "Supernode IP Block Indication" : "Always 168 for member LAN")
              }
            </div>
            {showThirdAndForthExplainers ?
              <div className="absolute" style={{
                left: explainerStartX,
                top: explainerLocations[2],
                width: explainerWidth,
                transform: "translate(0, -50%)",
                color: "var(--chart-3)"
              }}>
                {addressType == AddressType.STATIC_10_70 ?
                  "Third Octet: Static Address Category"
                  :
                  "Third Octet: First Network Number Component"
                }
              </div>
              : <></>
            }
            {showThirdAndForthExplainers ?
              <div className="absolute" style={{
                left: explainerStartX,
                top: explainerLocations[3],
                width: explainerWidth,
                transform: "translate(0, -50%)",
                color: "var(--chart-4)"
              }}>
                {addressType == AddressType.STATIC_10_70 ?
                  "Fourth Octet: Unique to device"
                  :
                  "Fourth Octet (last two digits): Second Network Number Component"
                }
              </div>
              : <></>

            }
            {routerIndex !== undefined ?
              <div className="absolute" style={{
                left: explainerStartX,
                top: bottomBendPointRelY + ipAddressHeight + ipAddressTop,
                width: explainerWidth,
                transform: "translate(0, -50%)",
                color: "var(--chart-5)"
              }}>
                Fourth Octet (first digit): Router Index at Network Number
              </div>
              : <></>
            }
            {
              dhcpExplainerComponents ?
              <div className={"absolute text-muted-foreground"} style={{left: dhcpExplainerOriginX + 15, top: dhcpExplainerOriginY - dhcpExplainerYSpacing / 2}}>
                <span className={"absolute"} style={{
                  transform: "translate(0, -50%)",
                  width: explainerWidth
                }}>
                  Convert last three octets to hexadecimal
                </span>
                <span className={"absolute"} style={{
                  transform: "translate(0, -50%)",
                  top: dhcpExplainerYSpacing,
                  width: explainerWidth
                }}>
                  Subtract DHCP start IP: <span className="font-mono">0x60000</span> (<span className="font-mono">96.0.0</span>)
                </span>
                <span className={"absolute"} style={{
                  transform: "translate(0, -50%)",
                  top: dhcpExplainerYSpacing * 2,
                  width: explainerWidth
                }}>
                  Convert back to decimal
                </span>
                <span className={"absolute"} style={{
                  transform: "translate(0, -50%)",
                  top: dhcpExplainerYSpacing * 3,
                  width: explainerWidth
                }}>
                  Divide by 64 (IPs per NN) & round down
                </span>
              </div>
              :
              <></>
              }
          </div>
        </div>
      </AspectRatio>
      <Separator className="my-1"/>
    </CardContent>
    <CardFooter>
      <div className="flex space-x-5">
        <div className="space-y-2">
          <h4 className="text-sm font-medium leading-none flex items-center gap-2">
            <Globe className="h-4 w-4"/>
            Address Provenance
          </h4>
          <p className="text-sm">
            {addressProvenance.split("\n").map((str, i) => <span key={i}>{str}<br/></span>)}
          </p>
        </div>
        <Separator orientation="vertical" />
        <div className="space-y-2">
          <h4 className="text-sm font-medium leading-none flex items-center gap-2">
            <Network className="h-4 w-4" />
            Address Type
          </h4>
          <p className="text-sm">
            {addressType.split("\n").map((str, i) => <span key={i}>{str}<br/></span>)}
          </p>
        </div>
        { networkNumber !== undefined ?
          <>
            <Separator orientation="vertical" />
            <div className="space-y-2">
              <h4 className="text-sm font-medium leading-none flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Network Number
              </h4>
              <p className="text-sm">{networkNumber}</p>
            </div>
          </> : <></>
        }
        { routerIndex !== undefined ? <>
        <Separator orientation="vertical" />
        <div className="space-y-2">
          <h4 className="text-sm font-medium leading-none flex items-center gap-2">
            <Router className="h-4 w-4" />
            Router Index
          </h4>
          <div className="flex space-x-2">
          <p className="text-sm">
            {routerIndex + 1} /  {thirdRouterPossible ? 3 : 2 }
          </p>

          <Tooltip>
            <TooltipTrigger>
              <Info className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              { thirdRouterPossible ?
                <p>
                  Since the second component of the NN is below 55,
                  there are three possible routers at this NN: .{addressOctets[3]}, .1{addressOctets[3]}, & .2{addressOctets[3]}
                </p>
                  :
                <p>
                  Since the second component of the NN is above 55,
                  there are two possible routers at this NN: .{addressOctets[3]} & .1{addressOctets[3]}
                </p>
              }
            </TooltipContent>
          </Tooltip>
          </div>
        </div>
        </> : <></>
        }
        { staticAddressCategory !== undefined ? <>
        <Separator orientation="vertical" />
        <div className="space-y-2">
          <h4 className="text-sm font-medium leading-none flex items-center gap-2">
            <Server className="h-4 w-4" />
            Static Address Category
          </h4>
          <div className="flex space-x-2">
          <p className="text-sm">
            {staticAddressCategory}
          </p>
          </div>
        </div>
        </> : <></>
        }
      </div>
    </CardFooter>
  </Card>
}