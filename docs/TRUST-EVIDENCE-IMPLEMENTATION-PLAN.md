# Trust & Evidence Center Implementation Plan

**Notice: This is a proposed implementation plan. Existing website functionality remains unchanged.**

## 1. Current Architecture Analysis
SynergyBridge operates on a Next.js App Router architecture using React Server Components and Client Components. 
Backend mutations run primarily through Next.js API Routes and Server Actions utilizing the Firebase Admin SDK (`src/lib/firebase/admin.ts`).
Data flows strictly from authenticated clients -> server-side validation (Zod) -> RBAC checks -> transactional Firestore updates. Security relies heavily on server-side guarding rather than client-side enforcement.

## 2. Existing Components that could be reused
- `src/components/ui/Card.tsx`, `Badge.tsx`, `Button.tsx`: Core building blocks for the proposed `TrustCard`.
- `DashboardShell.tsx`: The primary layout wrapper to host the new `/dashboard/trust` route.
- `ProjectActivity` component patterns: Can be adapted to show a timeline of evidence and reviews.

## 3. Existing Authentication/RBAC that could be reused
- Firebase Auth context (`useAuth` hook) provides the `currentUser`.
- Existing `UserRole` enum (`ADMIN`, `FACULTY`, `MENTOR`, `INDUSTRY`, `GOVERNMENT`, `INCUBATION`, `STUDENT`) allows for precise review delegation.
- `src/lib/server/auth-helpers.ts` patterns can be extended to `canReviewClaim(userId, role)`.

## 4. Existing Firebase/Firestore Architecture
- `adminDb.runTransaction()` is used to ensure safe, idempotent updates. This same pattern must be used when appending evidence or changing trust statuses to prevent race conditions.
- Existing collections like `projects` and `originalityReports` provide an established relational model (using `projectId` as a foreign key) which `trustClaims` can emulate.

## 5. Existing AI Architecture
- The system already employs AI for `OriginalityService` (`src/lib/server/originality-service.ts`) producing an `OriginalityReport` (0-100 score).
- AI serves as a signal, but final disbursal currently requires human mentor/sponsor cryptographic signatures. This "AI as advisor, human as authority" philosophy directly aligns with the proposed Trust & Evidence requirements.

## 6. Recommended Trust & Evidence Architecture
- **Data Layer:** Two new Firestore collections: `trustClaims` and `trustEvidence`.
- **Service Layer:** `TrustService` (`src/lib/server/trust-service.ts`) handling all business logic, AI interactions, and transactional saves.
- **API Layer:** Next.js Route Handlers (`/api/trust/*`) guarded by Firebase Auth token verification.
- **UI Layer:** A dedicated workspace (`/dashboard/trust`) and embedded `TrustCard` components within Project/Problem views.

## 7. Proposed Firestore Data Model
```typescript
interface TrustClaim {
  id: string;
  targetId: string; // ID of the Project, Problem, or general entity
  targetType: "PROJECT" | "PROBLEM" | "GENERAL";
  claimText: string;
  status: "UNVERIFIED" | "UNDER_REVIEW" | "PARTIALLY_VERIFIED" | "VERIFIED" | "DISPUTED" | "REJECTED";
  trustScore: number; // 0-100
  submittedBy: string;
  createdAt: number;
  reviewedBy?: string;
  reviewedAt?: number;
}

interface TrustEvidence {
  id: string;
  claimId: string;
  source: string;
  sourceType: "URL" | "DOCUMENT" | "EXPERT_TESTIMONY" | "SYSTEM_SIGNAL";
  relationship: "SUPPORTS" | "CONFLICTS" | "NEUTRAL";
  reliabilityLevel: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";
  summary: string;
  submittedBy: string; // "SYSTEM" for AI
  timestamp: number;
}
```

## 8. Proposed API Routes
- `POST /api/trust/claims`: Submit a new claim.
- `GET /api/trust/claims/[id]`: Fetch claim and evidence graph.
- `POST /api/trust/evidence`: Attach new evidence to a claim.
- `PATCH /api/trust/claims/[id]/review`: Update claim status (Admin/Faculty/Government only).

## 9. Proposed UI Components
- **`TrustCard`**: A reusable widget displaying Status (with distinct color coding like Amber for `DISPUTED`), Trust signal (progress ring 0-100), top Evidence snippet, and "Why this status?" tooltip.
- **`EvidenceTimeline`**: Visual representation of supporting vs. conflicting evidence.
- **`TrustWorkspace`**: Page at `/dashboard/trust` for authorized reviewers to triage `UNVERIFIED` and `UNDER_REVIEW` claims.

## 10. Proposed RBAC Permissions
- **Submit Claims/Evidence:** Any authenticated user (`STUDENT`, `MENTOR`, etc.).
- **Review/Change Status:** Restricted to `ADMIN`, `FACULTY`, `GOVERNMENT`, `INDUSTRY`.
- **System Signals:** AI agents operate as `SYSTEM` and can append evidence but CANNOT transition a status to `VERIFIED` or `REJECTED`.

