import { searchUserTabs } from './firebaseStorage';
import { searchSongsterrTabs, filterByInstrument } from './songsterrApi';

/**
 * Unified search that combines user-uploaded tabs and Songsterr results
 * @param {string} searchTerm - Search query
 * @param {Object} options - Search options
 * @returns {Promise<Object>} Combined search results
 */
export async function searchAllTabs(searchTerm, options = {}) {
  const {
    includeUserTabs = true,
    includeSongsterr = true,
    instrument = null,
    maxResults = 50
  } = options;

  try {
    const results = {
      userTabs: [],
      songsterrTabs: [],
      total: 0,
      searchTerm
    };

    // Search user-uploaded tabs
    if (includeUserTabs && searchTerm) {
      try {
        results.userTabs = await searchUserTabs(searchTerm);
      } catch (error) {
        console.error('Error searching user tabs:', error);
        // Continue with Songsterr search even if user tabs fail
      }
    }

    // Search Songsterr
    if (includeSongsterr && searchTerm) {
      try {
        let songsterrResults = await searchSongsterrTabs(searchTerm);
        
        // Filter by instrument if specified
        if (instrument) {
          songsterrResults = filterByInstrument(songsterrResults, instrument);
        }
        
        results.songsterrTabs = songsterrResults.slice(0, maxResults);
      } catch (error) {
        console.error('Error searching Songsterr:', error);
        // Continue even if Songsterr search fails
      }
    }

    results.total = results.userTabs.length + results.songsterrTabs.length;

    return results;
  } catch (error) {
    console.error('Error in unified search:', error);
    throw error;
  }
}

/**
 * Get tab data from either source
 * @param {string} tabId - Tab ID (prefixed with 'songsterr_' for Songsterr tabs)
 * @param {string} source - 'user_upload' or 'songsterr'
 * @returns {Promise<Object>} Tab data
 */
export async function getTabData(tabId, source) {
  if (source === 'songsterr' || tabId.startsWith('songsterr_')) {
    // Extract Songsterr ID
    const songsterrId = tabId.replace('songsterr_', '');
    const { getSongsterrSongDetails } = await import('./songsterrApi');
    return await getSongsterrSongDetails(parseInt(songsterrId));
  } else {
    // User uploaded tab
    const { getTabById } = await import('./firebaseStorage');
    return await getTabById(tabId);
  }
}

/**
 * Sort combined results by relevance, date, or popularity
 * @param {Object} results - Search results from searchAllTabs
 * @param {string} sortBy - 'relevance', 'date', 'title'
 * @returns {Array} Sorted and combined results
 */
export function sortCombinedResults(results, sortBy = 'relevance') {
  const combined = [
    ...results.userTabs.map(tab => ({ ...tab, priority: 'user' })),
    ...results.songsterrTabs.map(tab => ({ ...tab, priority: 'songsterr' }))
  ];

  switch (sortBy) {
    case 'date':
      return combined.sort((a, b) => {
        const dateA = new Date(a.uploadedAt || 0);
        const dateB = new Date(b.uploadedAt || 0);
        return dateB - dateA;
      });
    
    case 'title':
      return combined.sort((a, b) => 
        a.title.localeCompare(b.title)
      );
    
    case 'relevance':
    default:
      // User tabs first, then Songsterr
      return combined.sort((a, b) => {
        if (a.priority === 'user' && b.priority !== 'user') return -1;
        if (a.priority !== 'user' && b.priority === 'user') return 1;
        return 0;
      });
  }
}

/**
 * Get suggested tabs based on what the user is viewing
 * @param {Object} currentTab - The tab currently being viewed
 * @param {number} limit - Number of suggestions to return
 * @returns {Promise<Array>} Suggested tabs
 */
export async function getSuggestedTabs(currentTab, limit = 5) {
  try {
    // Search for tabs by the same artist
    const results = await searchAllTabs(currentTab.artist, {
      includeUserTabs: true,
      includeSongsterr: true,
      maxResults: limit + 1 // +1 to account for current tab
    });

    const combined = sortCombinedResults(results, 'relevance');
    
    // Filter out the current tab
    return combined
      .filter(tab => tab.id !== currentTab.id)
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting suggested tabs:', error);
    return [];
  }
}

/**
 * Check if a tab exists in user uploads before searching Songsterr
 * This can help reduce API calls
 * @param {string} title - Song title
 * @param {string} artist - Artist name
 * @returns {Promise<Object|null>} User tab if found, null otherwise
 */
export async function findUserTabByTitleAndArtist(title, artist) {
  try {
    const results = await searchUserTabs(`${title} ${artist}`);
    
    // Try to find exact match
    const exactMatch = results.find(tab => 
      tab.title.toLowerCase() === title.toLowerCase() &&
      tab.artist.toLowerCase() === artist.toLowerCase()
    );
    
    return exactMatch || null;
  } catch (error) {
    console.error('Error finding user tab:', error);
    return null;
  }
}