# Production Deployment Checklist

Before deploying SynergyBridge to production, ensure every step is completed in order.

## 1. Firebase Preparation
- [ ] Ensure the Firebase project is on the **Blaze (Pay as you go)** plan (required for external Node.js serverless functions if eventually migrated).
- [ ] Upgrade Firebase Authentication to use Identity Platform (if multi-factor authentication is required).
- [ ] Deploy strict security rules:
  ```bash
  firebase deploy --only firestore:rules,storage
  ```
- [ ] Deploy Firestore indexes:
  ```bash
  firebase deploy --only firestore:indexes
  ```

## 2. Environment Variables (Vercel)
Ensure the following variables are strictly set in Vercel. **DO NOT** commit `.env.production`.
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID`
- [ ] `FIREBASE_SERVICE_ACCOUNT_KEY` (MUST be a minified, single-line JSON string)
- [ ] `AI_PROVIDER` (Set to `gemini` or `openai` — do not use `mock` for live production)
- [ ] `AI_API_KEY`
- [ ] `ENABLE_MOCK_INTEGRATIONS=false`

## 3. Seed / Demo Data (Optional)
- [ ] If launching a demo tenant for investors/auditors, execute `npm run seed:production-demo` on a clean database.
- [ ] **WARNING:** Do not run seed scripts on a live tenant with real users.

## 4. Build & Deploy
- [ ] Run `npm run build` locally to ensure no hidden regressions.
- [ ] Push to the `main` branch connected to Vercel.
- [ ] Verify the Vercel Build completes without warnings.

## 5. Security Validation
- [ ] Verify that navigating to a private project file URL without authentication throws a 403 Forbidden.
- [ ] Verify that a student cannot change their `institutionId` via client-side Firestore SDK.
- [ ] Ensure AI API Keys are not visible in the browser network tab.

## 6. Integrations
- [ ] Verify Digilocker / ABC API configurations are connected (if mock is disabled).
- [ ] Verify Blockchain RPC endpoints for credential anchoring are live.

## 7. Backups
- [ ] Enable automated daily backups in Google Cloud Console for Firestore.
- [ ] Ensure Firebase Storage retains soft-delete protection if critical.

## 8. Rollback Plan
- [ ] Keep previous Vercel deployment ID handy.
- [ ] In case of a critical failure, use Vercel's one-click "Instant Rollback".
