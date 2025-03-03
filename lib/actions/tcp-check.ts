"use server"
import { Socket } from "net"
import { IPv4 } from "ipaddr.js"
import { analyzeStatic } from "@/lib/analyzers/static"
import { PortStatus } from "../types"
import {createParallelAction} from "next-server-actions-parallel";

export interface TcpCheckResult {
  port: number
  status: PortStatus
}

export interface TcpConnectivityResult {
  results: TcpCheckResult[]
}

/**
 * Checks TCP connectivity to a specific port
 * @param ipAddress The IP address to connect to
 * @param port The port to check
 * @param timeout Timeout in milliseconds
 * @returns Object containing connectivity status and latency
 */
async function checkSinglePort(ipAddress: string, port: number, timeout = 2000): Promise<TcpCheckResult> {
  return new Promise((resolve) => {
    const socket = new Socket()
    let isDone = false

    // Set timeout
    socket.setTimeout(timeout)

    // Handle successful connection
    socket.on("connect", () => {
      if (isDone) return
      isDone = true
      socket.destroy()
      resolve({
        port,
        status: PortStatus.OPEN,
      })
    })

    // Handle errors
    socket.on("error", () => {
      if (isDone) return
      isDone = true
      socket.destroy()
      resolve({
        port,
        status: PortStatus.CLOSED,
      })
    })

    // Handle timeout
    socket.on("timeout", () => {
      if (isDone) return
      isDone = true
      socket.destroy()
      resolve({
        port,
        status: PortStatus.TIMEOUT,
      })
    })

    // Attempt connection
    socket.connect(port, ipAddress)
  })
}

/**
 * Checks TCP connectivity to multiple ports on an IP address
 * @param ipAddress The IP address to check
 * @param ports Array of ports to check
 * @returns Object containing results for all ports
 */
async function checkTcpConnectivityInner(ipAddress: string, ports: number[]): Promise<TcpConnectivityResult> {
  if (!IPv4.isValidFourPartDecimal(ipAddress)) {
    throw new Error("Invalid IP address format")
  }

  if (ports.length > 10) {
    throw new Error("Too many ports");
  }

  // Throws for non-mesh addresses, so we can't be coaxed into
  // sending traffic out of the mesh
  analyzeStatic(IPv4.parse(ipAddress))

  // Check all ports in parallel
  const results = await Promise.all(ports.map((port) => checkSinglePort(ipAddress, port)))

  return {
    results,
  }
}

export const checkTcpConnectivity = createParallelAction(checkTcpConnectivityInner);
