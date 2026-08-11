import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

if (!getApps().length) {
  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) : null;
    if (serviceAccount) {
      initializeApp({
        credential: cert(serviceAccount)
      });
    } else {
      // Fallback for Next.js build time where env vars might not be present
      initializeApp({ projectId: 'demo-project' });
    }
  } catch (error) {
    console.log('Firebase Admin initialization skipped or failed:', error);
    if (!getApps().length) {
       initializeApp({ projectId: 'demo-project' });
    }
  }
}

export const adminDb = getFirestore();
export const adminAuth = getAuth();
