
export function get_bridge_host(macAddr: string) {
  return `:local hosts [/interface bridge host print as-value where mac-address="${macAddr}"]
  :foreach host in=$hosts do={
      :local result "{"
      :foreach key,value in=$host do={
          :if ($result != "{") do={ :set result ($result . ",") }
          :set result ($result . "\\"" . $key . "\\":")
          :set result ($result . "\\"" . $value . "\\"")
      }
      :set result ($result . "}")
      :put $result
  }
}`.replaceAll('\n', ';'); // Mikrotik scripting is so cursed. We can't use newlines so we gotta smash everything
}