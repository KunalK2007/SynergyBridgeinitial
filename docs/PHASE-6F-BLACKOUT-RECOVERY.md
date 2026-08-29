# Phase 6F: The Blackout & System Recovery Mode

## Scenario Overview
This mechanism is designed for emergency situations where the primary datastore (Firestore) suffers catastrophic data corruption, widespread inconsistency, or partial deletion. In such events, the system must immediately "fail-closed" to prevent further damage, unauthorized funding disbursements, or state mutations based on compromised security checks.

## How to Activate Recovery Mode
Recovery mode is activated via a server-side environment variable. This ensures the protection is enforced at the backend infrastructure layer and cannot be bypassed via UI manipulation or compromised client sessions.

1. **Activate Recovery Mode:** Set the following environment variable on the server:
   ```env
   SYNERGYBRIDGE_OPERATION_MODE="RECOVERY"
   ```
2. **Apply Changes:** Restart the Next.js server for the environment configuration to take effect.
3. **Deactivate Recovery Mode:** Revert the variable to `"NORMAL"` and restart the server once data integrity is confirmed.

## What Gets Blocked
When Recovery Mode is active, the following authoritative actions are completely blocked on the backend:
- Funding Grant Requests
- Funding Approvals/Reviews
- Milestone Disbursal
- Mentor/Sponsor/AI Milestone Signatures
- Any other financial or trust-based mutation relying on `FundingService`

*Note: Entity verification mutations and beneficiary verification mutations are also strictly guarded, as financial releases now employ fail-closed data validation.*

## What Remains Available
- Read-only dashboards and reporting systems
- General navigation and static views
- Offline capabilities (if previously synchronized)
- Administrative status monitoring

## Fail-Closed Behavior
In addition to the explicit `RECOVERY` mode, the funding architecture is now strictly "fail-closed":
- If the disbursing user is missing or unverified, the release is rejected.
- If the project data is missing, null, or unreadable, the release is rejected.
- If the project has no students (missing beneficiary verification), the release is rejected.
- If any cryptographic signature (AI, Mentor, Sponsor) is missing, the release is rejected.
No absence of data is ever interpreted as an authorization.

## Exact Live Demonstration
Follow these exact steps for a 60-90 second live demonstration:
1. **Application in NORMAL mode.** Show a valid funding milestone with all checkmarks in the Funding Safety panel showing `ELIGIBLE FOR RELEASE`.
2. **Switch Mode:** Stop the local server, prefix the start command with `SYNERGYBRIDGE_OPERATION_MODE=RECOVERY npm run dev`.
3. **Open the Funding Page:** Observe the application-wide Recovery Banner and the Funding Safety card now showing:
   `⚠ SYSTEM RECOVERY MODE`
   `FUNDING OPERATIONS PAUSED`
   `Grant transactions are temporarily blocked while persistent data is being validated.`
4. **Attempt Action:** Click any funding action (if artificially enabled).
5. **Server-Side Rejection:** The action will fail with a hard backend error: *"SynergyBridge is currently in Recovery Mode. Funding operations are temporarily paused."*
6. **Switch Back:** Stop server, start with `SYNERGYBRIDGE_OPERATION_MODE=NORMAL`. Reload and show normal functionality has returned.

## Firebase Backup/Restore Distinction
Recovery Mode is an *application-layer* safety response designed to immediately freeze state mutation while investigation occurs. It does NOT automatically restore deleted data. Actual restoration of lost Firestore documents remains an infrastructure responsibility relying on Google Cloud/Firebase scheduled backups and Point-in-Time Recovery (PITR) mechanisms.

## Limitations
- Activating Recovery Mode currently requires a process restart because environment variables are evaluated at initialization.
- Audit logging of the Recovery Mode boot sequence is "fire-and-forget"; if the database is entirely unreachable, the audit event will not persist (as designed, to prevent cascading failures).
