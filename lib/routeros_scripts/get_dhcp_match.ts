import {IPv4} from "ipaddr.js";


export function get_dhcp_match(ipAddress: IPv4) {
  return `:local ipAddress "${ipAddress.toString()}"
  :local leases [/ip dhcp-server lease print as-value where address=$ipAddress]
  :foreach lease in=$leases do={
      :local result "{"
      :foreach key,value in=$lease do={
          :if ($result != "{") do={ :set result ($result . ",") }
          :set result ($result . "\\"" . $key . "\\":")
          :set result ($result . "\\"" . $value . "\\"")
      }
      :set result ($result . "}")
      :put $result
  }
}`.replaceAll('\n', ';'); // Mikrotik scripting is so cursed. We can't use newlines so we gotta smash everything
}