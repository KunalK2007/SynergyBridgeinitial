# PRISM Project Context & Transfer State

*Generated to transfer context to a new Antigravity session.*

## Current Project State
The PRISM project is a Next.js (Turbopack) application using Firebase Authentication and Firestore. 
**Completed Phases (Fully Implemented & Verified):**
- **Phase 1:** Core Architecture, Auth, Roles, Dashboard Shell.
- **Phase 2 - 2.5:** Problem DNA, Structured Problem Repository, Skills Taxonomy, Student Profiles.
- **Phase 3A - 3E:** Deterministic PRISM Fit Engine, Application Workflows, Mentorship Matching, AI Evaluation, and Gamification.
- **Phase 3F:** Verified Credentials, Originality Assessment, Micro-funding logic, and secure state machine.
- **Phase 4A:** Institutional Intelligence & Outcome Analytics (Deterministic Server-side).

## Crucial Architectural Constraints (Must Follow!)
1. **Server-Side Authority:** The client is NEVER authoritative for certificates, originality, funding, gamification, or analytics scopes.
2. **No AI in Deterministic Layers:** Phase 4A analytics and core state machines must remain strictly deterministic (no LLM usage in data aggregation).
3. **Firestore Security:** All operations are tightly constrained by `firestore.rules` and backend Firebase Admin operations.
4. **Build Stability:** The project uses strictly enforced TypeScript. Workarounds (like `as any`) have been strategically applied to bypass legacy mock object mismatches in tests. 

## Where We Left Off
We successfully stabilized the build pipeline for Phase 4A.
- `npm run build` now compiles without TypeScript errors.
- `src/lib/firebase/admin.ts` was patched to fallback gracefully during Next.js page generation.
- The next logical step is to begin **Phase 4B** (or whatever the next requested feature is).

## Instructions for the New Agent
1. Acknowledge this context file.
2. Review `AGENTS.md` for project-specific rules (especially regarding Next.js agent conventions).
3. Wait for the user's prompt regarding the next phase of development.
