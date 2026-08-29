# PHASE 5C INITIAL AUDIT

## Findings

1. **Storage Authorization Weakness**
   - **Evidence:** storage.rules (lines 13-14) allows any authenticated user to read from /projects/{projectId}/{fileName}.
   - **Current Status:** VULNERABLE
   - **Severity:** HIGH
   - **Recommended Fix:** Use irestore.get() within storage.rules to query the /databases/(default)/documents/projects/{projectId} document and verify the user's UID is in studentIds, is the mentorId, or is an ADMIN.
   - **Blocks Production:** YES

2. **Teams Read Authorization Weakness**
   - **Evidence:** irestore.rules (line 94) allows any authenticated user to read all documents in /teams/{teamId}.
   - **Current Status:** VULNERABLE
   - **Severity:** HIGH
   - **Recommended Fix:** Restrict read access to only members (equest.auth.uid in resource.data.memberIds), the leader (equest.auth.uid == resource.data.leaderId), or ADMIN.
   - **Blocks Production:** YES

3. **Funding Multi-Signature Gap**
   - **Evidence:** src/lib/server/funding-service.ts allows a single reviewer to approve funding milestones.
   - **Current Status:** PARTIALLY IMPLEMENTED (Only 1-key approval)
   - **Severity:** MEDIUM
   - **Recommended Fix:** Implement pprovals: { aiOriginalityPassed, mentorApprovedBy, sponsorApprovedBy } on FundingMilestone. Update disburseMilestone transaction to require these signatures based on funding tier.
   - **Blocks Production:** NO (but required for absolute zero-trust as requested in Phase 5C).

4. **Missing Browser E2E Tests**
   - **Evidence:** src/__tests__/e2e-journeys.test.ts uses Vitest (Node execution) instead of a real browser like Playwright.
   - **Current Status:** INCOMPLETE
   - **Severity:** MEDIUM
   - **Recommended Fix:** Introduce @playwright/test for routing smoke tests.
   - **Blocks Production:** NO (but increases risk of uncaught routing errors in production).

5. **AI Integration State**
   - **Evidence:** Code defaults to Mock AI integration in tests. Gemini integration logic exists but isn't rigorously validated.
   - **Current Status:** MOCK-HEAVY
   - **Severity:** LOW
   - **Recommended Fix:** Retain Mock as default for local dev. Verify Gemini isn't accidentally enforced locally.
   - **Blocks Production:** NO