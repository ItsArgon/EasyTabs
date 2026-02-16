import React, { useState, useEffect } from 'react';
import { getTabData } from './unifiedSearch';
import { getSongsterrGuitarProUrl } from './songsterrApi';

const TabViewer = ({ tab, onBack }) => {
  const [tabData, setTabData] = useState(tab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTrack, setSelectedTrack] = useState(null);

  useEffect(() => {
    // Reset state when tab changes
    if (!tab) {
      setError('No tab data provided');
      return;
    }
    
    setTabData(tab);
    setError(null);
    
    // If we don't have full details, fetch them
    if (tab && !tab.tracks && tab.source === 'songsterr') {
      loadFullTabData();
    } else if (tab.tracks && tab.tracks.length > 0) {
      // Auto-select first guitar track
      const guitarTrack = tab.tracks.find(t => 
        t.name && t.name.toLowerCase().includes('guitar')
      );
      setSelectedTrack(guitarTrack || tab.tracks[0]);
    }
  }, [tab]);

  const loadFullTabData = async () => {
    setLoading(true);
    setError(null);

    try {
      const fullData = await getTabData(tab.id, tab.source);
      setTabData({ ...tab, ...fullData });
      
      // Auto-select first guitar track
      if (fullData.tracks && fullData.tracks.length > 0) {
        const guitarTrack = fullData.tracks.find(t => 
          t.name.toLowerCase().includes('guitar')
        );
        setSelectedTrack(guitarTrack || fullData.tracks[0]);
      }
    } catch (err) {
      console.error('Error loading tab data:', err);
      setError('Failed to load tab details');
    } finally {
      setLoading(false);
    }
  };

  const downloadMidiFile = () => {
    if (tabData.midiUrl) {
      // For user uploads, open the Firebase Storage URL
      window.open(tabData.midiUrl, '_blank');
    }
  };

  const openInSongsterr = () => {
    if (tabData.songsterrId) {
      window.open(
        `https://www.songsterr.com/a/wsa/songsterr-${tabData.songsterrId}`,
        '_blank'
      );
    }
  };

  const downloadGuitarPro = () => {
    if (tabData.revisionId) {
      const gpUrl = getSongsterrGuitarProUrl(tabData.revisionId);
      window.open(gpUrl, '_blank');
    }
  };

  const renderTrackSelector = () => {
    if (!tabData || !tabData.tracks || tabData.tracks.length === 0) return null;

    return (
      <div className="track-selector">
        <h4>Select Track:</h4>
        <div className="track-buttons">
          {tabData.tracks.map((track, index) => (
            <button
              key={index}
              className={`track-button ${selectedTrack?.name === track.name ? 'active' : ''}`}
              onClick={() => setSelectedTrack(track)}
            >
              {track.name || `Track ${index + 1}`}
            </button>
          ))}
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

        {tabData.tags && tabData.tags.length > 0 && (
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
    if (!tabData) return null;
    
    return (
      <div className="action-buttons">
        <button onClick={onBack} className="back-button">
          ← Back to Search
        </button>

        {tabData.source === 'user_upload' && tabData.midiUrl && (
          <button onClick={downloadMidiFile} className="download-button">
            📥 Download MIDI
          </button>
        )}

        {tabData.source === 'songsterr' && (
          <>
            <button onClick={openInSongsterr} className="songsterr-button">
              🎵 Open in Songsterr
            </button>
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
    // This is where you'd integrate your existing tab viewer/renderer
    // For now, showing a placeholder that you can replace with your actual implementation
    
    if (!tabData) {
      return (
        <div className="tab-content">
          <p>No tab content available</p>
        </div>
      );
    }
    
    if (tabData.source === 'user_upload' && tabData.midiUrl) {
      return (
        <div className="tab-content">
          <div className="tab-placeholder">
            <p>🎸 Tab Viewer</p>
            <p>Integrate your MIDI tab renderer here</p>
            <p>MIDI File: {tabData.fileName || 'Unknown'}</p>
            {selectedTrack && <p>Selected Track: {selectedTrack.name}</p>}
          </div>
          {/* Replace with your actual tab renderer component */}
          {/* <YourMidiRenderer midiUrl={tabData.midiUrl} /> */}
        </div>
      );
    } else if (tabData.source === 'songsterr') {
      return (
        <div className="tab-content">
          <div className="tab-placeholder">
            <p>🎸 Songsterr Tab</p>
            <p>This tab is available on Songsterr</p>
            <p>Click "Open in Songsterr" to view the full tab</p>
            {selectedTrack && (
              <div className="track-info">
                <h4>Selected Track: {selectedTrack.name}</h4>
                {selectedTrack.tuning && <p>Tuning: {selectedTrack.tuning.join(' ')}</p>}
              </div>
            )}
          </div>
          {/* You could embed Songsterr's player here if they provide an embed option */}
        </div>
      );
    }

    return (
      <div className="tab-content">
        <p>No tab content available</p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="tab-viewer loading">
        <p>Loading tab...</p>
      </div>
    );
  }

  if (error || !tabData) {
    return (
      <div className="tab-viewer error">
        <p>{error || 'No tab data available'}</p>
        <button onClick={onBack}>Back to Search</button>
      </div>
    );
  }

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
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
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

        .tab-placeholder p:first-child {
          font-size: 48px;
          margin-bottom: 20px;
        }

        .track-info {
          margin-top: 20px;
          padding: 20px;
          background-color: #f5f5f5;
          border-radius: 8px;
        }

        .track-info h4 {
          margin: 0 0 10px 0;
          color: #333;
        }
      `}</style>
    </div>
  );
};

export default TabViewer;