"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

type UseUrlStateOptions<T> = {
  defaultValue?: T
  paramName?: string
  serializer: (value: T) => string
  deserializer: (value: string | null) => T
}

export function useUrlState<T = string>(options: UseUrlStateOptions<T>): [T | undefined, (value: T) => void] {
  const { defaultValue, paramName = "state", serializer, deserializer } = options

  const router = useRouter()
  const searchParams = useSearchParams()
  const [state, setState] = useState<T | undefined>(defaultValue)

  const paramValue = searchParams.get(paramName);

  // Initialize state from URL on first render
  useEffect(() => {
    try {
      setState(deserializer(paramValue))
    } catch (error) {
      console.error("Failed to deserialize URL parameter:", error)
      setState(defaultValue)
    }
  }, [paramValue, deserializer, defaultValue])

  // Update URL when state changes
  const updateState = useCallback(
    (newValue: T) => {

      const params = new URLSearchParams(searchParams.toString())

      try {
        const serialized = serializer(newValue)
        params.set(paramName, serialized)
      } catch (error) {
        console.error("Failed to serialize state:", error)
        params.set(paramName, "")
      }

      const newUrl = `${window.location.pathname}?${params.toString()}`

      // Update the URL bar directly because NextJS is INCREDIBLY slow to do this
      const oldState = window.history.state;
      window.history.pushState(oldState?.data, oldState?.title, newUrl)

      // Also update it via NextJS for browser back, etc
      router.replace(newUrl)

      setState(newValue)
    },
    [router, searchParams, paramName, serializer],
  )

  return [state, updateState]
}

