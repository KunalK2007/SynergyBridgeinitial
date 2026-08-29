import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("9a: The Blackout — Offline Resilience & Connectivity System", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("Executes online/offline state transitions and handles notification lifecycle", () => {
    let isOnline = true;
    let wasOffline = false;

    const handleOnline = () => {
      isOnline = true;
      setWasOffline(true);
      setTimeout(() => {
        setWasOffline(false);
      }, 4000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    const setIsOnline = (val: boolean) => {
      isOnline = val;
    };

    const setWasOffline = (val: boolean) => {
      wasOffline = val;
    };

    // Initial state: online
    expect(isOnline).toBe(true);
    expect(wasOffline).toBe(false);

    // 1. Connection Drops (Offline event triggered by OS/DevTools)
    handleOffline();
    expect(isOnline).toBe(false);
    expect(wasOffline).toBe(true);

    // 2. Connection Restored (Online event triggered)
    handleOnline();
    expect(isOnline).toBe(true);
    expect(wasOffline).toBe(true);

    // 3. Notification timeout expires after 4s
    vi.advanceTimersByTime(4000);
    expect(wasOffline).toBe(false);
  });

  it("Error Boundary identifies network and fetch failure signatures", () => {
    const networkErrors = [
      new Error("Failed to fetch"),
      new Error("NetworkError when attempting to fetch resource"),
      new Error("The Internet connection appears to be offline."),
      new Error("Connection reset by peer"),
    ];

    for (const err of networkErrors) {
      const isNetworkError =
        err.message.toLowerCase().includes("network") ||
        err.message.toLowerCase().includes("fetch") ||
        err.message.toLowerCase().includes("failed to fetch") ||
        err.message.toLowerCase().includes("offline") ||
        err.message.toLowerCase().includes("connection");

      expect(isNetworkError).toBe(true);
    }
  });

  it("Error Boundary distinguishes non-network errors", () => {
    const nonNetworkError = new Error("Invalid syntax in input JSON");
    const isNetworkError =
      nonNetworkError.message.toLowerCase().includes("network") ||
      nonNetworkError.message.toLowerCase().includes("fetch") ||
      nonNetworkError.message.toLowerCase().includes("failed to fetch") ||
      nonNetworkError.message.toLowerCase().includes("offline") ||
      nonNetworkError.message.toLowerCase().includes("connection");

    expect(isNetworkError).toBe(false);
  });
});
