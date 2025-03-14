"use server"

import { IPv4 } from "ipaddr.js"
import { google } from "googleapis"
import {createParallelAction} from "next-server-actions-parallel";
import {ActionResult} from "@/lib/types";

export interface IpHostData {
  rowNum: number
  ip: string
  location: string
  hostname: string
  use: string
  controlledBy: string
  notes: string
}

export interface IpHostLookupResult extends ActionResult {
  found: boolean
  hostData?: IpHostData
}

// Cache structure
interface Cache {
  data: IpHostData[] | null
  lastFetched: number
}

// In-memory cache
let cache: Cache = {
  data: null,
  lastFetched: 0,
}

// Cache duration (1 hour in milliseconds)
const CACHE_DURATION = 60 * 60 * 1000

/**
 * Fetches IP host data from Google Sheets or returns cached data if available
 */
async function fetchIpHostData(): Promise<IpHostData[]> {
  const now = Date.now()

  // If cache is valid, return cached data
  if (cache.data && now - cache.lastFetched < CACHE_DURATION) {
    return cache.data
  }

  // If cache is expired or empty, fetch new data
  const auth = new google.auth.JWT({
    email: process.env.GCP_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GCP_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  })

  const sheets = google.sheets({ version: "v4", auth })

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.IP_RANGES_SHEET_ID,
      range: "Hosts!A:H",
    })

    const rows = response.data.values

    if (!rows || rows.length === 0) {
      throw new Error("No data found in the sheet")
    }

    // Process the data
    const data = rows
      .slice(1)
      .map((row, i) => ({
        rowNum: i + 2, // +1 for zero index, +1 for header row
        ip: row[1] || "",
        location: row[2] || "",
        hostname: row[3] || "",
        use: row[4] || "",
        controlledBy: row[5] || "",
        notes: row[7] || "",
      }))
      .filter((data) => data.ip && data.ip !== "IP") // Filter out rows without an IP and any additional header rows

    // Update cache
    cache = {
      data: data,
      lastFetched: now,
    }

    return data
  } catch (error) {
    console.error("Error fetching data from Google Sheets:", error)
    // If there's an error, return cached data if available, otherwise throw
    if (cache.data) {
      console.warn("Returning stale cached data due to fetch error")
      return cache.data
    }
    throw error
  }
}

/**
 * Normalizes an IP address for comparison
 * Handles cases like "10.70.131.218 ?" or "10.70.71.24/30" by removing any non-IP characters
 */
function normalizeIp(ip: string): string {
  // Extract just the IP part (remove any trailing characters like "?")
  const match = ip.match(/\d+\.\d+\.\d+\.\d+/)
  return match ? match[0] : ip
}

/**
 * Checks if an IP address matches any host in the Google Sheet
 * @param ipAddress The IP address to check
 * @param psk The pre-shared key to access this endpoint
 * @returns Object containing information about the matching host if found
 */
export async function checkIpHostInner(ipAddress: string, psk: string): Promise<IpHostLookupResult> {
  // Validate PSK
  if (psk !== process.env.SECURE_CONTENT_PSK) {
    throw new Error("Invalid psk");
  }

  try {
    // Validate IP address format
    if (!IPv4.isValidFourPartDecimal(ipAddress)) {
      throw new Error("Invalid IP address format")
    }

    const normalizedSearchIp = ipAddress
    const hostsData = await fetchIpHostData()

    for (const hostData of hostsData) {
      try {
        const normalizedHostIp = normalizeIp(hostData.ip)

        if (normalizedHostIp === normalizedSearchIp) {
          return {
            found: true,
            hostData: hostData,
          }
        }
      } catch (e) {
        // Skip invalid IP formats
        console.warn(`Invalid IP format: ${hostData.ip}`, e)
        continue
      }
    }

    // If we get here, the IP is not found in any host
    return { found: false }
  } catch (error) {
    console.error("Error checking IP host:", error)
    return { found: false, error: "Error checking IP host, check logs for more info" }
  }
}

export const checkIpHost = createParallelAction(checkIpHostInner);