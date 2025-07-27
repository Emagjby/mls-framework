"use client";

import { useEffect, useState } from "react";

/**
 * Hook to safely execute client-side code after hydration
 * @param callback Function to execute after hydration
 * @param deps Dependencies for the effect
 */
export function useClientSide(
  callback: () => void | (() => void),
  deps: React.DependencyList = [],
) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      return callback();
    }
  }, [mounted, ...deps]);

  return mounted;
}

/**
 * Hook to get a value that's only available on the client side
 * @param getValue Function to get the value
 * @param defaultValue Default value to return during SSR
 */
export function useClientValue<T>(getValue: () => T, defaultValue: T): T {
  const [value, setValue] = useState<T>(defaultValue);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setValue(getValue());
  }, [getValue]);

  return mounted ? value : defaultValue;
}

/**
 * Hook to safely access browser APIs
 * @param apiCheck Function to check if API is available
 * @param defaultValue Default value if API is not available
 */
export function useBrowserAPI<T>(apiCheck: () => T | null, defaultValue: T): T {
  return useClientValue(() => apiCheck() ?? defaultValue, defaultValue);
}
