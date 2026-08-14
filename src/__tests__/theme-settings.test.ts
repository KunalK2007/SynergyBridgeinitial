/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { applyTheme, getUserSettings, saveUserSettings } from "@/lib/services/user-settings";

// Mock Firestore
const mockFirestoreData: Record<string, any> = {};

vi.mock("firebase/firestore", () => ({
  doc: vi.fn((_db, coll, id) => ({ path: `${coll}/${id}`, id })),
  getDoc: vi.fn().mockImplementation((docRef) => ({
    exists: () => !!mockFirestoreData[docRef.id],
    data: () => mockFirestoreData[docRef.id] || {},
  })),
  setDoc: vi.fn().mockImplementation((docRef, data) => {
    mockFirestoreData[docRef.id] = { ...(mockFirestoreData[docRef.id] || {}), ...data };
    return Promise.resolve();
  }),
  updateDoc: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/firebase/client", () => ({
  db: {},
  auth: {},
}));

describe("Theme & Visual Style System", () => {
  let mockDocElement: any;
  let mockStorage: Record<string, string>;

  beforeEach(() => {
    mockStorage = {};
    const localStore = {
      getItem: vi.fn((key: string) => mockStorage[key] || null),
      setItem: vi.fn((key: string, val: string) => {
        mockStorage[key] = val;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorage[key];
      }),
      clear: vi.fn(() => {
        mockStorage = {};
      }),
    };

    const docClasses = new Set<string>();
    const docAttributes: Record<string, string> = {};

    mockDocElement = {
      classList: {
        add: vi.fn((cls: string) => docClasses.add(cls)),
        remove: vi.fn((cls: string) => docClasses.delete(cls)),
        contains: vi.fn((cls: string) => docClasses.has(cls)),
      },
      setAttribute: vi.fn((k: string, v: string) => {
        docAttributes[k] = v;
      }),
      getAttribute: vi.fn((k: string) => docAttributes[k] || null),
    };

    (global as any).localStorage = localStore;
    (global as any).document = {
      documentElement: mockDocElement,
      body: {
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
        },
      },
    };

    (global as any).window = {
      localStorage: localStore,
      matchMedia: vi.fn().mockImplementation((query: string) => ({
        matches: query.includes("prefers-color-scheme: dark"),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    };
  });

  it("applies dark mode to document root element", () => {
    applyTheme("dark");
    expect(mockDocElement.classList.contains("dark")).toBe(true);
    expect(mockDocElement.getAttribute("data-theme")).toBe("dark");
  });

  it("applies light mode to document root element", () => {
    mockDocElement.classList.add("dark");
    mockDocElement.setAttribute("data-theme", "dark");

    applyTheme("light");
    expect(mockDocElement.classList.contains("dark")).toBe(false);
    expect(mockDocElement.getAttribute("data-theme")).toBe("light");
  });

  it("applies system mode based on matchMedia preferences", () => {
    applyTheme("system");
    expect(mockDocElement.classList.contains("dark")).toBe(true);
    expect(mockDocElement.getAttribute("data-theme")).toBe("dark");
  });

  it("persists selected dark theme across save and retrieval", async () => {
    const userId = "test-user-theme-123";
    const updated = await saveUserSettings(userId, { theme: "dark" });
    
    expect(updated.theme).toBe("dark");
    expect(mockDocElement.classList.contains("dark")).toBe(true);

    const retrieved = await getUserSettings(userId);
    expect(retrieved.theme).toBe("dark");
  });

  it("persists selected light theme across save and retrieval", async () => {
    const userId = "test-user-theme-456";
    const updated = await saveUserSettings(userId, { theme: "light" });
    
    expect(updated.theme).toBe("light");
    expect(mockDocElement.classList.contains("dark")).toBe(false);

    const retrieved = await getUserSettings(userId);
    expect(retrieved.theme).toBe("light");
  });
});
