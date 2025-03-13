import {useMemo} from "react";
import {JSONSerializable} from "@/lib/types";

export function useJSONMemo<T extends JSONSerializable<never>>(value: T) {
  const jsonString = JSON.stringify(value);
  return useMemo<T>(() => JSON.parse(jsonString), [jsonString]);
}