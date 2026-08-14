import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { UserSettings, DEFAULT_USER_SETTINGS, ThemePreference } from "@/types/settings";

const SETTINGS_STORAGE_KEY = "synergybridge_user_settings";

/**
 * Loads the user settings from Firestore with a fallback to localStorage/defaults.
 */
export async function getUserSettings(userId: string): Promise<UserSettings> {
  const defaultSettings: UserSettings = {
    userId,
    ...DEFAULT_USER_SETTINGS,
    updatedAt: Date.now(),
  };

  if (!userId) return defaultSettings;

  try {
    const docRef = doc(db, "userSettings", userId);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const data = snap.data();
      const merged: UserSettings = {
        userId,
        theme: data.theme || DEFAULT_USER_SETTINGS.theme,
        compactMode: data.compactMode ?? DEFAULT_USER_SETTINGS.compactMode,
        reducedMotion: data.reducedMotion ?? DEFAULT_USER_SETTINGS.reducedMotion,
        notifications: {
          ...DEFAULT_USER_SETTINGS.notifications,
          ...(data.notifications || {}),
        },
        privacy: {
          ...DEFAULT_USER_SETTINGS.privacy,
          ...(data.privacy || {}),
        },
        application: {
          ...DEFAULT_USER_SETTINGS.application,
          ...(data.application || {}),
        },
        updatedAt: data.updatedAt || Date.now(),
      };

      if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
        window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged));
      }
      return merged;
    }
  } catch (err) {
    console.warn("Could not fetch user settings from Firestore, checking local storage:", err);
  }

  // Check localStorage fallback
  if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
    try {
      const local = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed.userId === userId) {
          return parsed as UserSettings;
        }
      }
    } catch {
      // Ignore json parse error
    }
  }

  return defaultSettings;
}

/**
 * Persists the user settings to Firestore and localStorage.
 */
export async function saveUserSettings(
  userId: string,
  settings: Partial<UserSettings>
): Promise<UserSettings> {
  const current = await getUserSettings(userId);
  const updated: UserSettings = {
    ...current,
    ...settings,
    userId,
    notifications: {
      ...current.notifications,
      ...(settings.notifications || {}),
    },
    privacy: {
      ...current.privacy,
      ...(settings.privacy || {}),
    },
    application: {
      ...current.application,
      ...(settings.application || {}),
    },
    updatedAt: Date.now(),
  };

  try {
    const docRef = doc(db, "userSettings", userId);
    await setDoc(docRef, updated, { merge: true });
  } catch (err) {
    console.warn("Could not save settings to Firestore, persisting locally:", err);
  }

  if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
    applyTheme(updated.theme);
    applyAccessibility(updated.compactMode, updated.reducedMotion);
  }

  return updated;
}

/**
 * Applies the selected theme to the root HTML element immediately.
 */
export function applyTheme(theme: ThemePreference) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
    root.setAttribute("data-theme", "dark");
  } else if (theme === "light") {
    root.classList.remove("dark");
    root.setAttribute("data-theme", "light");
  } else {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (prefersDark) {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
    } else {
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
    }
  }
}

/**
 * Applies accessibility attributes to the document body.
 */
export function applyAccessibility(compactMode: boolean, reducedMotion: boolean) {
  if (typeof document === "undefined") return;

  if (compactMode) {
    document.body.classList.add("compact-mode");
  } else {
    document.body.classList.remove("compact-mode");
  }

  if (reducedMotion) {
    document.body.classList.add("reduced-motion");
  } else {
    document.body.classList.remove("reduced-motion");
  }
}
