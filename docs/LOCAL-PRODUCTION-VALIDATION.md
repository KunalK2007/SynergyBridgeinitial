# Local Production Validation Environment Checklist

## 1. Firebase Client Configuration
**Status**: Verified
- Variables are prefixed with `NEXT_PUBLIC_` mapping to `.env` seamlessly. Safe for browser exposure.

## 2. Firebase Admin Configuration
**Status**: Verified
- `FIREBASE_SERVICE_ACCOUNT_KEY` is completely isolated to Edge/Node server execution layers (`src/lib/firebase/admin.ts`).
- Fails securely if undefined.

## 3. AI Configuration
**Status**: Verified
- `AI_PROVIDER`, `AI_MODEL`, and `AI_API_KEY` are read exclusively by serverless endpoints under `src/app/api/ai/*`.
- Client requests only supply query contexts, preventing prompt injection of the system state.

## 4. Application URL / Environment Detection
**Status**: Verified
- The `src/lib/server/environment.ts` explicitly maps and enforces development vs production states.

## 5. Mock Integration Configuration
**Status**: Verified
- Development mode uses `ENABLE_MOCK_INTEGRATIONS=true` to simulate external Blockchain / DigiLocker APIs safely.
- A critical safety guard deployed in Phase 5A prevents this flag from enabling silently in production unless an explicit `ENABLE_PRODUCTION_SEED=true` emergency override exists.

## 6. Secrets Exposure Prevention
**Status**: Verified
- Scans of `.gitignore` and client bundles confirmed `.env.local` and JSON keyfiles are appropriately blocked.
- No `FIREBASE_SERVICE_ACCOUNT_KEY` values leak to the client payloads.
