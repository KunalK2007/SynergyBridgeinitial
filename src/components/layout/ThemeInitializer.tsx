"use client";

import { useEffect } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { getUserSettings, applyTheme, applyAccessibility } from "@/lib/services/user-settings";

export function ThemeInitializer() {
  const { currentUser } = useAuth();

  useEffect(() => {
    // 1. Initial immediate theme setup from local storage / default
    const storageKey = "synergybridge_user_settings";
    try {
      const local = localStorage.getItem(storageKey);
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed.theme) {
          applyTheme(parsed.theme);
        }
        if (parsed.compactMode !== undefined || parsed.reducedMotion !== undefined) {
          applyAccessibility(!!parsed.compactMode, !!parsed.reducedMotion);
        }
      } else {
        applyTheme("system");
      }
    } catch {
      applyTheme("system");
    }

    // 2. If user is logged in, fetch persisted Firestore settings
    if (currentUser?.uid) {
      getUserSettings(currentUser.uid).then((settings) => {
        applyTheme(settings.theme);
        applyAccessibility(settings.compactMode, settings.reducedMotion);
      });
    }
  }, [currentUser?.uid]);

  return null;
}
