"use server"

import {exec} from "child_process"
import {promisify} from "util"
import {IPv4} from "ipaddr.js";
import {isMeshAddress} from "@/lib/analyzers/static";
import {createParallelAction} from "next-server-actions-parallel";
import {ActionResult} from "@/lib/types";
import {incrementRateCounter} from "@/lib/rate-limits";
import {EndpointName} from "@/lib/constants";

const execAsync = promisify(exec)

export interface PingData {
  reachable: boolean
  averageLatency: number | null
  packetLoss: number
  sent: number
  received: number
}

export interface PingResult extends ActionResult {
  pingData?: PingData
}

const isExecError = (err: unknown): err is Error & { stdout: string } => {
  return err instanceof Error && 'stdout' in (err as never);
}

/**
 * Performs ICMP ping to check if an IP address is reachable
 * @param ipAddress The IP address to ping
 * @returns Object containing reachability status and latency information
 */
async function checkIcmpReachabilityInner(ipAddress: string): Promise<PingResult> {
  // Check if the request is rate limited
  try {
    await incrementRateCounter(EndpointName.ICMP_PING);
  } catch {
    return {rateLimit: true};
  }

  if (!IPv4.isValidFourPartDecimal(ipAddress)) {
    throw new Error("Invalid IP address format")
  }

  // Throw for non-mesh addresses, so we can't be coaxed into
  // sending traffic out of the mesh
  if (!isMeshAddress(IPv4.parse(ipAddress))) { throw new Error("Non-mesh IP address") }

  // Number of pings to send
  const count = 4

  // Platform-specific ping command
  const pingCommand = `ping -c ${count} ${ipAddress}`

  try {
    let stdout: string;
    try {
      ({ stdout } = await execAsync(pingCommand))
    } catch (error) {
      if (isExecError(error)) {stdout = error.stdout;} else throw error;
    }

    // Parse the ping results
    const packetLossMatch = stdout.match(/([\d.]+)% packet loss/)
    const packetLoss = packetLossMatch ? Number.parseFloat(packetLossMatch[1]) / 100 : 1;

    // Parse average latency - handle both output formats
    let averageLatency: number | null = null

    // macOS/BSD format: "round-trip min/avg/max/stddev = 8.279/23.655/49.702/15.653 ms"
    const macLatencyMatch = stdout.match(/round-trip min\/avg\/max\/stddev = [\d.]+\/([\d.]+)\/[\d.]+\/[\d.]+/)

    // Linux format: "round-trip min/avg/max = 23.347/59.592/107.671 ms"
    const linuxLatencyMatch = stdout.match(/round-trip min\/avg\/max = [\d.]+\/([\d.]+)\/[\d.]+/)

    if (macLatencyMatch) {
      averageLatency = Number.parseFloat(macLatencyMatch[1])
    } else if (linuxLatencyMatch) {
      averageLatency = Number.parseFloat(linuxLatencyMatch[1])
    }

    // Count sent and received packets - works on both platforms
    const sentMatch = stdout.match(/(\d+) packets transmitted/)
    const receivedMatch = stdout.match(/(\d+) (?:packets )?received/)

    const sent = sentMatch ? Number.parseInt(sentMatch[1], 10) : count
    const received = receivedMatch ? Number.parseInt(receivedMatch[1], 10) : 0

    return {
      pingData: {
        reachable: packetLoss < 1,
        averageLatency,
        packetLoss,
        sent,
        received,
      }
    }
  } catch (error) {
    console.error(error);
    return { error: "Unexpected error parsing ping results, check logs for more info" }
  }
}

export const checkIcmpReachability = createParallelAction(checkIcmpReachabilityInner);
