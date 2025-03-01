"use server"

import { promisify } from "util"
import { IPv4 } from "ipaddr.js"
import { analyzeStatic } from "@/lib/analyzers/static"
import snmp from "net-snmp"
import { getDeviceInfo } from "snmp-sysobjectid"
import moment from "moment";
import {createParallelAction} from "next-server-actions-parallel";

const SNMP_COMMUNITY = "public";

export interface SnmpError {
  displayName: string;
  oid: string;
  error: string;
  errorCode: number;
}

export interface SnmpResult {
  displayName: string;
  oid: string;
  value: string | number | boolean;
  type: string;
}
export interface SnmpQueryResult {
  results: (SnmpResult | SnmpError)[]
}


const OIDS: Record<string, string> = {
  "1.3.6.1.2.1.1.2.0": "Manufacturer, Model, & Device Type",
  "1.3.6.1.2.1.1.5.0": "System Name",
  "1.3.6.1.2.1.1.1.0": "System Description",
  "1.3.6.1.2.1.1.6.0": "System Location",
  "1.3.6.1.2.1.1.3.0": "Uptime",
}

function formatDuration(periodMs: number) {
  const parts: string[] = [];
  const duration = moment.duration(periodMs, "milliseconds");

  if(duration.years() >= 1) {
    const years = Math.floor(duration.years());
    parts.push(years+" "+(years > 1 ? "yrs" : "yr"));
  }

  if(duration.months() >= 1) {
    const months = Math.floor(duration.months());
    parts.push(months+" "+(months > 1 ? "months" : "month"));
  }

  if(duration.days() >= 1) {
    const days = Math.floor(duration.days());
    parts.push(days+" "+(days > 1 ? "days" : "day"));
  }

  if(duration.hours() >= 1) {
    const hours = Math.floor(duration.hours());
    parts.push(hours+" "+(hours > 1 ? "hrs" : "hr"));
  }

  if(duration.minutes() >= 1) {
    const minutes = Math.floor(duration.minutes());
    parts.push(minutes+" "+(minutes > 1 ? "mins" : "min"));
  }

  if(duration.seconds() >= 1) {
    const seconds = Math.floor(duration.seconds());
    parts.push(seconds+" "+"s");
  }

  return parts.join(", ");
}

function parseSnmpValue(varbind: snmp.VarBind): { value: string | number | boolean, type: string } {
  const type = snmp.ObjectType[varbind.type];

  switch (varbind.type) {
    case snmp.ObjectType.Integer:
    case snmp.ObjectType.Counter:
    case snmp.ObjectType.Gauge:
    case snmp.ObjectType.TimeTicks:
      return { value: Number.parseInt(varbind.value.toString(), 10), type }
    case snmp.ObjectType.OctetString:
      if (typeof varbind.value == "number") throw new Error("Numeric value when expecting buffer");
      // Check if it's a printable string
      if (varbind.value.every((char: number) => char >= 32 && char <= 126)) {
        return { value: varbind.value.toString("utf8"), type }
      } else {
        // Return hex string for non-printable octets
        return { value: varbind.value.toString("hex"), type }
      }
    case snmp.ObjectType.OID:
      return { value: varbind.value.toString(), type }
    case snmp.ObjectType.IpAddress:
      if (typeof varbind.value == "number") throw new Error("Numeric value when expecting buffer");
      return { value: `${varbind.value[0]}.${varbind.value[1]}.${varbind.value[2]}.${varbind.value[3]}`, type }
    case snmp.ObjectType.Boolean:
      return { value: varbind.value === 1, type }
    default:
      return { value: varbind.value.toString(), type }
  }
}

/**
 * Performs SNMP queries for the specified OIDs
 * @param ipAddress The IP address of the device to query
 * @param config SNMP configuration (version, community string, or credentials)
 * @param oids Array of OIDs to query
 * @returns Object containing the query results
 */
async function performSnmpQueryInner(
  ipAddress: string,
): Promise<SnmpQueryResult> {
  if (!IPv4.isValidFourPartDecimal(ipAddress)) {
    throw new Error("Invalid IP address format")
  }

  // Throws for non-mesh addresses, so we can't be coaxed into
  // sending traffic out of the mesh
  analyzeStatic(IPv4.parse(ipAddress))

  let session: snmp.Session | undefined;
  try {
    session = snmp.createSession(ipAddress, SNMP_COMMUNITY, {
      version: snmp.Version1,
      timeout: 1500,
      retries: 1,
    })

    if (!session) {
      throw new Error("Error creating SNMP Session");
    }

    const oids = Object.keys(OIDS);
    const getAsync = promisify(session.get.bind(session))
    const results: (SnmpResult | SnmpError)[] = [];

    const varbinds = await getAsync(oids)
    varbinds.forEach((varbind, index) => {
      const oid = oids[index];
      const displayName = OIDS[varbind.oid] ?? `Unknown (${varbind.oid})`;
      if (snmp.isVarbindError(varbind)) {
        results.push({oid, error: snmp.ObjectType[varbind.type], errorCode: varbind.type, displayName: OIDS[oid] ?? `Unknown (${varbind.oid})`});
      } else {
        const parsed = parseSnmpValue(varbind);

        // If this is a sysObjectID, decode it using "snmp-sysobjectid" into three separate entries
        if (oid === "1.3.6.1.2.1.1.2.0") {
          const lookupResult = getDeviceInfo(varbind.value.toString());

          // Ugly hack to fix Ubiquiti's crappy choice to not change their vendor ID
          if (lookupResult.vendor === "Frogfoot Networks") lookupResult.vendor = "Ubiquiti Networks";

          results.push({
            oid: oid + "-manf",
            value: lookupResult.vendor ? lookupResult.vendor : `${varbind.value.toString()} (Unknown)`,
            type: "OctetString",
            displayName: "Manufacturer"
          });
          results.push({
            oid: oid + "-model",
            value: lookupResult.model ? lookupResult.model : `Unknown (${varbind.value.toString()})`,
            type: "OctetString",
            displayName: "Model (Unreliable)"
          });
          results.push({
            oid: oid + "-type",
            value: lookupResult.category ? lookupResult.category : `Unknown (${varbind.value.toString()})`,
            type: "OctetString",
            displayName: "Device Category"
          });
        } else if (oid === "1.3.6.1.2.1.1.3.0" && typeof parsed.value === "number") {
          results.push({
            value: formatDuration(parsed.value * 10),
            type: "OctetString",
            oid,
            displayName,
          });
        } else {
          results.push({...parsed, oid, displayName})
        }
      }
    })

    return {results}
  } catch (error) {
    if (error instanceof Error && 'name' in error && error.name === "RequestTimedOutError") {
      throw new Error("No response from device, request timed out");
    } else {
      console.error("SNMP query error:", error);
      throw new Error("Unknown error while performing SNMP query, check logs")
    }
  } finally {
    if (session) {
      session.close()
    }
  }
}

export const performSnmpQuery = createParallelAction(performSnmpQueryInner);
