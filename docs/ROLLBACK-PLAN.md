# Rollback Plan

If a critical failure occurs post-deployment, follow these procedures to restore platform stability.

## 1. Vercel Rollback
If the application crashes or a frontend regression is discovered:
- Go to the Vercel Dashboard -> Deployments.
- Find the last stable deployment.
- Click the three dots -> **Instant Rollback**.
- This instantly points the domain to the previous build artifact without needing to recompile or alter Git history.

## 2. Firebase Rules Rollback
If a security rule accidentally blocks legitimate traffic:
- Go to Firebase Console -> Firestore -> Rules.
- Click on the **History** tab.
- Select the previous stable ruleset and click **Restore**.
- Do the same for Firebase Storage if required.

## 3. Firestore Index Considerations
- Rolling back application code might re-introduce queries that relied on older index structures. DO NOT manually delete Firestore indexes unless explicitly required, as rebuilding them takes significant time.

## 4. Emergency Disabling of AI
If the AI acts maliciously, hallucinations spike, or API costs surge:
- Go to Vercel Environment Variables.
- Change `AI_PROVIDER` to `mock` (or clear the API key).
- The application is designed to gracefully fallback or reject AI interactions cleanly if the key is missing. Redeploy immediately.

## 5. Database Recovery
- If production data is corrupted, use Google Cloud Console's Point-in-Time Recovery (PITR) if enabled, or restore from the daily automated backup bucket.
