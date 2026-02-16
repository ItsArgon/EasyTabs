/**
 * Songsterr API Service
 * Docs: https://www.songsterr.com/a/wa/api
 */

const SONGSTERR_API_BASE = 'https://www.songsterr.com/a/ra';
const CORS_PROXY = 'https://corsproxy.io/?'; 

/**
 * Search for songs on Songsterr
 * @param {string} searchTerm - Song name, artist, or combination
 * @returns {Promise<Array>} Array of song results
 */
export async function searchSongsterrTabs(searchTerm) {
  try {
    const url = `${CORS_PROXY}${SONGSTERR_API_BASE}/songs.json?pattern=${encodeURIComponent(searchTerm)}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Songsterr API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform to match app's format
    return data.map(song => ({
      id: `songsterr_${song.id}`,
      title: song.title,
      artist: song.artist.name,
      artistId: song.artist.id,
      songsterrId: song.id,
      source: 'songsterr',
      tracks: song.tracks || [],
      // Additional metadata
      chordsPresent: song.chordsPresent || false,
      hasExplicitLicense: song.hasExplicitLicense || false
    }));
  } catch (error) {
    console.error('Error searching Songsterr:', error);
    throw error;
  }
}

/**
 * Get detailed information about a specific song
 * @param {number} songId - Songsterr song ID
 * @returns {Promise<Object>} Detailed song information
 */
export async function getSongsterrSongDetails(songId) {
  try {
    const url = `${CORS_PROXY}${SONGSTERR_API_BASE}/song/${songId}.json`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Songsterr API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting Songsterr song details:', error);
    throw error;
  }
}

/**
 * Get the Guitar Pro file URL for a song
 * Note: This returns a URL that can be used to download the GP file
 * @param {number} revisionId - Songsterr revision ID
 * @returns {string} URL to the Guitar Pro file
 */
export function getSongsterrGuitarProUrl(revisionId) {
  return `${SONGSTERR_API_BASE}/player/song/${revisionId}.gp`;
}

/**
 * Get available tracks (instruments) for a song
 * @param {number} songId - Songsterr song ID
 * @returns {Promise<Array>} Array of available tracks
 */
export async function getSongsterrTracks(songId) {
  try {
    const songDetails = await getSongsterrSongDetails(songId);
    return songDetails.tracks || [];
  } catch (error) {
    console.error('Error getting Songsterr tracks:', error);
    throw error;
  }
}

/**
 * Get popular songs from Songsterr
 * Note: This is not an official endpoint but works by searching with an empty pattern
 * @param {number} limit - Number of results to return
 * @returns {Promise<Array>} Array of popular songs
 */
export async function getSongsterrPopularTabs(limit = 20) {
  try {
    // Search with common terms to get popular results
    const results = await searchSongsterrTabs('guitar');
    return results.slice(0, limit);
  } catch (error) {
    console.error('Error getting popular tabs:', error);
    throw error;
  }
}

/**
 * Filter Songsterr results by instrument
 * @param {Array} songs - Array of song objects
 * @param {string} instrument - Instrument name (e.g., 'guitar', 'bass', 'drums')
 * @returns {Array} Filtered songs that have the specified instrument
 */
export function filterByInstrument(songs, instrument) {
  return songs.filter(song => {
    if (!song.tracks || song.tracks.length === 0) return false;
    return song.tracks.some(track => 
      track.name.toLowerCase().includes(instrument.toLowerCase())
    );
  });
}

/**
 * Get artist information
 * @param {number} artistId - Songsterr artist ID
 * @returns {Promise<Object>} Artist information
 */
export async function getSongsterrArtist(artistId) {
  try {
    const url = `${CORS_PROXY}${SONGSTERR_API_BASE}/artist/${artistId}.json`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Songsterr API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting Songsterr artist:', error);
    throw error;
  }
}

/**
 * Get all songs by an artist
 * @param {number} artistId - Songsterr artist ID
 * @returns {Promise<Array>} Array of songs by the artist
 */
export async function getSongsterrArtistSongs(artistId) {
  try {
    const artist = await getSongsterrArtist(artistId);
    return artist.songs || [];
  } catch (error) {
    console.error('Error getting artist songs:', error);
    throw error;
  }
}