import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, setDoc, getDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { storage, db } from './firebase-config'; // Your Firebase config

/**
 * Upload a MIDI file to Firebase Storage and save metadata to Firestore
 */
export async function uploadMidiTab(midiFile, metadata) {
  try {
    // Validate file
    if (!midiFile.name.endsWith('.mid') && !midiFile.name.endsWith('.midi')) {
      throw new Error('File must be a MIDI file (.mid or .midi)');
    }

    // Create unique filename
    const timestamp = Date.now();
    const sanitizedName = midiFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}_${sanitizedName}`;
    
    // Upload to Firebase Storage
    const storageRef = ref(storage, `tabs/${filename}`);
    const snapshot = await uploadBytes(storageRef, midiFile, {
      contentType: 'audio/midi',
      customMetadata: {
        originalName: midiFile.name,
        uploadedBy: metadata.uploadedBy || 'anonymous'
      }
    });
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    // Prepare Firestore document
    const tabData = {
      id: timestamp.toString(),
      title: metadata.title || midiFile.name.replace(/\.(mid|midi)$/, ''),
      artist: metadata.artist || 'Unknown Artist',
      midiUrl: downloadURL,
      storagePath: `tabs/${filename}`,
      uploadedBy: metadata.uploadedBy || 'anonymous',
      uploadedAt: new Date().toISOString(),
      fileSize: midiFile.size,
      fileName: midiFile.name,
      source: 'user_upload',
      tuning: metadata.tuning || 'standard',
      difficulty: metadata.difficulty || 'intermediate',
      tags: metadata.tags || [],
      instrument: metadata.instrument || 'guitar'
    };
    
    // Save to Firestore
    await setDoc(doc(db, 'tabs', tabData.id), tabData);
    
    return {
      success: true,
      tabData,
      downloadURL
    };
  } catch (error) {
    console.error('Error uploading MIDI tab:', error);
    throw error;
  }
}

/**
 * Get a tab from Firestore by ID
 */
export async function getTabById(tabId) {
  try {
    const docRef = doc(db, 'tabs', tabId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      throw new Error('Tab not found');
    }
  } catch (error) {
    console.error('Error getting tab:', error);
    throw error;
  }
}

/**
 * Search user-uploaded tabs in Firestore
 */
export async function searchUserTabs(searchTerm) {
  try {
    const tabsRef = collection(db, 'tabs');
    const q = query(tabsRef, where('source', '==', 'user_upload'));
    const querySnapshot = await getDocs(q);
    
    const tabs = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Filter by search term (case-insensitive)
      const term = searchTerm.toLowerCase();
      if (
        data.title.toLowerCase().includes(term) ||
        data.artist.toLowerCase().includes(term)
      ) {
        tabs.push(data);
      }
    });
    
    return tabs;
  } catch (error) {
    console.error('Error searching tabs:', error);
    throw error;
  }
}

/**
 * Delete a tab (both from Storage and Firestore)
 */
export async function deleteTab(tabId) {
  try {
    // Get tab data first
    const tabData = await getTabById(tabId);
    
    // Delete from Storage
    if (tabData.storagePath) {
      const storageRef = ref(storage, tabData.storagePath);
      await deleteObject(storageRef);
    }
    
    // Delete from Firestore
    await deleteDoc(doc(db, 'tabs', tabId));
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting tab:', error);
    throw error;
  }
}

/**
 * Get all user-uploaded tabs
 */
export async function getAllUserTabs() {
  try {
    const tabsRef = collection(db, 'tabs');
    const q = query(tabsRef, where('source', '==', 'user_upload'));
    const querySnapshot = await getDocs(q);
    
    const tabs = [];
    querySnapshot.forEach((doc) => {
      tabs.push(doc.data());
    });
    
    // Sort by upload date (newest first)
    tabs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    
    return tabs;
  } catch (error) {
    console.error('Error getting all tabs:', error);
    throw error;
  }
}