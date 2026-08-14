import { initializeApp, getApps, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const TARGET_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'synergybridgee-dev';

let isConfigured = false;

if (!getApps().length) {
  try {
    let serviceAccount: ServiceAccount | null = null;
    const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (rawKey) {
      try {
        // Try parsing directly as JSON
        serviceAccount = JSON.parse(rawKey);
      } catch {
        // Try base64 decoding if raw JSON parsing failed (common on Vercel)
        try {
          const decoded = Buffer.from(rawKey, 'base64').toString('utf-8');
          serviceAccount = JSON.parse(decoded);
        } catch {
          console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY as JSON or Base64');
        }
      }
    }

    if (serviceAccount && serviceAccount.projectId) {
      initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.projectId || TARGET_PROJECT_ID,
      });
      isConfigured = true;
    } else if (serviceAccount && (serviceAccount as Record<string, unknown>).project_id) {
      initializeApp({
        credential: cert(serviceAccount),
        projectId: (serviceAccount as Record<string, string>).project_id || TARGET_PROJECT_ID,
      });
      isConfigured = true;
    } else {
      if (process.env.NODE_ENV === 'production') {
        console.warn('⚠️ FIREBASE ADMIN WARNING: FIREBASE_SERVICE_ACCOUNT_KEY is not configured in production. Server-side Admin operations requiring service account privileges will fail.');
      }
      initializeApp({ projectId: TARGET_PROJECT_ID });
    }
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    if (!getApps().length) {
      initializeApp({ projectId: TARGET_PROJECT_ID });
    }
  }
} else {
  isConfigured = !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
}

export const isFirebaseAdminConfigured = (): boolean => isConfigured;

export const adminDb = getFirestore();
try {
  adminDb.settings({ ignoreUndefinedProperties: true });
} catch {
  // Settings may already be locked or initialized
}

export const adminAuth = getAuth();
