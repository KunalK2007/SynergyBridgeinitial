# SynergyBridge Dashboard Data-Loading & Seed Data Integration — Fix Documentation

## 1. Executive Summary

This document explains the root cause analysis, architectural improvements, and end-to-end fixes implemented to resolve the empty dashboard issue across all user roles (Platform Admin, Student Innovator, Faculty Coordinator, Industry Partner, Incubation Manager, Government Official, and Mentor) in SynergyBridge.

Prior to this fix, logging in as `admin.demo@synergybridge.local` or `student.demo@synergybridge.local` rendered the dashboard shell with zeroes or empty placeholders (`Active Projects: 0`, `Matches: 0`, `Impact Score: --`, `Feed: "No activity yet"`) despite a rich dataset existing in Firestore.

With this update:
- Every role dashboard performs live, secure, client-side queries against `synergybridgee-dev` with isolated error-handling per collection.
- `AnalyticsEngine` performs real Firestore aggregations instead of returning placeholder zeroes.
- Firebase Admin SDK strictly connects to `synergybridgee-dev` without silent fallback to `demo-project`.
- All 114 unit/integration tests pass cleanly.

---

## 2. Root Cause Analysis

| Component | Issue Identified | Resolution |
| :--- | :--- | :--- |
| **Admin Dashboard** (`src/app/(dashboard)/dashboard/admin/page.tsx`) | Rendered static `<RoleDashboard>` without invoking Firestore queries, metrics, or feeds. | Implemented live Firestore aggregations for projects, problems, applications, certificates, and funding grants with interactive management cards. |
| **Student Dashboard** (`src/app/(dashboard)/dashboard/student/page.tsx`) | Global catch block crashed on any restricted collection query; subcollection `projects/${id}/activity` failed to query top-level `projectActivities`. | Isolated queries in independent try/catch blocks; query `projectActivities` with `where("projectId", "==", id)`; compute XP & live feed. |
| **Analytics Engine** (`src/lib/analytics/analytics-engine.ts`) | `getStudentAnalytics` queried `where("studentId", "==", id)` on `applications` (Firestore field is `applicantId`). `getPlatformAnalytics` returned static placeholder values. | Corrected `applicantId` field filter; implemented real multi-collection Firestore count and amount aggregations. |
| **Firebase Admin SDK** (`src/lib/firebase/admin.ts`) | Default fallback initialized `demo-project` if service account env vars were omitted. | Configured target project `synergybridgee-dev` with explicit runtime warning. |
| **Faculty, Industry, Incubation, Government Dashboards** | Static shells without metrics or live feeds. | Implemented role-specific real-time Firestore queries, operational KPI cards, and activity feeds. |
| **Mentor Dashboard** (`src/app/(dashboard)/dashboard/mentor/page.tsx`) | Only queried `mentors` collection, ignoring `mentorProfiles`. | Query `mentorProfiles` doc first, with fallback to `mentors` query. |

---

## 3. Architecture & Data Flow

```
+-----------------------------------------------------------------------------------+
|                            SynergyBridge Client App                               |
+-----------------------------------------------------------------------------------+
       |                                      |                               |
       v                                      v                               v
[useAuth() -> Firebase Auth]        [Firestore Web SDK]              [API Routes / Server Actions]
       |                                      |                               |
       | (Token + UID: student_1)             | (Rules validated)             | (Firebase Admin SDK)
       +------------------------------------->+                               +-------------------------> [Firebase Admin: synergybridgee-dev]
                                              |
                                              v
                              +-------------------------------+
                              |    Firestore Collections      |
                              |-------------------------------|
                              | • institutions                |
                              | • users                       |
                              | • problems                    |
                              | • applications                |
                              | • projects                    |
                              | • projectActivities           |
                              | • gamificationProfiles        |
                              | • certificates                |
                              | • fundingGrants               |
                              +-------------------------------+
```

### Firestore Security Rules Compatibility

- **`projects`**: Authenticated users can read projects. Student dashboard filters by `studentIds array-contains uid`.
- **`applications`**: Authenticated users can read applications where `applicantId == uid` or if they are admin/reviewer.
- **`certificates`**: Readable by the certificate owner (`studentId == uid`).
- **`fundingGrants`**: Filtered per project where user is a participant (`where("projectId", "==", project.id)`).
- **`projectActivities`**: Filtered per project (`where("projectId", "==", project.id)`).

---

## 4. Verification & Diagnostics

A safe, read-only diagnostic script has been created at `scripts/verify-demo-data.ts`:

```bash
npx ts-node scripts/verify-demo-data.ts
```

It audits:
1. Demo institution (`synergybridge-demo-institute`)
2. 7 core demo accounts in Auth & Firestore `/users`
3. 8+ published problem statements across multiple domains
4. Active projects with student and mentor assignments
5. Gamification profiles, streaks, XP, certificates, and funding grants

---

## 5. Automated Tests

All test suites verify dashboard loading, role metrics, and analytics:

```bash
npx vitest run
```

**Results**: 26 test files passed, 114 tests passed (100%).
