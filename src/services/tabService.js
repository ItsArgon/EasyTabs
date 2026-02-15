import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  setDoc,
  deleteDoc,
  serverTimestamp
} from "firebase/firestore";

// Mock database of public tabs (replace with API call or Firestore public collection)
const MOCK_TABS = [
  {
    id: "1",
    title: "Wonderwall",
    artist: "Oasis",
    difficulty: "Intermediate",
    tempo: 90,
    votes: 1245,
    description: "Classic 90s rock song. Perfect for beginners to intermediate players.",
    measures: [
      {
        notes: [
          { string: 1, fret: 0 },
          { string: 1, fret: 2 },
          { string: 2, fret: 2 },
          { string: 2, fret: 3 },
        ]
      },
      {
        notes: [
          { string: 3, fret: 0 },
          { string: 3, fret: 2 },
          { string: 4, fret: 2 },
        ]
      }
    ]
  },
  {
    id: "2",
    title: "House of the Rising Sun",
    artist: "The Animals",
    difficulty: "Beginner",
    tempo: 80,
    votes: 892,
    description: "A classic folk song with a distinctive guitar riff.",
    measures: [
      {
        notes: [
          { string: 1, fret: 0 },
          { string: 2, fret: 3 },
          { string: 3, fret: 2 },
          { string: 4, fret: 0 },
        ]
      }
    ]
  },
  {
    id: "3",
    title: "Stairway to Heaven",
    artist: "Led Zeppelin",
    difficulty: "Advanced",
    tempo: 60,
    votes: 2341,
    description: "One of the most iconic guitar pieces ever written.",
    measures: [
      {
        notes: [
          { string: 1, fret: 0 },
          { string: 1, fret: 2 },
          { string: 2, fret: 1 },
          { string: 2, fret: 3 },
          { string: 3, fret: 2 },
        ]
      }
    ]
  },
  {
    id: "4",
    title: "Sweet Child o' Mine",
    artist: "Guns N' Roses",
    difficulty: "Intermediate",
    tempo: 120,
    votes: 1567,
    description: "Featuring one of the most recognizable riffs in rock music.",
    measures: [
      {
        notes: [
          { string: 1, fret: 5 },
          { string: 1, fret: 3 },
          { string: 1, fret: 5 },
          { string: 1, fret: 7 },
        ]
      }
    ]
  },
  {
    id: "5",
    title: "Hey Jude",
    artist: "The Beatles",
    difficulty: "Easy",
    tempo: 125,
    votes: 1089,
    description: "A timeless Beatles classic with beautiful melodies.",
    measures: [
      {
        notes: [
          { string: 1, fret: 0 },
          { string: 1, fret: 2 },
          { string: 2, fret: 2 },
          { string: 3, fret: 0 },
        ]
      }
    ]
  },
  {
    id: "6",
    title: "Layla",
    artist: "Derek and the Dominos",
    difficulty: "Intermediate",
    tempo: 89,
    votes: 756,
    description: "Features an iconic piano and guitar riff combination.",
    measures: [
      {
        notes: [
          { string: 1, fret: 2 },
          { string: 1, fret: 4 },
          { string: 2, fret: 3 },
          { string: 3, fret: 2 },
        ]
      }
    ]
  }
];

// Search for tabs from the public database and user uploads
export const searchTabs = async (query) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));

  if (!query.trim()) return [];

  const searchTerm = query.toLowerCase();

  // Search in mock tabs
  const mockResults = MOCK_TABS.filter(tab =>
    tab.title.toLowerCase().includes(searchTerm) ||
    tab.artist.toLowerCase().includes(searchTerm) ||
    tab.description.toLowerCase().includes(searchTerm)
  );

  // Search in Firestore user uploads
  try {
    const publicTabsRef = collection(db, "public-tabs");
    const snapshot = await getDocs(publicTabsRef);
    const userUploads = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(tab =>
        tab.title.toLowerCase().includes(searchTerm) ||
        tab.artist.toLowerCase().includes(searchTerm) ||
        tab.description.toLowerCase().includes(searchTerm)
      );

    return [...mockResults, ...userUploads];
  } catch (error) {
    console.warn("Could not fetch user uploads:", error);
    return mockResults;
  }
};

