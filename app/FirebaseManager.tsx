'use client';

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { useEffect } from "react";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAIPFeohl4ikZ1bZY7mk7G4dON6FSN_qu4",
  authDomain: "hellopay-89da2.firebaseapp.com",
  projectId: "hellopay-89da2",
  storageBucket: "hellopay-89da2.firebasestorage.app",
  messagingSenderId: "640617233547",
  appId: "1:640617233547:web:db7cd4b6b0c888ee2d688e",
  measurementId: "G-4DGV2WKM50"
};

export default function FirebaseManager() {
  useEffect(() => {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    if (typeof window !== 'undefined') {
      getAnalytics(app);
    }
  }, []);

  return null;
}
