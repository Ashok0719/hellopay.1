'use client';

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { useEffect } from "react";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAbBFUwrKwWwsYc15JtRRueXyatgU4FNyQ",
  authDomain: "hello-bd522.firebaseapp.com",
  projectId: "hello-bd522",
  storageBucket: "hello-bd522.firebasestorage.app",
  messagingSenderId: "565556529902",
  appId: "1:565556529902:web:3dea869562194d9c8b81ff",
  measurementId: "G-FLY1E6GDDJ"
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
