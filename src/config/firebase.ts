import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAKp8LGfsID5knarRmAh6fQQ7uXIPamqbA",
  authDomain: "myminiprojectwpv-c6b94.firebaseapp.com",
  projectId: "myminiprojectwpv-c6b94",
  storageBucket: "myminiprojectwpv-c6b94.firebasestorage.app",
  messagingSenderId: "711070015591",
  appId: "1:711070015591:web:ceeec898299db69395b4c2",
  measurementId: "G-7LWPX4852P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
