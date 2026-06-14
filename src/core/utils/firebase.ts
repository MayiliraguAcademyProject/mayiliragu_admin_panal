import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDchydKWM7JigfibZWltqWiMrDEyuGUMAE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "education-app-74250.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "education-app-74250",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "education-app-74250.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1017424215687",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1017424215687:web:a86347e01609e81755c222",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-3Q3394Z23J"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
