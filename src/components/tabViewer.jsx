import React, { useState, useEffect } from 'react';
import { getTabData } from './unifiedSearch';
import { getSongsterrGuitarProUrl } from './songsterrApi';

const TabViewer = ({ tab, onBack }) => {
  const [tabData, setTabData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTrack, setSelectedTrack] = useState(null);

  // Debugging: Log what we receive
  useEffect(() => {
    console.log('TabViewer received tab:', tab);
    
    // Validate tab prop
    if (!tab) {
      console.error('TabViewer: No tab provided');
      setError('No tab data provided');
      setTabData(null);
      return;
    }

    if (!tab.id) {
      console.error('TabViewer: Tab missing ID', tab);
      setError('Invalid tab data: missing ID');
      setTabData(null);
      return;
    }

    if (!tab.source) {
      console.error('TabViewer: Tab missing source', tab);
      setError('Invalid tab data: missing source');
      setTabData(null);
      return;
    }
    
    // Set initial tab data
    setTabData(tab);
    setError(null);
    setLoading(false);
    
    // If we don't have full details, fetch them
    if (tab.source === 'songsterr' && !tab.tracks) {
      loadFullTabData(tab);
    } else if (tab.tracks && tab.tracks.length > 0) {
      // Auto-select first guitar track
      selectInitialTrack(tab.tracks);
    }
  }, [tab]);

  const selectInitialTrack = (tracks) => {
    try {
      const guitarTrack = tracks.find(t => 
        t && t.name && t.name.toLowerCase().includes('guitar')
      );
      setSelectedTrack(guitarTrack || tracks[0]);
    } catch (err) {
      console.error('Error selecting initial track:', err);
    }
  };

  const loadFullTabData = async (tabToLoad) => {
    setLoading(true);
    setError(null);

    try {
      console.log('Loading full tab data for:', tabToLoad.id);
      const fullData = await getTabData(tabToLoad.id, tabToLoad.source);
      console.log('Full tab data loaded:', fullData);
      
      const mergedData = { ...tabToLoad, ...fullData };
      setTabData(mergedData);
      
      // Auto-select first guitar track
      if (fullData.tracks && fullData.tracks.length > 0) {
        selectInitialTrack(fullData.tracks);
      }
    } catch (err) {
      console.error('Error loading tab data:', err);
      setError(`Failed to load tab details: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const downloadMidiFile = () => {
    try {
      if (tabData && tabData.midiUrl) {
        window.open(tabData.midiUrl, '_blank');
      } else {
        alert('MIDI file URL not available');
      }
    } catch (err) {
      console.error('Error downloading MIDI:', err);
      alert('Failed to download MIDI file');
    }
  };

  const openInSongsterr = () => {
    try {
      if (tabData && tabData.songsterrId) {
        window.open(
          `https://www.songsterr.com/a/wsa/songsterr-${tabData.songsterrId}`,
          '_blank'
        );
      } else {
        alert('Songsterr ID not available');
      }
    } catch (err) {
      console.error('Error opening Songsterr:', err);
      alert('Failed to open in Songsterr');
    }
  };

  const downloadGuitarPro = () => {
    try {
      if (tabData && tabData.revisionId) {
        const gpUrl = getSongsterrGuitarProUrl(tabData.revisionId);
        window.open(gpUrl, '_blank');
      } else {
        alert('Guitar Pro file not available for this tab');
      }
    } catch (err) {
      console.error('Error downloading Guitar Pro:', err);
      alert('Failed to download Guitar Pro file');
    }
  };

  // Render functions with safety checks
  const renderTrackSelector = () => {
    if (!tabData || !tabData.tracks || tabData.tracks.length === 0) {
      return null;
    }

    return (
      <div className="track-selector">
        <h4>Select Track:</h4>
        <div className="track-buttons">
          {tabData.tracks.map((track, index) => {
            if (!track) return null;
            return (
              <button
                key={index}
                className={`track-button ${selectedTrack?.name === track.name ? 'active' : ''}`}
                onClick={() => setSelectedTrack(track)}
              >
                {track.name || `Track ${index + 1}`}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTabInfo = () => {
    if (!tabData) return null;
    
    return (
      <div className="tab-info">
        <div className="info-header">
          <div>
            <h1>{tabData.title || 'Untitled'}</h1>
            <h2>{tabData.artist || 'Unknown Artist'}</h2>
          </div>
          <span className={`source-badge ${tabData.source === 'user_upload' ? 'user' : 'songsterr'}`}>
            {tabData.source === 'user_upload' ? 'User Upload' : 'Songsterr'}
          </span>
        </div>

        <div className="info-details">
          {tabData.difficulty && (
            <div className="info-item">
              <strong>Difficulty:</strong> {tabData.difficulty}
            </div>
          )}
          {tabData.tuning && (
            <div className="info-item">
              <strong>Tuning:</strong> {tabData.tuning}
            </div>
          )}
          {tabData.instrument && (
            <div className="info-item">
              <strong>Instrument:</strong> {tabData.instrument}
            </div>
          )}
          {tabData.uploadedAt && (
            <div className="info-item">
              <strong>Uploaded:</strong> {new Date(tabData.uploadedAt).toLocaleDateString()}
            </div>
          )}
        </div>

        {tabData.tags && Array.isArray(tabData.tags) && tabData.tags.length > 0 && (
          <div className="tags">
            {tabData.tags.map((tag, index) => (
              <span key={index} className="tag">{tag}</span>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderActions = () => {
    return (
      <div className="action-buttons">
        <button onClick={onBack} className="back-button">
          ← Back to Search
        </button>

        {tabData && tabData.source === 'user_upload' && tabData.midiUrl && (
          <button onClick={downloadMidiFile} className="download-button">
            📥 Download MIDI
          </button>
        )}

        {tabData && tabData.source === 'songsterr' && (
          <>
            {tabData.songsterrId && (
              <button onClick={openInSongsterr} className="songsterr-button">
                🎵 Open in Songsterr
              </button>
            )}
            {tabData.revisionId && (
              <button onClick={downloadGuitarPro} className="download-button">
                📥 Download Guitar Pro
              </button>
            )}
          </>
        )}
      </div>
    );
  };

  const renderTabContent = () => {
    if (!tabData) {
      return (
        <div className="tab-content">
          <div className="tab-placeholder">
            <p>⚠️ No tab data available</p>
          </div>
        </div>
      );
    }
    
    if (tabData.source === 'user_upload' && tabData.midiUrl) {
      return (
        <div className="tab-content">
          <div className="tab-placeholder">
            <p style={{ fontSize: '48px', margin: '0 0 20px 0' }}>🎸</p>
            <h3>Tab Viewer</h3>
            <p>Integrate your MIDI tab renderer here</p>
            <div className="file-info">
              <p><strong>MIDI File:</strong> {tabData.fileName || 'Unknown'}</p>
              <p><strong>File Size:</strong> {tabData.fileSize ? `${(tabData.fileSize / 1024).toFixed(2)} KB` : 'Unknown'}</p>
              {selectedTrack && <p><strong>Selected Track:</strong> {selectedTrack.name}</p>}
            </div>
          </div>
          {/* Replace with your actual tab renderer component */}
          {/* <YourMidiRenderer midiUrl={tabData.midiUrl} /> */}
        </div>
      );
    } 
    
    if (tabData.source === 'songsterr') {
      return (
        <div className="tab-content">
          <div className="tab-placeholder">
            <p style={{ fontSize: '48px', margin: '0 0 20px 0' }}>🎸</p>
            <h3>Songsterr Tab</h3>
            <p>This tab is available on Songsterr</p>
            <p>Click "Open in Songsterr" to view the full interactive tab</p>
            {selectedTrack && (
              <div className="track-info">
                <h4>Selected Track: {selectedTrack.name}</h4>
                {selectedTrack.tuning && Array.isArray(selectedTrack.tuning) && (
                  <p>Tuning: {selectedTrack.tuning.join(' ')}</p>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="tab-content">
        <div className="tab-placeholder">
          <p>⚠️ Unable to display this tab</p>
          <p>Source: {tabData.source || 'Unknown'}</p>
        </div>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="tab-viewer loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading tab...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="tab-viewer error">
        <div className="error-content">
          <h2>⚠️ Error</h2>
          <p>{error}</p>
          <button onClick={onBack} className="back-button">Back to Search</button>
        </div>
      </div>
    );
  }

  // No data state
  if (!tabData) {
    return (
      <div className="tab-viewer error">
        <div className="error-content">
          <h2>⚠️ No Tab Data</h2>
          <p>Unable to load tab information</p>
          <button onClick={onBack} className="back-button">Back to Search</button>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="tab-viewer">
      {renderActions()}
      {renderTabInfo()}
      {renderTrackSelector()}
      {renderTabContent()}

      <style jsx>{`
        .tab-viewer {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .tab-viewer.loading,
        .tab-viewer.error {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 400px;
        }

        .loading-spinner {
          text-align: center;
        }

        .spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #4CAF50;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-content {
          text-align: center;
          padding: 40px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .error-content h2 {
          color: #d32f2f;
          margin-bottom: 15px;
        }

        .error-content p {
          color: #666;
          margin-bottom: 20px;
        }

        .action-buttons {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .action-buttons button {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .back-button {
          background-color: #f5f5f5;
          color: #333;
        }

        .back-button:hover {
          background-color: #e0e0e0;
        }

        .download-button {
          background-color: #4CAF50;
          color: white;
        }

        .download-button:hover {
          background-color: #45a049;
        }

        .songsterr-button {
          background-color: #ff6600;
          color: white;
        }

        .songsterr-button:hover {
          background-color: #e55a00;
        }

        .tab-info {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 30px;
          margin-bottom: 20px;
        }

        .info-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }

        .info-header h1 {
          margin: 0;
          font-size: 32px;
          color: #333;
        }

        .info-header h2 {
          margin: 5px 0 0 0;
          font-size: 20px;
          color: #666;
          font-weight: normal;
        }

        .source-badge {
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .source-badge.user {
          background-color: #e3f2fd;
          color: #1976d2;
        }

        .source-badge.songsterr {
          background-color: #fff3e0;
          color: #f57c00;
        }

        .info-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 15px;
        }

        .info-item {
          font-size: 14px;
        }

        .info-item strong {
          color: #555;
          margin-right: 8px;
        }

        .tags {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 15px;
        }

        .tag {
          padding: 5px 12px;
          background-color: #e8f5e9;
          color: #2e7d32;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .track-selector {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .track-selector h4 {
          margin: 0 0 15px 0;
          font-size: 16px;
          color: #333;
        }

        .track-buttons {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .track-button {
          padding: 8px 16px;
          border: 2px solid #e0e0e0;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.3s;
        }

        .track-button:hover {
          border-color: #4CAF50;
        }

        .track-button.active {
          background-color: #4CAF50;
          color: white;
          border-color: #4CAF50;
        }

        .tab-content {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 30px;
          min-height: 400px;
        }

        .tab-placeholder {
          text-align: center;
          padding: 60px 20px;
          color: #666;
        }

        .tab-placeholder h3 {
          color: #333;
          margin-bottom: 15px;
        }

        .tab-placeholder p {
          margin: 10px 0;
        }

        .file-info {
          margin-top: 30px;
          padding: 20px;
          background-color: #f5f5f5;
          border-radius: 8px;
          text-align: left;
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
        }

        .file-info p {
          margin: 8px 0;
        }

        .track-info {
          margin-top: 20px;
          padding: 20px;
          background-color: #f5f5f5;
          border-radius: 8px;
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
        }

        .track-info h4 {
          margin: 0 0 10px 0;
          color: #333;
        }

        .track-info p {
          margin: 5px 0;
        }
      `}</style>
    </div>
  );
};

export default TabViewer;