// Create a new tab
export const createTab = async (userId, title) => {
  const tabRef = collection(db, "users", userId, "tabs");

  const newTab = {
    title,
    tempo: 120,
    measures: [
      {
        notes: []
      }
    ],
    createdAt: serverTimestamp()
  };

  await addDoc(tabRef, newTab);
};

// Get all tabs for a user
export const getUserTabs = async (userId) => {
  try {
    if (!userId) {
      console.warn("⚠️ getUserTabs called without userId");
      return [];
    }
    
    console.log("📥 Fetching tabs for user:", userId);
    
    // Query the user's personal tabs subcollection
    const tabsRef = collection(db, "users", userId, "tabs");
    const snapshot = await getDocs(tabsRef);

    const tabs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`✅ Fetched ${tabs.length} tabs for user ${userId}`);
    return tabs;
  } catch (error) {
    console.error("❌ Error fetching user tabs:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    return [];
  }
};

// Add tab to favorites subcollection Structure: users/{userId}/favorites/{tabId
export const addFavorite = async (userId, tab) => {
  const favRef = doc(db, "users", userId, "favorites", tab.id);

  await setDoc(favRef, {
    ...tab,
    favoritedAt: new Date()
  });
};

// Remove from favorites 
export const removeFavorite = async (userId, tabId) => {
  const favRef = doc(db, "users", userId, "favorites", tabId);
  await deleteDoc(favRef);
};

// Update tab
export const updateTab = async (userId, tabId, updatedData) => {
  const tabRef = doc(db, "users", userId, "tabs", tabId);
  await updateDoc(tabRef, updatedData);
};

// Import a tab from public database to user's collection
export const importTab = async (userId, tab) => {
  const tabRef = collection(db, "users", userId, "tabs");

  const importedTab = {
    title: tab.title,
    artist: tab.artist,
    difficulty: tab.difficulty,
    tempo: tab.tempo,
    description: tab.description,
    measures: tab.measures,
    source: "imported",
    importedAt: serverTimestamp(),
    originalId: tab.id
  };

  const result = await addDoc(tabRef, importedTab);
  return result.id;
};

// Upload a user-created tab from MIDI file
export const uploadTab = async (userId, tabData) => {
  try {
    if (!userId) {
      throw new Error("User not authenticated - userId is missing");
    }

    console.log("📤 Uploading tab for user:", userId);
    console.log("📋 Tab data:", {
      title: tabData.title,
      artist: tabData.artist,
      measures: tabData.measures.length
    });

    // Save to user's personal tabs collection
    const userTabRef = collection(db, "users", userId, "tabs");
    const userResult = await addDoc(userTabRef, {
      title: tabData.title,
      artist: tabData.artist,
      difficulty: tabData.difficulty,
      tempo: tabData.tempo,
      description: tabData.description,
      measures: tabData.measures,
      notes: tabData.notes,
      source: "user-uploaded",
      uploadedAt: serverTimestamp(),
      createdBy: userId
    });

    console.log("✅ Saved to user collection with ID:", userResult.id);

    // Also save to public tabs collection so others can find it
    const publicTabRef = collection(db, "public-tabs");
    const publicResult = await addDoc(publicTabRef, {
      title: tabData.title,
      artist: tabData.artist,
      difficulty: tabData.difficulty,
      tempo: tabData.tempo,
      description: tabData.description,
      measures: tabData.measures,
      notes: tabData.notes,
      source: "user-uploaded",
      uploadedAt: serverTimestamp(),
      uploadedBy: tabData.uploadedBy,
      userId: userId,
      votes: 0
    });

    console.log("✅ Saved to public collection with ID:", publicResult.id);
    console.log("✅ Tab upload successful!");

    return userResult.id;
  } catch (error) {
    console.error("❌ Error uploading tab:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    console.error("Full error:", error);
    throw error;
  }
};

