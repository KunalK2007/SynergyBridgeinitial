# Trust & Evidence Implementation Plan

**NOTICE: This is an analysis-only document. No existing code, UI, or database configuration has been modified. This plan must be approved before any implementation begins.**

## 1. Existing Architecture Findings
SynergyBridge utilizes a Next.js App Router architecture with React Server Components. The backend relies on Firebase Admin SDK via Next.js API Routes and Server Actions for authoritative data mutations. State changes are guarded by server-side validation using Zod schemas and strict Role-Based Access Control (RBAC).

## 2. Existing Reusable Components
- `src/components/ui/Card.tsx`, `Badge.tsx`, `Button.tsx`: Foundational elements for building the future `TrustCard`.
- `DashboardShell.tsx`: The primary navigation wrapper where a future `/dashboard/trust` route can be seamlessly integrated.
- `ProjectActivity` patterns: Can be adapted to render the future `Evidence Timeline`.

## 3. Existing Firebase Architecture
- All authoritative writes utilize `adminDb.runTransaction()` to guarantee idempotency and prevent race conditions.
- The `platform_audit` and `activity` subcollections provide an established pattern for logging system events.
- Client-side reads are permitted, but writes are exclusively routed through secure server endpoints.

## 4. Existing Authentication/RBAC
- `useAuth()` hook provides client-side session state (`currentUser`).
- The `UserRole` enum (`ADMIN`, `FACULTY`, `MENTOR`, `INDUSTRY`, `GOVERNMENT`, `INCUBATION`, `STUDENT`) is deeply integrated into the system.
- `src/lib/server/auth-helpers.ts` provides server-side authorization boundaries that can be extended for Trust Reviewers.

## 5. Existing AI Architecture
- The `OriginalityService` (`src/lib/server/originality-service.ts`) already demonstrates the paradigm of "AI as a signal, not an authority." It generates a 0-100 `OriginalityReport` score, but human cryptographic signatures are ultimately required for funding disbursal.
- This existing boundary ensures AI cannot independently mutate critical system state.

## 6. Proposed Trust & Evidence Architecture
- **Data Layer:** New `trustClaims` and `trustEvidence` Firestore collections.
- **Service Layer:** A dedicated `TrustService` for encapsulating business logic, AI interactions, and transactional saves.
- **API Layer:** Next.js Route Handlers (`/api/trust/*`) heavily guarded by Firebase Auth token verification.
- **UI Layer:** A `TrustCard` widget embedded in existing views, and a dedicated `/dashboard/trust` workspace for authorized reviewers.

## 7. Proposed Firestore Model
```typescript
interface TrustClaim {
  id: string;
  targetId: string; // Project, Problem, or Incident ID
  targetType: "PROJECT" | "PROBLEM" | "INCIDENT" | "GENERAL";
  claimText: string;
  status: "UNVERIFIED" | "UNDER_REVIEW" | "PARTIALLY_VERIFIED" | "VERIFIED" | "DISPUTED" | "REJECTED";
  trustScore: number; // 0-100
  submittedBy: string;
  createdAt: number;
  reviewedBy?: string; // UID of authorized reviewer
  reviewedAt?: number;
  reviewNotes?: string;
}

interface TrustEvidence {
  id: string;
  claimId: string;
  source: string;
  sourceType: "OFFICIAL" | "ACADEMIC" | "INSTITUTION" | "EXPERT" | "NEWS" | "COMMUNITY" | "OTHER" | "SYSTEM_SIGNAL";
  sourceUrl?: string;
  summary: string;
  supportsClaim: boolean; // true = SUPPORTS, false = CONFLICTS
  reliabilityLevel: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";
  createdBy: string; // User ID or "SYSTEM"
  createdAt: number;
}
```

## 8. Proposed API Structure
- `POST /api/trust/claims`: Submit a new claim for review.
- `GET /api/trust/claims/[id]`: Fetch claim details and associated evidence graph.
- `POST /api/trust/evidence`: Submit supporting or conflicting evidence.
- `PATCH /api/trust/claims/[id]/review`: Update claim status (Restricted to Authorized Reviewers).

## 9. Proposed UI Structure
- **`TrustCard`**: A reusable widget displaying the current Status, the Trust Score (0-100 gauge), a primary evidence snippet, and a "Why this status?" popover.
- **`EvidenceViewer`**: A timeline showing `SUPPORTS` vs `CONFLICTS` edges.
- **`TrustCenter`**: A dashboard at `/dashboard/trust` for authorized users to triage pending claims.

## 10. Proposed Reviewer Workflow
1. **User Submission**: User submits a claim or reports a discrepancy.
2. **System Triage**: Claim defaults to `UNVERIFIED`.
3. **Evidence Gathering**: Users or AI attach `TrustEvidence` records.
4. **Human Review**: An authorized reviewer (e.g., `ADMIN` or `FACULTY`) analyzes the evidence graph.
5. **Final Status**: Reviewer explicitly transitions the status to `VERIFIED`, `DISPUTED`, etc.

