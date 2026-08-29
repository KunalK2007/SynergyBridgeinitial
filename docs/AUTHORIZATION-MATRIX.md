# SynergyBridge Authorization Matrix

This document defines the Role-Based Access Control (RBAC) rules enforced across the SynergyBridge platform, covering both Firestore Rules and backend Server API validations.

| Resource | Student | Mentor | Faculty | Industry / Govt | Coordinator | Admin | Public |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Own Profile** | Read/Write | Read/Write | Read/Write | Read/Write | Read/Write | Read/Write | None |
| **Other Profiles** | Restricted | Restricted | Restricted | Restricted | Authorized | Authorized | None |
| **Problems** | Read | Read | CRUD (Owned) | CRUD (Owned) | Manage | Manage | Published Only |
| **Applications** | Own | Assigned/Reviewer | Institution Scope | Owned Problems | Authorized | All | None |
| **Projects** | Own/Team | Assigned | Authorized | Authorized | Institution | All | None |
| **AI Mentor** | Own | Restricted | None | None | None | Audit Only | None |
| **Gamification**| Own | Restricted | Restricted | Restricted | Authorized | Authorized | Leaderboard |
| **Certificates**| Own | Authorized | Authorized | Authorized | Authorized | All | Verify Only |
| **Funding** | Own/Read | Authorized | Authorized | Authorized | Manage | All | None |
| **Analytics** | Own | Own Scope | Institution | Authorized | Institution | Platform | None |

## Core Principles

1. **Server Authority**: Critical state (XP, scores, statuses, funding amounts, certificate generation) is NEVER derived from client input.
2. **Least Privilege**: Users only receive read/write access to collections explicitly required for their journey.
3. **Deterministic Truth**: AI recommendations and analytics strictly interpret database state but never mutate it.

## Audited Collections

The above rules are explicitly implemented in `firestore.rules`, `storage.rules`, and verified securely via the backend helper `canAccessProject` (`src/lib/server/auth-helpers.ts`).
