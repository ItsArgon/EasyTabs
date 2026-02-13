import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  deleteDoc
} from "firebase/firestore";

/* Create a new tab */
export const createTab = async (userId, tabData) => {
  const tabsRef = collection(db, "tabs");

  return await addDoc(tabsRef, {
    userId,
    title: tabData.title,
    url: tabData.url,
    createdAt: new Date()
  });
};

/* Get all tabs for a user */
export const getUserTabs = async (userId) => {
  const tabsRef = collection(db, "tabs");
  const q = query(tabsRef, where("userId", "==", userId));

  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

/* Add tab to favorites subcollection Structure: users/{userId}/favorites/{tabId} */
export const addFavorite = async (userId, tab) => {
  const favRef = doc(db, "users", userId, "favorites", tab.id);

  await setDoc(favRef, {
    ...tab,
    favoritedAt: new Date()
  });
};

/* Remove from favorites */
export const removeFavorite = async (userId, tabId) => {
  const favRef = doc(db, "users", userId, "favorites", tabId);
  await deleteDoc(favRef);
};
