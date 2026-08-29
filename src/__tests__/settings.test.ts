/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getUserSettings, saveUserSettings, applyTheme, applyAccessibility } from "@/lib/services/user-settings";
import { DEFAULT_USER_SETTINGS, UserSettings } from "@/types/settings";

// Mock Firebase Firestore
const mockSetDoc = vi.fn().mockResolvedValue(undefined);
const mockGetDoc = vi.fn();

vi.mock("firebase/firestore", () => ({
  doc: (db: any, collection: string, id: string) => ({ collection, id }),
  getDoc: (docRef: any) => mockGetDoc(docRef),
  setDoc: (docRef: any, data: any, options: any) => mockSetDoc(docRef, data, options),
  updateDoc: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/firebase/client", () => ({
  db: {},
  auth: {
    currentUser: {
      uid: "user_test_123",
      email: "student.demo@synergybridge.local"
    }
  }
}));

describe("Settings Service & Configuration Test Suite", () => {
  let mockDocElement: any;
  let mockBody: any;

  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof localStorage !== "undefined") {
      localStorage.clear();
    }

    mockDocElement = {
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
        contains: vi.fn()
      },
      setAttribute: vi.fn(),
      getAttribute: vi.fn()
    };

    mockBody = {
      classList: {
        classes: new Set<string>(),
        add: vi.fn((cls: string) => mockBody.classList.classes.add(cls)),
        remove: vi.fn((cls: string) => mockBody.classList.classes.delete(cls)),
        contains: vi.fn((cls: string) => mockBody.classList.classes.has(cls))
      }
    };

    (global as any).document = {
      documentElement: mockDocElement,
      body: mockBody
    };

    (global as any).window = {
      matchMedia: vi.fn().mockReturnValue({ matches: false }),
      localStorage: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        clear: vi.fn()
      }
    };
  });

  it("returns default settings when user document does not exist", async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => false,
      data: () => undefined
    });

    const settings = await getUserSettings("user_test_123");

    expect(settings.userId).toBe("user_test_123");
    expect(settings.theme).toBe("light");
    expect(settings.notifications.projectUpdates).toBe(true);
    expect(settings.privacy.visibleToMentors).toBe(true);
    expect(settings.application.defaultDashboard).toBe("overview");
  });

  it("loads and merges existing settings from Firestore", async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        theme: "dark",
        compactMode: true,
        notifications: {
          projectUpdates: false,
          messages: true
        },
        privacy: {
          showSkills: false
        }
      })
    });

    const settings = await getUserSettings("user_test_123");

    expect(settings.theme).toBe("dark");
    expect(settings.compactMode).toBe(true);
    expect(settings.notifications.projectUpdates).toBe(false);
    expect(settings.notifications.messages).toBe(true);
    expect(settings.privacy.showSkills).toBe(false);
    expect(settings.privacy.visibleToMentors).toBe(true); // default preserved
  });

  it("saves updated settings to Firestore with merge", async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => DEFAULT_USER_SETTINGS
    });

    const updates: Partial<UserSettings> = {
      theme: "light",
      notifications: {
        ...DEFAULT_USER_SETTINGS.notifications,
        deadlines: false
      }
    };

    const saved = await saveUserSettings("user_test_123", updates);

    expect(saved.theme).toBe("light");
    expect(saved.notifications.deadlines).toBe(false);
    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.objectContaining({ collection: "userSettings", id: "user_test_123" }),
      expect.objectContaining({ theme: "light" }),
      { merge: true }
    );
  });

  it("applies theme to document element correctly", () => {
    applyTheme("dark");
    expect(mockDocElement.setAttribute).toHaveBeenCalledWith("data-theme", "dark");
    expect(mockDocElement.classList.add).toHaveBeenCalledWith("dark");

    applyTheme("light");
    expect(mockDocElement.setAttribute).toHaveBeenCalledWith("data-theme", "light");
    expect(mockDocElement.classList.remove).toHaveBeenCalledWith("dark");
  });

  it("applies accessibility classes to document body", () => {
    applyAccessibility(true, true);
    expect(mockBody.classList.contains("compact-mode")).toBe(true);
    expect(mockBody.classList.contains("reduced-motion")).toBe(true);

    applyAccessibility(false, false);
    expect(mockBody.classList.contains("compact-mode")).toBe(false);
    expect(mockBody.classList.contains("reduced-motion")).toBe(false);
  });

  it("ensures User A cannot modify User B's settings", async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => DEFAULT_USER_SETTINGS
    });

    await saveUserSettings("user_A_id", { theme: "dark" });
    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.objectContaining({ id: "user_A_id" }),
      expect.anything(),
      expect.anything()
    );

    expect(mockSetDoc).not.toHaveBeenCalledWith(
      expect.objectContaining({ id: "user_B_id" }),
      expect.anything(),
      expect.anything()
    );
  });
});
