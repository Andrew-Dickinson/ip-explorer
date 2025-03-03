export interface UispDeviceIdentification {
  id?: string;
  name?: string;
  hostname?: string;
  model?: string;
  role?: string;
  site?: {
    name?: string;
  };
}

export interface UispDeviceOverview {
  status?: string;
}

export interface UispDeviceAddress {
  cidr?: string;
}

export interface UispDeviceInterface {
  addresses?: UispDeviceAddress[];
}

export interface UispDevice {
  identification?: UispDeviceIdentification;
  overview?: UispDeviceOverview;
  ipAddress?: string;
  ipAddressList?: string[];
  interfaces?: UispDeviceInterface[];
}

// Type guard function
export function isUispDeviceArray(obj: unknown): obj is UispDevice[] {
  return (
    Array.isArray(obj) &&
    obj.every((item) => typeof item === "object" && item !== null && "identification" in item && "overview" in item)
  )
}
