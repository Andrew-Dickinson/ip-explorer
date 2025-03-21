"use server"

import { IPv4 } from "ipaddr.js"
import { Agent } from "undici"
import UISP_CERT from "@/lib/certificates/uisp.mesh.nycmesh.net.pem"
import {EndpointName, UISP_API_URL} from "@/lib/constants"
import { isUispDeviceArray, type UispDevice } from "@/types/uisp"
import { createParallelAction } from "next-server-actions-parallel"
import {ActionResult} from "@/lib/types";
import {checkToken} from "@/lib/check-token";

// Cache structure for device data
interface DeviceCache {
  devices: UispDevice[] | null
  lastFetched: number
}

let deviceCache: DeviceCache = {
  devices: null,
  lastFetched: 0,
}

// Cache duration (10 minutes in milliseconds)
const CACHE_DURATION = 10 * 60 * 1000

/**
 * Authenticates with UISP API
 * @param username UISP username
 * @param password UISP password
 * @returns Object with login result
 */
async function loginToUISP(
  username: string,
  password: string
): Promise<string> {
  const response = await fetch(`${UISP_API_URL}/user/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username,
      password
    }),
    // @ts-expect-error - dispatcher is not in the standard RequestInit type
    dispatcher: new Agent({
      connect: {
        ca: UISP_CERT,
      }
    })
  });

  if (!response.ok) {
    if (response.status === 400) {
      throw new Error("UISP Login access denied. Check password?");
    }

    const errorText = await response.text();
    throw new Error(`UISP Login error: ${errorText}`)
  }

  const token = response.headers.get("x-auth-token");

  // If no token is provided, throw
  if (!token) throw new Error("UISP didn't return header");

  return token;
}

export interface UispDeviceData {
  id: string
  name: string
  model: string
  type: string
  siteName: string
  isOnline: boolean
}

export interface UispDeviceResult extends ActionResult {
  devices: UispDeviceData[]
}

/**
 * Fetches all devices from UISP API
 * @returns Array of all UISP devices
 */
async function fetchUispDevices(): Promise<UispDevice[]> {
  const now = Date.now()

  // If device cache is valid, return cached devices
  if (deviceCache.devices && now - deviceCache.lastFetched < CACHE_DURATION) {
    return deviceCache.devices
  }

  if (!process.env.UISP_USER || !process.env.UISP_PASSWORD) throw new Error("UISP credentials not set");

  // If cache is expired or empty, fetch new data
  const response = await fetch(`${UISP_API_URL}/devices`, {
    headers: {
      Accept: "application/json",
      "x-auth-token": await loginToUISP(process.env.UISP_USER, process.env.UISP_PASSWORD),
    },
    // @ts-expect-error - dispatcher is not in the standard RequestInit type
    dispatcher: new Agent({
      connect: {
        ca: UISP_CERT,
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch UISP devices: ${response.status} ${response.statusText}`)
  }

  const devices = await response.json();
  if (!isUispDeviceArray(devices)) {
    throw new Error("Invalid data structure")
  }

  // Update device cache
  deviceCache = {
    devices,
    lastFetched: now,
  }

  return devices
}

/**
 * Looks up UISP devices by IP address
 * @param ipAddress The IP address to search for
 * @param token The authentication token to access this endpoint
 * @returns Array of devices matching the IP address
 */
async function lookupUispDeviceByIpInner(ipAddress: string, token: string): Promise<UispDeviceResult> {
  // Validate token (and do rate limiting)
  try {
    if (await checkToken(token, EndpointName.UISP)) {
      return {devices: [], invalidToken: true};
    }
  } catch {
    return {devices: [], rateLimit: true};
  }

  // Validate IP address format
  if (!IPv4.isValidFourPartDecimal(ipAddress)) {
    throw new Error("Invalid IP address format")
  }

  try {
    // Fetch devices from UISP API (using cache if available)
    const devices = await fetchUispDevices()

    // Filter devices by IP address
    const matchingDevices: UispDevice[] = devices.filter((device: UispDevice) => {
      // Check main IP address
      if (device.ipAddress && (ipAddress === device.ipAddress || device.ipAddress.startsWith(ipAddress + "/"))) {
        return true
      }

      // Check IP address list if available
      if (device.ipAddressList && Array.isArray(device.ipAddressList)) {
        for (const searchAddress of device.ipAddressList) {
          if (searchAddress && (ipAddress === searchAddress || searchAddress.startsWith(ipAddress + "/"))) {
            return true;
          }
        }
      }

      // Check interfaces for matching IP addresses
      if (device.interfaces && Array.isArray(device.interfaces)) {
        for (const iface of device.interfaces) {
          if (iface.addresses && Array.isArray(iface.addresses)) {
            for (const addr of iface.addresses) {
              // Check if the CIDR address starts with our IP
              if (addr.cidr && addr.cidr.startsWith(ipAddress + "/")) {
                return true
              }
            }
          }
        }
      }

      return false
    })

    // Map to simplified result objects
    return {devices: matchingDevices.map((device: UispDevice) => ({
      id: device.identification?.id || "unknown",
      name: device.identification?.name || device.identification?.hostname || "Unnamed Device",
      model: device.identification?.model || "Unknown",
      type: device.identification?.role || "Unknown",
      siteName: device.identification?.site?.name || "Unknown",
      isOnline: device.overview?.status === "active" || false,
    }))}
  } catch (error) {
    console.error("Error looking up UISP device:", error)
    return { devices: [], error: "Error looking up UISP device, check logs for more info"}
  }
}

export const lookupUispDeviceByIp = createParallelAction(lookupUispDeviceByIpInner);
