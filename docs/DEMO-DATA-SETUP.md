# Demo Data Setup

This guide details how to initialize a robust set of synthetic data in your local or dedicated demo environment.

## 1. Prerequisites

1. Ensure your `.env.local` is properly configured with your Firebase project keys.
2. If connecting to a real (but non-production) Firebase project, ensure you have set `FIREBASE_SERVICE_ACCOUNT_KEY` to an active admin credential, or that you have Application Default Credentials (ADC) configured on your system (via `gcloud auth application-default login` or similar).

## 2. Mock Integrations

For a local demo, it's advised to enable mock integrations so that Blockchain and AI services don't fail due to missing API keys.
Ensure these variables are present in `.env.local`:
```env
AI_PROVIDER=mock
ENABLE_MOCK_INTEGRATIONS=true
```

## 3. Running the Seed Script

To inject the full suite of demo data (Auth accounts, Institution, Users, Problems, Projects, Gamification, and Certificates), run the following command from the project root:

```bash
# Safety guard override is required:
$env:ENABLE_PRODUCTION_SEED="true"
npx tsx scripts/seed-production-demo.ts
```

*(On Linux/macOS, use `ENABLE_PRODUCTION_SEED=true npx tsx scripts/seed-production-demo.ts`)*

### What the script does:
- Creates or retrieves Firebase Authentication credentials for the Demo Accounts.
- Seeds an `institutions` record for "SynergyBridge Demo Institute".
- Associates synthetic user records with this demo institution.
- Populates synthetic industry problems, applications, and multi-stage projects.
- Injects Gamification XP, Funding Grants, and Certificates for completed projects.

## 4. Validating the Setup

1. Start your local server: `npm run dev`.
2. Visit the login page.
3. Authenticate using credentials from `DEMO-ACCOUNTS.md`.
4. Verify the dashboard matches the expected Role features (e.g. Mentor dashboard for Dr. Rahul Mehta).

## 5. Teardown / Cleanup

Since demo records are marked with `isDemo: true`, they can be filtered out or bulk-deleted using a future cleanup script. For now, you can manually delete them via the Firebase Console if you wish to reset the demo environment.
