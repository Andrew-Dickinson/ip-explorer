import {useEffect, useState} from "react";
import {runParallelAction} from "next-server-actions-parallel";
import {useJSONMemo} from "@/lib/hooks/use-json-memo";
import {JSONSerializable} from "@/lib/types";
import {useLocalStorage} from "@/lib/hooks/use-local-storage";
import {TOKEN_STORAGE_KEY} from "@/lib/constants";


export interface DataActionError {
  message: string;
}
// <T, U extends unknown[]>(action: (...args: U) => Promise<T>)
export function useNextParallelDataAction<T, U extends JSONSerializable<never>[]>(action: (...args: U) => Promise<readonly [Promise<T>]>, args: U, refreshTime?: Date, ready?: boolean): [T | undefined, boolean, DataActionError | undefined] {
  const [result, setResult] = useState<T | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<DataActionError | undefined>();
  const [secureContentToken, setSecureContentToken] = useLocalStorage<string>(TOKEN_STORAGE_KEY);

  // We do something a little bit counterintuitive here where we serialize and de-serialize from JSON in order to get
  // around the shallow equality checks performed by useEffect(). This is fine as a limitation since action parameters
  // need to be JSON serializable anyway
  const argsMemo = useJSONMemo(args);

  useEffect(() => {
    // const inputParamsParsed: U = JSON.parse(inputParamsJSON);

    let isCancelled = false;
    const callAction = async () => {
      try {
        setError(undefined)
        setIsLoading(true)
        const result = await runParallelAction(action(...argsMemo));
        if (isCancelled) return;
        if (result instanceof Object) {
          if ('error' in result && typeof result.error === "string") {
            setError({message: result.error})
            setResult(undefined)
          } else if ('invalidToken' in result && result.invalidToken) {
            setError({message: "Invalid token"})
            setResult(undefined)

            // Unset the stored token, to force the user to re-enter the PSK, in case it has rotated server-side
            // but only if we actually have a value for the token. If we don't have a value for the token then the
            // error is expected and may just be that things haven't loaded up yet
            if (secureContentToken) {
              setSecureContentToken(undefined);
            }
          } else {
            setResult(result)
          }
        }
      } catch (err) {
        if (isCancelled) return;
        setError({message: err instanceof Error ? err.message : "Unknown error"})
        setResult(undefined)
      } finally {
        if (!isCancelled) setIsLoading(false)
      }
    }

    // If the caller gives us a ready flag, don't call the backend until they're ready
    // (their parameters are probably still loading async)
    // If the caller doesn't give us a ready flag, just assume they're always ready
    if (ready === undefined || ready) {
      callAction()
    }
    return () => { isCancelled = true;}
  }, [action, argsMemo, refreshTime, secureContentToken, setSecureContentToken, ready])

  return [result, isLoading, error];
}
