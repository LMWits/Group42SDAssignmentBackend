// Initialize Firebase for UserUILogin

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getAuth,
  OAuthProvider,
  indexedDBLocalPersistence,
  initializeAuth,
  browserPopupRedirectResolver
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// ✅ Firebase config (use the same config across roles if you're on the same project)
const firebaseConfig = {
  apiKey: "AIzaSyBfTyF0s-5Ijyj0eUOMNPGpHM04UI_U2bg",
  authDomain: "group42sdproject.firebaseapp.com",
  projectId: "group42sdproject",
  storageBucket: "group42sdproject.appspot.com",
  messagingSenderId: "741179377608",
  appId: "1:741179377608:web:194b7f53db28312824e2fd",
  measurementId: "G-P1C8Y3H2LJ"
};

// ✅ Avoid duplicate Firebase initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// ✅ Auth persistence setup
const auth = initializeAuth(app, {
  persistence: indexedDBLocalPersistence,
  popupRedirectResolver: browserPopupRedirectResolver
});

// ✅ Firestore database
const db = getFirestore(app);

// ✅ Microsoft OAuth setup (for user login)
const provider = new OAuthProvider('microsoft.com');
provider.addScope('email');
provider.addScope('profile');
provider.setCustomParameters({ prompt: 'login' });

// ✅ Export instances to use elsewhere
export { app, auth, db, provider };
