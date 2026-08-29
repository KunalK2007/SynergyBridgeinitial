# PHASE 6E — VERCEL PRODUCTION DEPLOYMENT

## Overview
SynergyBridge has been fully prepared for a production Vercel deployment. The codebase relies entirely on standard Next.js configurations, meaning Vercel will automatically detect the framework and apply the correct build settings. 

- **Framework:** Next.js
- **Node.js Requirement:** v20.x (Vercel default)
- **Build Command:** `next build` (Vercel default)
- **Install Command:** `npm install` (Vercel default)
- **Firebase Production Project ID:** `synergybridge-production`

---

## Required Environment Variables

You must configure the following environment variables manually in the Vercel Dashboard (Project Settings > Environment Variables) **before** your first deployment. 

### Public Variables (Safe for Browser)
These variables configure the Firebase Web Client. Ensure these are retrieved from your `synergybridge-production` Web App configuration.

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` (Must be `synergybridge-production`)
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` (Optional, if using Analytics)

### Private/Server Secrets (Never Expose)
These variables configure the server-side Admin SDK and AI providers.

- `FIREBASE_SERVICE_ACCOUNT_KEY`: The raw JSON string or Base64 encoded payload of your production Admin SDK service account.

### AI Configuration (Mock Mode)
Because live AI billing is intentionally disabled for this deployment, you must explicitly enable the mock safeguards.

- `AI_PROVIDER` = `mock`
- `ENABLE_MOCK_INTEGRATIONS` = `true`

*Note: This configuration means the AI mentor and institutional analytics will operate in a hardcoded mock mode and will not make real API calls to Google Gemini.*

---

## Current Infrastructure Limitations

1. **Storage Limitation:** Firebase Storage is **NOT** provisioned on `synergybridge-production` because Firebase requires a billing upgrade (Blaze plan) to enable it. Artifact uploads (e.g., resumes, project files, certificates) will fail in production until the Firebase plan is upgraded and `firebase deploy --only storage` is successfully executed.
2. **AI Mock-Mode Limitation:** The live Gemini integration is bypassed. Do not expect intelligent, context-aware responses from the AI chat interfaces in production while `AI_PROVIDER=mock`.

---

## Deployment Checklist

1. [ ] Push the `v1.0.0-rc1` Git tag and all changes to your remote Git repository (e.g. GitHub).
2. [ ] In the Vercel Dashboard, select **Add New > Project** and import the repository.
3. [ ] Leave the "Framework Preset" as Next.js.
4. [ ] Expand the **Environment Variables** section.
5. [ ] Copy and paste the public `NEXT_PUBLIC_FIREBASE_*` variables from your production Firebase console.
6. [ ] Copy and paste the `FIREBASE_SERVICE_ACCOUNT_KEY` secret.
7. [ ] Add `AI_PROVIDER=mock` and `ENABLE_MOCK_INTEGRATIONS=true`.
8. [ ] Click **Deploy**.

---

## Post-Deployment Verification Checklist

Once Vercel reports a successful build and assigns a domain, verify the following manually:

1. [ ] **Authentication:** Navigate to `/login` or `/signup` and verify you can successfully create a new account.
2. [ ] **Routing:** Navigate to the `/dashboard` and verify no server-side crashes occur.
3. [ ] **Database Connection:** Verify that your newly created user profile appears in the `users` collection within the Firebase Console's Firestore viewer.
4. [ ] **AI Mock Guard:** Trigger an AI action (e.g. Mentor Chat) and verify it returns the standard mock response without crashing the server.
