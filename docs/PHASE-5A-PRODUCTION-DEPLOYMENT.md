# Phase 5A Production Deployment Document

## Firebase Setup

1. **Create Project**: Go to the Firebase Console and create a new project. Select the Blaze plan (Pay-as-you-go).
2. **Auth Setup**: Enable Firebase Authentication (Identity Platform). Activate Email/Password. Whitelist your production domains under Authorized Domains.
3. **Firestore Setup**: Provision a Firestore Database in native mode. Choose a region closest to your users.
4. **Storage Setup**: Provision a Firebase Storage bucket.
5. **Rules Deployment**:
   ```bash
   firebase deploy --only firestore:rules,storage
   ```
6. **Index Deployment**:
   ```bash
   firebase deploy --only firestore:indexes
   ```

## Vercel Setup

1. **Project Configuration**: Connect Vercel to your GitHub repository `main` branch.
2. **Build Command**: Set to `npm run build`.
3. **Install Command**: Set to `npm install`.
4. **Environment Variables**: Add all variables from `.env.example`.
5. **Domain**: Attach your custom domain in the Vercel dashboard and configure DNS records.

## Secrets Management

- **Public Keys**: `NEXT_PUBLIC_FIREBASE_*` variables are safe in client bundles.
- **Private Keys**: `FIREBASE_SERVICE_ACCOUNT_KEY` and `AI_API_KEY` MUST be added directly in the Vercel Environment Variables UI. 
- **NEVER** commit `.env.production` or `.env.local` to Git. Ensure they remain in `.gitignore`.

## Deployment Commands

To deploy rules and indexes manually from your local machine (assuming authenticated via `firebase login`):
```bash
firebase deploy --only firestore,storage
```

To deploy the application, simply push to the `main` branch connected to Vercel:
```bash
git push origin main
```
