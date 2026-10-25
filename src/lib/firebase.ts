import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  User,
  Auth
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// oturma-plani-4448d Firebase Configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDummyKeyForAlkevClassroom2026",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "oturma-plani-4448d.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "oturma-plani-4448d",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "oturma-plani-4448d.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "867236652227",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:867236652227:web:9f402f08a4128ef3c9c64a"
};

let app: FirebaseApp;
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (err) {
    console.warn("Firebase initialization warning:", err);
    app = getApps()[0] || initializeApp(firebaseConfig, 'fallback-alkev');
  }
} else {
  app = getApp();
}

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
  hd: 'alkev.k12.tr' // Google Workspace domain hint for ALKEV
});

/**
 * Domain validity check: Strictly accepts only emails ending with @alkev.k12.tr
 */
export const isAlkevEmail = (email?: string | null): boolean => {
  if (!email) return false;
  return email.trim().toLowerCase().endsWith('@alkev.k12.tr');
};

export { signInWithPopup, fbSignOut as signOut, onAuthStateChanged };
export type { User };
