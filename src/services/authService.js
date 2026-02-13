import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "./firebase";

const provider = new GoogleAuthProvider();

export function loginWithGoogle() {
  return signInWithPopup(auth, provider);
}

export function logout() {
  return signOut(auth);
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}
