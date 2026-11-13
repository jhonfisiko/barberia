import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

// false en el servidor, true en el navegador (sin usar useEffect)
export function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}