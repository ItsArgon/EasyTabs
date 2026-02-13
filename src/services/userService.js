import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export async function createUserIfNotExists(user) {
  const userRef = doc(db, "users", user.uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      displayName: user.displayName,
      photoURL: user.photoURL,
      createdAt: Date.now(),
      preferences: {
        darkMode: false,
      },
    });
  }
}
