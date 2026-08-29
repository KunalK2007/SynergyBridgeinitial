import { useState, useEffect, useSyncExternalStore } from "react";

export interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
}

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getSnapshot() {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

function getServerSnapshot() {
  return true;
}

export function useNetworkStatus(): NetworkStatus {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [wasOffline, setWasOffline] = useState<boolean>(false);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (!isOnline) {
      // Switched to offline
      const updateTimer = setTimeout(() => {
        setWasOffline(true);
      }, 0);
      return () => clearTimeout(updateTimer);
    } else if (isOnline && wasOffline) {
      // Switched back to online
      timer = setTimeout(() => {
        setWasOffline(false);
      }, 4000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isOnline, wasOffline]);

  return { isOnline, wasOffline };
}