## 11. Proposed Audit Logging
- Integrate with the existing `platform_audit` collection.
- Record `TRUST_CLAIM_CREATED`, `TRUST_EVIDENCE_ADDED`, and `TRUST_STATUS_CHANGED`.
- Retain the actor ID, timestamp, and metadata (old status -> new status). Do not log PII in the audit payload.

## 12. Proposed Trust Scoring Model
- Base score of 50.
- `SUPPORTS` + `HIGH` reliability = +15
- `CONFLICTS` + `HIGH` reliability = -20 (Penalty for strong conflicts)
- Capped between 0 and 100.
- AI dynamically recalculates the score when evidence is added, but the absolute status (`VERIFIED`/`DISPUTED`) requires human assertion.

## 13. Proposed Evidence Model
Evidence represents edges in a graph pointing to a Claim. 
- Reliability is derived from the source type (e.g., `.gov` domains or verified experts default to `HIGH`).
- Conflicting evidence actively suppresses the trust score and triggers an automatic `UNDER_REVIEW` or `DISPUTED` flag.

## 14. Proposed Coordination Detection
- **Rate Limiting:** Track submissions per UID per hour.
- **Similarity Hashing:** Generate a semantic hash of `claimText`. If >3 highly similar claims appear within 1 hour from different accounts, flag as `SYSTEM_SIGNAL: COORDINATED_BURST`.
- **Target Saturation:** Flag if a single project receives a sudden influx of claims.

## 15. Proposed AI Integration
- AI evaluates submitted evidence text against the claim to automatically classify the `relationship` (`SUPPORTS`/`CONFLICTS`).
- AI summarizes long source documents into the `summary` field.
- AI monitors the coordination detection hashes to attach `SYSTEM_SIGNAL` evidence.
- **Strict Boundary:** AI is explicitly denied the permission to mutate `status` to `VERIFIED`.

## 16. Proposed Demo Scenarios
1. **"Government Scheme Fraud Rumor"**: 
   - A synthetic claim stating a demo project is misappropriating funds.
   - Evidence shows conflicting official documentation.
   - Status: `DISPUTED`.
2. **"Crop Treatment Claim"**: 
   - A synthetic claim regarding a novel agricultural yield method.
   - AI finds supporting scientific journals (Medium reliability), but pending human expert review.
   - Status: `UNDER_REVIEW`.
3. **"Coordinated Civic Reports"**: 
   - 5 synthetic student accounts report the exact same pothole issue within 2 minutes.
   - AI attaches a `COORDINATED_BURST` signal.
   - Status: `UNDER_REVIEW`.

## 17. Security Risks
- **IDOR (Insecure Direct Object Reference):** Users modifying evidence they don't own or reviewing claims without authorization. Mitigated by strict `auth-helpers.ts` validation on all `PATCH` routes.
- **Evidence Flooding:** Malicious actors submitting junk evidence to tank a trust score. Mitigated by rate limiting and coordination detection.

## 18. Privacy Considerations
- The feature must strictly prohibit automated scraping of external PII to build evidence files.
- Claims targeting specific individuals (e.g., "Student X is lying") must be filtered or anonymized; the system should focus on *project data* and *claims*, not behavioral accusations against real people.
- Private account information (emails, real names) must never be exposed in the public `TrustCard` evidence log.

## 19. Testing Strategy
- **Unit Tests:** `trust-service.test.ts` verifying that AI cannot change a status to `VERIFIED` and score calculations are mathematically bounded (0-100).
- **Security Tests:** Ensure `STUDENT` roles receive 403 Forbidden when attempting to hit `/api/trust/claims/[id]/review`.
- **E2E Tests:** Simulate the "Government Scheme Fraud Rumor" scenario from submission to human review.

## 20. Exact Files That WOULD Need Modification
- `src/types/trust.ts` (NEW)
- `src/lib/server/trust-service.ts` (NEW)
- `src/app/api/trust/claims/route.ts` (NEW)
- `src/app/api/trust/claims/[id]/review/route.ts` (NEW)
- `src/app/api/trust/evidence/route.ts` (NEW)
- `src/app/(dashboard)/dashboard/trust/page.tsx` (NEW)
- `src/components/trust/TrustCard.tsx` (NEW)
- `src/components/trust/EvidenceTimeline.tsx` (NEW)
- `src/components/layout/DashboardShell.tsx` (MODIFIED: Add `/dashboard/trust` to sidebar navigation for authorized roles)

## 21. Migration Strategy
- No existing data migrations are required since this is an additive feature.
- Initially deploy with `TRUST_CENTER_ENABLED=false` environment variable.
- Seed synthetic demo scenarios (Scenario 1, 2, 3) using a dedicated admin script before enabling the UI for general users.

## 22. Rollback Strategy
- The feature can be instantly disabled via a server-side environment variable `SYNERGYBRIDGE_TRUST_MODE=DISABLED`, similar to the Blackout Recovery Mode.
- This will hide the sidebar link and cause all `/api/trust/*` routes to return 503 Service Unavailable, completely isolating the system if an exploit is found.
