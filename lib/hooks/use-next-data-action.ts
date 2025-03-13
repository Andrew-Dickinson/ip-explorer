import {useEffect, useState} from "react";
import {runParallelAction} from "next-server-actions-parallel";
import {useJSONMemo} from "@/lib/hooks/use-json-memo";
import {JSONSerializable} from "@/lib/types";


interface DataActionError {
  message: string;
}
// <T, U extends unknown[]>(action: (...args: U) => Promise<T>)
export function useNextParallelDataAction<T, U extends JSONSerializable<never>[]>(action: (...args: U) => Promise<readonly [Promise<T>]>, args: U): [T | undefined, boolean, DataActionError | undefined] {
  const [result, setResult] = useState<T | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<DataActionError | undefined>();

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
        setResult(result)
        console.log(action.name);
      } catch (err) {
        setError({message: err instanceof Error ? err.message : "Unknown error"})
        setResult(undefined)
      } finally {
        if (!isCancelled) setIsLoading(false)
      }
    }

    callAction()
    return () => { isCancelled = true;}
  }, [action, argsMemo])

  return [result, isLoading, error];
}
