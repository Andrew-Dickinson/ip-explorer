"use server"

import {exec} from "child_process"
import {promisify} from "util"
import {IPv4} from "ipaddr.js";
import {analyzeStatic} from "@/lib/analyzers/static";
import {createParallelAction} from "next-server-actions-parallel";
import {ActionResult} from "@/lib/types";

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
  if (!IPv4.isValidFourPartDecimal(ipAddress)) {
    throw new Error("Invalid IP address format")
  }

  // Throws for non-mesh addresses, so we can't be coaxed into
  // sending traffic out of the mesh
  analyzeStatic(IPv4.parse(ipAddress));

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

    console.log("PING OUTPUT DEBUG");
    console.log(stdout);

    // Parse the ping results
    const packetLossMatch = stdout.match(/([\d.]+)% packet loss/)
    const packetLoss = packetLossMatch ? Number.parseFloat(packetLossMatch[1]) / 100 : 1;

    // Different patterns for different OS outputs
    const latencyMatch = stdout.match(/round-trip min\/avg\/max\/stddev = [\d.]+\/([\d.]+)\/[\d.]+\/[\d.]+/);
    const averageLatency = latencyMatch ? Number.parseFloat(latencyMatch[1]) : null

    // Count sent and received packets
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
