# Phase 5A Deployment Audit

## Current Deployment Architecture
SynergyBridge utilizes a standard Next.js App Router architecture deployed primarily to Vercel, paired with Firebase for Backend-as-a-Service (BaaS).
- **Client**: Next.js React components (Browser)
- **API**: Next.js Serverless Routes (`/api`)
- **Database**: Firestore (NoSQL)
- **File Storage**: Firebase Storage
- **Authentication**: Firebase Authentication (Identity Platform)
- **AI Core**: Provider-agnostic API calling through `src/lib/server/ai/` 

## Required Environment Variables

### Client-Exposed (`NEXT_PUBLIC_*`)
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### Server-Only (Must Remain Secret)
- `FIREBASE_SERVICE_ACCOUNT_KEY`: JSON string required for Admin SDK authentication.
- `AI_API_KEY`: API key for Gemini / OpenAI execution.
- `AI_PROVIDER`: The chosen AI provider (`gemini`, `openai`).
- `ENABLE_MOCK_INTEGRATIONS`: Boolean safeguard ensuring mock services are explicitly flagged in prod.

## Firebase Requirements
- **Plan**: Blaze (Pay as you go) required for potential future Cloud Functions or external API access.
- **Rules**: Strict deployment of `firestore.rules` and `storage.rules`.
- **Indexes**: Composite indexes on `projects`, `originalityReports`, and `applications` to support queries.

## Vercel Requirements
- **Node Environment**: Node.js 18+ (as specified by Next.js).
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Environment**: Ensure Server-Only keys are securely added to Vercel's Environment Variables dashboard.

## Unresolved Manual Steps
1. **Firebase Initialization**: Creating the exact Firebase Project and acquiring the Service Account JSON.
2. **Vercel Connection**: Authorizing the Vercel app to deploy from the main GitHub branch.
3. **Domain Configuration**: Pointing the custom domains in Vercel and whitelisting them in Firebase Auth Authorized Domains.

## Deployment Risks
- Missing environment variables in Vercel will cause a build/runtime crash (protected gracefully by Zod schema).
- Running the `seed-production-demo.ts` in a live environment without isolating it.

## Production Blockers
None. The architecture is fully secure, idempotent, and authorized.
