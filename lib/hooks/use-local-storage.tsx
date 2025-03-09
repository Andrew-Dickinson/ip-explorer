"use client"

import { useState, useEffect, useCallback } from "react"

// Type for the setter function - similar to React's setState
type SetValue<T> = (value: T | ((prevValue: T) => T)) => void

/**
 * Custom hook for managing state in localStorage
 * @param key The localStorage key
 * @param initialValue The initial value (or function that returns the initial value)
 * @returns A stateful value and a function to update it
 */
export function useLocalStorage<T>(key: string, initialValue?: T | (() => T)): [T | undefined, SetValue<T | undefined>] {
  // Get the initial value from localStorage or use the provided initialValue
  const readValue = useCallback((): T | undefined => {
    // Check if we're in a browser environment
    if (typeof window === "undefined") {
      return typeof initialValue === "function" ? (initialValue as () => T)() : initialValue
    }

    try {
      const item = window.localStorage.getItem(key)
      return item
        ? (JSON.parse(item) as T)
        : typeof initialValue === "function"
          ? (initialValue as () => T)()
          : initialValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return typeof initialValue === "function" ? (initialValue as () => T)() : initialValue
    }
  }, [initialValue, key])

  // State to store our value
  const [storedValue, setStoredValue] = useState<T | undefined>(readValue)

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue: SetValue<T | undefined> = useCallback(
    (value) => {
      try {
        // Allow value to be a function so we have the same API as useState
        const valueToStore = value instanceof Function ? value(storedValue) : value

        // Save state
        setStoredValue(valueToStore)

        // Save to localStorage
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore))

          // Dispatch a custom event so other instances of the hook know to update
          window.dispatchEvent(new Event("local-storage-change"))
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error)
      }
    },
    [key, storedValue],
  )

  // Listen for changes to this localStorage key in other documents/tabs
  useEffect(() => {
    const handleStorageChange = () => {
      setStoredValue(readValue())
    }

    // Listen for our custom event and the native storage event
    window.addEventListener("local-storage-change", handleStorageChange)
    window.addEventListener("storage", handleStorageChange)

    // Read the value from localStorage if it changes in another tab
    return () => {
      window.removeEventListener("local-storage-change", handleStorageChange)
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [readValue])

  return [storedValue, setValue]
}

