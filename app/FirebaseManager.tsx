'use client';

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { useEffect } from "react";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBcvsJSZT6ANUPOPDmTdJeB5vok0UPMF4I",
  authDomain: "hellopay-2d4bf.firebaseapp.com",
  projectId: "hellopay-2d4bf",
  storageBucket: "hellopay-2d4bf.firebasestorage.app",
  messagingSenderId: "626478143485",
  appId: "1:626478143485:web:b1b1282c52c57487a72b94",
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
