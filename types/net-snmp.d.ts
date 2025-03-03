// AI GENERATED, PROBABLY INCORRECT
declare module "net-snmp" {
  export interface Session {
    get(oids: string[], callback: (error: Error | null, varbinds: VarBind[]) => void): void
    close(): void
  }

  export interface VarBind {
    oid: string
    type: number
    value: Buffer | number
  }

  export interface V3Options {
    name: string
    level: number
    authProtocol: number
    authKey: string
    privProtocol: number
    privKey: string
  }

  export interface SessionOptions {
    version: number,
    timeout: number,
    retries: number,
  }

  export const Version1: number
  export const Version2c: number

  export const ObjectType: {
    Boolean: number
    Integer: number
    OctetString: number
    Null: number
    OID: number
    IpAddress: number
    Counter: number
    Gauge: number
    TimeTicks: number
    Opaque: number
    Counter64: number
    [key: number]: string
  }

  export const ObjectType: {
    [key: number]: string
  }

  export function createSession(target: string, community: string, options?: SessionOptions): SnmpSession
  export function createV3Session(target: string, user: V3Options): SnmpSession

  export function isVarbindError(varbind: VarBind): boolean

}

