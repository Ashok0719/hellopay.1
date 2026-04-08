'use client';

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { useEffect } from "react";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAiPfeohL4ikZ1bZY7mk7G4dON6fSN_qu4",
  authDomain: "hellopay-89da2.firebaseapp.com",
  projectId: "hellopay-89da2",
  storageBucket: "hellopay-89da2.firebasestorage.app",
  messagingSenderId: "640617233547",
  appId: "1:640617233547:web:0e245ad4b495b6722d688e",
  measurementId: "G-MJN7ZW9TM2"
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
