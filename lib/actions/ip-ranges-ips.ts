"use server"

import { IPv4, parseCIDR } from "ipaddr.js"
import { google } from "googleapis"
import {createParallelAction} from "next-server-actions-parallel";


export interface IpRangeData {
  rowNum: number
  prefix: string
  purpose: string
  from: string
  inUse: string
  directlyUse: string
  controlledBy: string
  vlan: string
  notes: string
  comment: string
}

export interface IpRangeLookupResult {
  found: boolean
  rangeData?: IpRangeData
}

// Cache duration (1 hour in milliseconds)
const CACHE_DURATION = 60 * 60 * 1000

// Cache structure
interface Cache {
  data: IpRangeData[] | null
  lastFetched: number
}

// In-memory cache for Google sheets data
let cache: Cache = {
  data: null,
  lastFetched: 0,
}

/**
 * Fetches IP range data from Google Sheets or returns cached data if available
 */
async function fetchIpRangeData(): Promise<IpRangeData[]> {
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
      range: "IPs!A:I",
    })

    const rows = response.data.values

    if (!rows || rows.length === 0) {
      throw new Error("No data found in the sheet")
    }

    const data =  rows
      .slice(1)
      .map((row: string[], i) => ({
        rowNum: i + 2, // +1 for zero index, +1 for header row
        comment: row[0] || "",
        prefix: row[1] || "",
        purpose: row[2] || "",
        from: row[3] || "",
        inUse: row[4] || "",
        directlyUse: row[5] || "",
        controlledBy: row[6] || "",
        vlan: row[7] || "",
        notes: row[8] || "",
      }))
      .map((row: IpRangeData) => {
        // Some prefixes might be malformed, so we need to handle errors
        // Fix common issues with prefix format
        let prefix = row.prefix.trim();

        // Add /32 if no prefix length is specified
        if (prefix && !prefix.includes("/")) {
          prefix = `${prefix}/32`
        }
        return {...row, prefix}
      })
      // Filter out rows without a prefix and any additional header rows
      .filter((data: IpRangeData) => data.prefix && IPv4.isValidCIDR(data.prefix));

    // Update cache
    cache = {
      data: data,
      lastFetched: now,
    }

    return data
  } catch (error) {
    console.error("Error fetching data from Google Sheets:", error)
    throw error
  }
}

/**
 * Checks if an IP address is within any of the ranges in the CSV data
 * @param ipAddress The IP address to check
 * @returns Object containing information about the matching range if found
 */
async function checkIpRangeInner(ipAddress: string): Promise<IpRangeLookupResult> {
  // Validate IP address format
  if (!IPv4.isValidFourPartDecimal(ipAddress)) {
    throw new Error("Invalid IP address format")
  }

  try {
    const ip = IPv4.parse(ipAddress)
    const rangesData = await fetchIpRangeData()

    const hits: IpRangeData[] = [];

    for (const rangeData of rangesData) {
      try {
        const [networkAddr, prefixLength] = parseCIDR(rangeData.prefix)
        if (networkAddr.kind() === "ipv4" && ip.match(networkAddr, prefixLength)) {
          hits.push(rangeData);
        }
      } catch (e) {
        // Skip invalid CIDR notations
        console.warn(`Invalid prefix format: ${rangeData.prefix}`, e)
      }
    }

    if (!hits.length) {return {found: false} }

    // We need to determine the "most specific" route that exists to the requested address,
    // and return the row that matches that specificity, in order to not return summary rows
    const longestPrefix = hits
      .map((hit) => parseCIDR(hit.prefix)[1])
      .reduce((a, b) => Math.max(a, b), 0);

    // Find that longest one again, if there is a tie, we return the first one (but there shouldn't be)
    return {
      found: true,
      rangeData: hits.filter((hit) => parseCIDR(hit.prefix)[1] === longestPrefix)[0]
    }

  } catch (error) {
    console.error("Error checking IP range:", error)
    throw error
  }
}

export const checkIpRange = createParallelAction(checkIpRangeInner);
