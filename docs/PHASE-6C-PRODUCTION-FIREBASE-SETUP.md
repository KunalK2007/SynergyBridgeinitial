# PHASE 6C — PRODUCTION FIREBASE INFRASTRUCTURE SETUP

## 1. Production Firebase Architecture
SynergyBridge relies on a serverless architecture powered by Next.js (App Router) and Firebase. The production Firebase project acts as the primary data store, identity provider, and asset storage system. 

## 2. Required Services
To support the current feature set, the following Firebase services **must** be enabled:
- **Firebase Authentication:** Handles user identity, sessions, and role verification.
- **Cloud Firestore:** The primary NoSQL database for users, problems, applications, projects, and platform analytics.
- **Cloud Storage for Firebase:** Stores user-uploaded artifacts, resumes, project files, and certificates.

*Note: Do not enable Firebase Realtime Database or Firebase Hosting unless required for future architectural changes. Next.js handles hosting via Vercel or a similar provider.*

## 3. Manual Creation Steps
Do not use the `synergybridgee-dev` project for production. Instead, create a dedicated production environment manually:

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add Project**.
3. **Project Name Recommendation:** `SynergyBridge Production` (or similar).
4. **Project ID Recommendation:** `synergybridge-prod-<random-hash>`.
5. **Google Analytics:** Optional, but recommended for production telemetry.
6. **Location Considerations:** Select the Google Cloud resource location closest to your target demographic (e.g., `asia-south1` for India) to minimize latency.

## 4. Authentication Configuration
After project creation, navigate to **Build > Authentication** and click **Get Started**:
1. Enable the **Email/Password** sign-in method.
2. In the **Settings > Authorized domains** tab, add your official production domain (e.g., `synergybridge.com` or `app.synergybridge.org`).
3. Ensure localhost is left enabled only if you plan to use this production project for local live debugging (not recommended).

## 5. Firestore Configuration
Navigate to **Build > Firestore Database** and click **Create Database**:
1. Start in **Production mode** (all reads/writes denied by default).
2. Choose the same location selected during project creation.
3. The schema is schemaless, but the indexes and rules will be deployed via the CLI.

## 6. Storage Configuration
Navigate to **Build > Storage** and click **Get Started**:
1. Start in **Production mode**.
2. Accept the default bucket configuration. 

## 7. Security Rules
The local `firestore.rules` and `storage.rules` have been strictly verified. They do not contain any "test mode" overrides and rely on explicit `request.auth` conditions. 

*A dry-run of the rules compilation against the development project completed successfully.*

## 8. Service-Account Setup (Admin SDK)
The backend requires administrative access to bypass rules for trusted server operations (e.g., verifying certificates, AI operations, data aggregations):
1. Navigate to **Project Settings > Service Accounts**.
2. Click **Generate new private key**.
3. Download the `.json` file.
4. **CRITICAL:** Do NOT commit this file. Store the raw JSON string (or base64 encoded version) as the `FIREBASE_SERVICE_ACCOUNT_KEY` environment variable in your production hosting platform (e.g., Vercel).

## 9. Required Environment Variables
Configure the following in your production hosting platform (e.g. Vercel):

**Public Variables (Safe for Browser):**
Find these by registering a new "Web App" in Firebase Project Settings:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

**Server-Only Variables (Secret):**
- `FIREBASE_SERVICE_ACCOUNT_KEY`: The JSON service account key.
- `NODE_ENV`: Must be `production`.

## 10. AI Configuration
SynergyBridge integrates with Google Gemini for AI-assisted mentoring and institutional analytics.
- **Production AI:** Set `AI_PROVIDER=gemini` and `AI_API_KEY=<your-real-gemini-key>`.
- **Soft-Launch / MVP Testing:** If you do not wish to enable live AI billing immediately, you may set `AI_PROVIDER=mock` and explicitly set `ENABLE_MOCK_INTEGRATIONS=true`. The server will safely bypass real AI calls without crashing.

## 11. Demo-Data Separation
The production database will start completely empty. The demo dataset generator (`scripts/seed-production-demo.ts`) is explicitly protected by environment safeguards and will immediately throw a `🚨 ERROR: Attempted to run demo seed in production` if accidentally triggered in the production environment.

## 12. Deployment Commands
Once the Firebase project is manually initialized in the console:

```bash
# 1. Login to Firebase CLI
firebase login

# 2. Link the production project
firebase use <your-production-project-id>

# 3. Deploy Firestore rules, indexes, and Storage rules
firebase deploy --only firestore,storage
```

## 13. Rollback Considerations
If a bad rule is deployed, you can roll back instantly via the Firebase Console (Firestore > Rules > History) or by checking out an older commit in Git and re-running `firebase deploy --only firestore:rules`.
