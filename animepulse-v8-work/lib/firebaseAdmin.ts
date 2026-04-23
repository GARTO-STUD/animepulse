/**
 * Firebase Admin SDK — used only on the server (API routes, autopilot)
 * Never imported from client components.
 */
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function getServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not set');
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON');
  }
}

if (!getApps().length) {
  initializeApp({
    credential: cert(getServiceAccount()),
  });
}

export const adminDb = getFirestore();
