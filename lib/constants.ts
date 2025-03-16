export const UISP_URL = "https://uisp.mesh.nycmesh.net/nms"
export const UISP_API_URL = `${UISP_URL}/api/v2.1`

export const TOKEN_STORAGE_KEY = "secureContentToken";

export enum EndpointName {
  GET_TOKEN = "GET_TOKEN",
  UISP = "UISP",
  ROUTEROS_SSH_DHCP = "ROUTEROS_SSH_DHCP",
  IP_RANGES_RANGES = "IP_RANGES_RANGES",
  IP_RANGES_HOSTS = "IP_RANGES_HOSTS",
  REVERSE_DNS = "REVERSE_DNS",
  OSPF_LOOKUP = "OSPF_LOOKUP",
  ICMP_PING = "ICMP_PING",
  SNMP_QUERY = "SNMP_QUERY",
  TCP_SCAN = "TCP_SCAN",
}