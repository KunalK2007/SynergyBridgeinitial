# SynergyBridge — Theme & Dark Mode Architecture Fix

## Overview
This document outlines the root cause investigation, architectural resolution, and validation for the **Settings → Theme & Visual Style** dark mode functionality in SynergyBridge.

---

## 1. Root Cause Analysis

1. **Missing CSS Theme Variables for `.dark`**:
   - `src/app/globals.css` only defined `:root` light palette variables (`--color-bg: #F6F5F2`, `--color-text: #1C1C1E`, `--color-bg-card: #EFEDE8`, etc.).
   - When the user selected "Dark Mode" and `.dark` / `data-theme="dark"` was attached to `<html>`, the CSS variables remained strictly locked to light off-white and dark text values.
2. **Missing Tailwind v4 Dark Variant**:
   - Tailwind CSS v4 requires `@custom-variant dark (&:where(.dark, [data-theme="dark"], .dark *, [data-theme="dark"] *));` in `globals.css` to trigger `dark:` class modifiers across DOM nodes.
3. **Hardcoded Backgrounds in Layout Shells & Cards**:
   - `DashboardShell` hardcoded `bg-[#F6F5F2]` instead of responsive dark background tokens (`bg-[#F6F5F2] dark:bg-[#0B0D14]`).
   - Base UI components (`Card`, `Input`, `Button`, `EmptyState`, `Skeleton`) lacked `dark:` token classes for dark mode rendering.
4. **Lack of Synchronous Pre-Paint Theme Initialization**:
   - Page refreshes risked flashing the default light canvas before asynchronous client React effects mounted.

---

## 2. Architecture & Implementation

### A. Global CSS Token System (`src/app/globals.css`)
- Added `@custom-variant dark` for selector scoping across `.dark` and `[data-theme="dark"]`.
- Defined full semantic color tokens for dark mode:
  - `--color-bg: #0B0D14;` (Deep obsidian background)
  - `--color-bg-card: #131722;` (Dark navy card surface)
  - `--color-text: #F3F4F6;` (High-contrast near-white text)
  - `--color-secondary: #9499AD;` (Subtle muted slate)
  - `--color-base: #0F111A;` (Navigation and header surface)
  - `--color-accent: #C4A880;` / `--color-accent-hover: #9C7A4C;` (Theme bronze)

### B. Anti-FOUC & Hydration Safe Initialization (`src/app/layout.tsx` & `ThemeInitializer.tsx`)
- Added synchronous inline script in `<head>` that reads `localStorage("synergybridge_user_settings")` or detects `window.matchMedia("(prefers-color-scheme: dark)")` before DOM rendering.
- Set `suppressHydrationWarning` on `<html>`.
- Mounted `<ThemeInitializer />` within `RootLayout` so theme synchronization is application-wide across all authenticated dashboard, public showcase, and profile routes.

### C. Real-Time Theme & System Preference Sync (`src/lib/services/user-settings.ts`)
- `applyTheme(theme: ThemePreference)`:
  - **`dark`**: Adds `.dark` class and sets `data-theme="dark"`.
  - **`light`**: Removes `.dark` class and sets `data-theme="light"`.
  - **`system`**: Evaluates `window.matchMedia("(prefers-color-scheme: dark)")` and attaches a dynamic change listener to instantly react if the user's OS switches between light and dark modes.

### D. Component Dark Mode Alignment
- Enhanced `Card`, `CardTitle`, `CardDescription`, `Input`, `Button`, `EmptyState`, `Skeleton`, `DashboardShell`, `RoleDashboard`, `SettingsPage`, `ProjectsDashboardPage`, `ProblemsDashboardPage`, and `ProfilePage`.

---

## 3. Verification & Acceptance Testing

- **TypeScript Checking**: `npx tsc --noEmit` — 0 errors
- **ESLint**: `npm run lint` — 0 errors
- **Unit Tests**: `npx vitest run` — 28 test suites passed (125 tests total)
- **Production Build**: `npm run build` — 58 static & dynamic routes compiled

### Manual Verification Flow
1. Open `/dashboard/settings` → Appearance tab.
2. Select **Dark Mode** → UI immediately turns to dark theme, and card displays the active checkmark.
3. Click **Save Appearance** → Setting persists to `localStorage` and `Firestore`.
4. Navigate across `/dashboard/student`, `/dashboard/projects`, `/dashboard/problems`, `/dashboard/profile`.
5. Refresh the browser → Dark mode persists with zero flash or hydration errors.
6. Switch to **Light Mode** or **System Default** → Theme responds accurately.
