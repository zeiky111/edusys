// Firebase Authentication - Modern v9+ SDK
import { auth } from './firebase-config.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from "firebase/auth";

// Sign up function
export function signUp(email, password) {
  return createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      console.log('User signed up:', userCredential.user);
      return userCredential.user;
    })
    .catch((error) => {
      console.error('Error signing up:', error);
      throw error;
    });
}

// Sign in function
export function signIn(email, password) {
  return signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      console.log('User signed in:', userCredential.user);
      return userCredential.user;
    })
    .catch((error) => {
      console.error('Error signing in:', error);
      throw error;
    });
}

// Sign out function
export function signOut() {
  return firebaseSignOut(auth)
    .then(() => {
      console.log('User signed out successfully');
    })
    .catch((error) => {
      console.error('Error signing out:', error);
      throw error;
    });
}

// Auth state observer
export function onAuthStateChange(callback) {
  return onAuthStateChanged(auth, callback);
}

// Get current user
export function getCurrentUser() {
  return auth.currentUser;
}
