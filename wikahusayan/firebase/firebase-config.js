// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD9khDPPquuztCUWLfzithwPmQFpI8t49g",
  authDomain: "wikahusayan-quest.firebaseapp.com",
  projectId: "wikahusayan-quest",
  storageBucket: "wikahusayan-quest.firebasestorage.app",
  messagingSenderId: "744849133114",
  appId: "1:744849133114:web:31c5f34bc1ace7e3a5ef03"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export { signOut, onAuthStateChanged };

export default app;