## 11. Proposed Trust Scoring
- **0–100 Signal**: The score is purely an evidence aggregator. It must explicitly state: *"Trust score is an evidence signal, not a guarantee of truth."*
- **Positive Signals (+)**: Official evidence, independent supporting evidence, verified expert reviews.
- **Negative Signals (-)**: Conflicting evidence, unverified sources, coordination burst signals.
- The score dynamically updates as evidence is added, but absolute statuses (`VERIFIED`) require human assertion.

## 12. Proposed Evidence System
- Evidence items act as relational edges pointing to a `TrustClaim`.
- Each item explicitly declares its `sourceType`, `reliabilityLevel`, and whether it `supportsClaim`.
- This ensures conflicting information is mathematically represented and easily surfaced to human reviewers.

## 13. Proposed Coordination Detection
- **Signals**: Track duplicate submissions, highly similar semantic text, unusual submission bursts (e.g., 50 identical claims in 2 minutes), and repeated targets.
- **Action**: When detected, the system generates a `SYSTEM_SIGNAL` evidence record reading: *"Potential coordinated activity — human review required."*
- **Constraint**: The system must **never** automatically declare a user as fake or ban them based purely on these signals.

## 14. Proposed AI Role
- **Assistance**: AI summarizes long evidence texts, detects semantic similarity for coordination alerts, and flags potential contradictions.
- **Isolation**: AI operates as the `SYSTEM` user. It can append `TrustEvidence` but is strictly prohibited from mutating the authoritative `status` of a `TrustClaim` or issuing user bans.

## 15. Privacy Considerations
- **Data Minimization**: Collect only information necessary for verification.
- **Scraping Protections**: The system must respect `robots.txt`, access rules, paywalls, and CAPTCHAs.
- **No Accusations**: The UI must focus on verifying *information*, not labeling real people as malicious or fraudulent.
- **Anonymity**: Private user information of reporters must never be exposed publicly.

## 16. Security Considerations
- **Authoritative Integrity**: Clients are never trusted. All `trustStatus`, `trustScore`, and `reviewedBy` fields are protected by server-side Zod validation.
- **RBAC Boundaries**: `PATCH` routes checking `canModifyClaim()` ensure that standard `STUDENT` roles cannot verify or dispute claims.
- **Transaction Safety**: All state changes use `adminDb.runTransaction()` to prevent race conditions.

## 17. Testing Strategy
- **Unit Tests**: Verify Trust Score math boundaries (0-100) and ensure AI cannot trigger state transitions.
- **Security Tests**: Assert that `STUDENT` accounts receive 403 Forbidden on review endpoints. Verify IDOR protections for evidence submissions.
- **Integration Tests**: Validate coordination detection algorithms (burst simulation).

## 18. Demo Scenarios
1. **Government Scheme Fraud Rumor**: 
   - A synthetic rumor claiming misappropriated funds.
   - Evidence shows conflicting official documentation.
   - Status: `DISPUTED`.
2. **Crop Treatment Claim**: 
   - A synthetic agricultural yield claim.
   - Evidence includes academic journals (Medium reliability) but awaits human verification.
   - Status: `UNDER_REVIEW`.
3. **Coordinated Civic Reports**: 
   - Synthetic accounts rapidly submit identical civic complaints.
   - System flags a `SYSTEM_SIGNAL` for coordination burst.
   - Status: `UNDER_REVIEW`.

## 19. Exact Files That WOULD Need Modification Later
- `src/types/trust.ts` (NEW)
- `src/lib/server/trust-service.ts` (NEW)
- `src/app/api/trust/claims/route.ts` (NEW)
- `src/app/api/trust/claims/[id]/review/route.ts` (NEW)
- `src/app/api/trust/evidence/route.ts` (NEW)
- `src/app/(dashboard)/dashboard/trust/page.tsx` (NEW)
- `src/components/trust/TrustCard.tsx` (NEW)
- `src/components/trust/EvidenceViewer.tsx` (NEW)
- `src/components/layout/DashboardShell.tsx` (MODIFIED: Add sidebar navigation)

## 20. Recommended Implementation Order
1. Define Zod schemas and TypeScript interfaces (`trust.ts`).
2. Build the backend `TrustService` and transactional logic.
3. Develop the Next.js API Route Handlers with strict RBAC guards.
4. Create the `TrustCard` and `EvidenceViewer` UI components.
5. Build the `/dashboard/trust` Reviewer Workspace.
6. Seed the synthetic demo scenarios for the presentation.

## 21. Rollback Strategy
- Protect the entire feature behind a server-side environment variable (e.g., `SYNERGYBRIDGE_TRUST_MODE=DISABLED`).
- Toggling this to `DISABLED` will hide UI elements and cause all `/api/trust/*` routes to return 503 Service Unavailable, completely isolating the system if issues arise.
