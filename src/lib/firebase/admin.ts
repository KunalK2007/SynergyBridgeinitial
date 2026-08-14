import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const TARGET_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'synergybridgee-dev';

if (!getApps().length) {
  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) : null;
    if (serviceAccount) {
      initializeApp({
        credential: cert(serviceAccount),
        projectId: TARGET_PROJECT_ID
      });
    } else {
      // Initialize with targeted project ID for environment/build
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
}

export const adminDb = getFirestore();
export const adminAuth = getAuth();
