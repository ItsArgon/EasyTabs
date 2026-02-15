/// <reference types="vite/client" />
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate config
console.log("🔍 Firebase Config:", {
  apiKey: firebaseConfig.apiKey ? "✅ Set" : "❌ Missing",
  authDomain: firebaseConfig.authDomain ? "✅ Set" : "❌ Missing",
  projectId: firebaseConfig.projectId ? "✅ Set" : "❌ Missing",
  storageBucket: firebaseConfig.storageBucket ? "✅ Set" : "❌ Missing",
  messagingSenderId: firebaseConfig.messagingSenderId ? "✅ Set" : "❌ Missing",
  appId: firebaseConfig.appId ? "✅ Set" : "❌ Missing",
});

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable offline persistence
try {
  enableIndexedDbPersistence(db);
  console.log("✅ Firebase offline persistence enabled");
} catch (err) {
  if (err.code === 'failed-precondition') {
    console.warn("⚠️ Multiple tabs open - offline persistence disabled");
  } else if (err.code === 'unimplemented') {
    console.warn("⚠️ Browser doesn't support offline persistence");
  }
}

console.log("✅ Firebase initialized with project:", firebaseConfig.projectId);
