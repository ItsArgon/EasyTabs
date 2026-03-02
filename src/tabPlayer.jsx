import React, { useState, useEffect, useRef } from 'react';
import { parseMidiFile, convertToGuitarTab, formatTime, TUNING_PRESETS } from './midiParser';
import audioEngine from './audioEngine';

const TabPlayer = ({ midiUrl, tabData: initialTabData }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabData, setTabData] = useState(initialTabData || null);
  const [selectedTrack, setSelectedTrack] = useState(0);
  const [parsedMidi, setParsedMidi] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [tempo, setTempo] = useState(120);
  const [tuning, setTuning] = useState('standard');
  const [zoom, setZoom] = useState(1);
  const tabContainerRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Load and parse MIDI file
  useEffect(() => {
    if (midiUrl && !initialTabData) {
      loadMidiFile();
    } else if (initialTabData) {
      setTabData(initialTabData);
      setDuration(initialTabData.duration || 0);
      setTempo(initialTabData.tempo || 120);
      setLoading(false);
    }
  }, [midiUrl, initialTabData]);

  // Setup audio engine callbacks
  useEffect(() => {
    audioEngine.onTimeUpdate = (time, dur) => {
      setCurrentTime(time);
      if (autoScroll) {
        scrollToCurrentTime(time);
      }
    };

    audioEngine.onPlayStateChange = (playing) => {
      setIsPlaying(playing);
    };

    return () => {
      audioEngine.onTimeUpdate = null;
      audioEngine.onPlayStateChange = null;
      audioEngine.stop();
    };
  }, [autoScroll]);

  const loadMidiFile = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Loading MIDI file:', midiUrl);
      const parsed = await parseMidiFile(midiUrl);
      setParsedMidi(parsed);
      
      // Convert first track to tab
      const converted = convertToGuitarTab(parsed, 0);
      setTabData(converted);
      setDuration(converted.duration);
      setTempo(converted.tempo);
      
      console.log('MIDI loaded successfully:', converted);
    } catch (err) {
      console.error('Error loading MIDI:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayPause = async () => {
    try {
      if (isPlaying) {
        audioEngine.pause();
      } else {
        if (currentTime === 0 || currentTime >= duration) {
          // Start from beginning
          await audioEngine.play(tabData, 0);
        } else {
          // Resume from current position
          audioEngine.resume();
        }
      }
    } catch (err) {
      console.error('Playback error:', err);
      setError(err.message);
    }
  };

  const handleStop = () => {
    audioEngine.stop();
    setCurrentTime(0);
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    const newTime = percent * duration;
    
    audioEngine.seek(newTime);
    setCurrentTime(newTime);
    
    if (isPlaying) {
      audioEngine.play(tabData, newTime);
    }
  };

  const handleTempoChange = (newTempo) => {
    setTempo(newTempo);
    audioEngine.setTempo(newTempo);
  };

  const handleTrackChange = (trackIndex) => {
    if (!parsedMidi) return;
    
    setSelectedTrack(trackIndex);
    const converted = convertToGuitarTab(parsedMidi, trackIndex);
    setTabData(converted);
    
    if (isPlaying) {
      audioEngine.stop();
    }
  };

  const handleTuningChange = (newTuning) => {
    setTuning(newTuning);
    // Re-convert with new tuning
    if (parsedMidi) {
      const converted = convertToGuitarTab(parsedMidi, selectedTrack);
      setTabData(converted);
    }
  };

  const scrollToCurrentTime = (time) => {
    if (!tabContainerRef.current) return;
    
    // Find the note closest to current time
    const container = tabContainerRef.current;
    const noteElements = container.querySelectorAll('.tab-note');
    
    if (noteElements.length === 0) return;
    
    // Binary search for closest note
    let left = 0;
    let right = noteElements.length - 1;
    let closest = 0;
    
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const noteTime = parseFloat(noteElements[mid].dataset.time || 0);
      
      if (noteTime < time) {
        closest = mid;
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
    
    // Scroll to the note
    const noteElement = noteElements[closest];
    if (noteElement) {
      noteElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      });
    }
  };

  const renderTablature = () => {
    if (!tabData || !tabData.tabs) {
      return <div className="no-tabs">No tab data available</div>;
    }

    const strings = ['E', 'B', 'G', 'D', 'A', 'E']; // Standard tuning string names
    const tuningNotes = TUNING_PRESETS[tuning]?.notes || TUNING_PRESETS.standard.notes;

    return (
      <div className="tablature-container" ref={tabContainerRef}>
        <div className="tab-header">
          <div className="string-labels">
            {tuningNotes.reverse().map((note, index) => (
              <div key={index} className="string-label">{note}</div>
            ))}
          </div>
        </div>
        
        <div className="tab-content" style={{ fontSize: `${zoom}em` }}>
          {/* Draw string lines */}
          {[0, 1, 2, 3, 4, 5].map(stringIndex => (
            <div key={stringIndex} className="tab-line">
              <div className="string-line" />
              
              {/* Draw notes on this string */}
              {tabData.tabs.map((item, itemIndex) => 
                item.notes
                  .filter(note => note.tab && note.tab.string === 6 - stringIndex)
                  .map((note, noteIndex) => (
                    <div
                      key={`${itemIndex}-${noteIndex}`}
                      className={`tab-note ${currentTime >= item.time && currentTime < item.time + note.duration ? 'active' : ''}`}
                      style={{
                        left: `${(item.time / duration) * 100}%`
                      }}
                      data-time={item.time}
                    >
                      {note.tab.fret}
                    </div>
                  ))
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="tab-player loading">
        <div className="spinner" />
        <p>Loading tab...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tab-player error">
        <p>Error: {error}</p>
        <button onClick={loadMidiFile}>Retry</button>
      </div>
    );
  }

  return (
    <div className="tab-player">
      {/* Controls */}
      <div className="player-controls">
        <div className="playback-controls">
          <button 
            className="control-button play-pause"
            onClick={handlePlayPause}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button 
            className="control-button stop"
            onClick={handleStop}
          >
            ⏹
          </button>
          
          <div className="time-display">
            <span className="current-time">{formatTime(currentTime)}</span>
            <span className="separator">/</span>
            <span className="total-time">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="progress-bar" onClick={handleSeek}>
          <div 
            className="progress-fill" 
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
          <div 
            className="progress-handle"
            style={{ left: `${(currentTime / duration) * 100}%` }}
          />
        </div>

        <div className="settings-controls">
          {/* Track selector */}
          {parsedMidi && parsedMidi.tracks.length > 1 && (
            <div className="control-group">
              <label>Track:</label>
              <select value={selectedTrack} onChange={(e) => handleTrackChange(Number(e.target.value))}>
                {parsedMidi.tracks.map((track, index) => (
                  <option key={index} value={index}>
                    {track.name} ({track.notes.length} notes)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Tuning selector */}
          <div className="control-group">
            <label>Tuning:</label>
            <select value={tuning} onChange={(e) => handleTuningChange(e.target.value)}>
              {Object.entries(TUNING_PRESETS).map(([key, preset]) => (
                <option key={key} value={key}>{preset.name}</option>
              ))}
            </select>
          </div>

          {/* Tempo control */}
          <div className="control-group">
            <label>Tempo:</label>
            <input
              type="number"
              min="40"
              max="240"
              value={tempo}
              onChange={(e) => handleTempoChange(Number(e.target.value))}
              className="tempo-input"
            />
            <span className="unit">BPM</span>
          </div>

          {/* Zoom control */}
          <div className="control-group">
            <label>Zoom:</label>
            <button onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}>-</button>
            <span className="zoom-level">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(Math.min(2, zoom + 0.1))}>+</button>
          </div>

          {/* Auto-scroll toggle */}
          <div className="control-group">
            <label>
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
              />
              Auto-scroll
            </label>
          </div>
        </div>
      </div>

      {/* Tablature display */}
      <div className="tab-display">
        {tabData ? renderTablature() : <p>No tab data</p>}
      </div>

      <style jsx>{`
        .tab-player {
          background: var(--bg-secondary);
          border-radius: 12px;
          padding: 24px;
          border: 1px solid var(--border-primary);
        }

        .tab-player.loading,
        .tab-player.error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 300px;
          gap: 20px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid var(--bg-hover);
          border-top: 4px solid var(--accent-color);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .player-controls {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-bottom: 24px;
        }

        .playback-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .control-button {
          width: 48px;
          height: 48px;
          border: none;
          background: var(--accent-color);
          color: var(--text-inverse);
          border-radius: 8px;
          font-size: 20px;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .control-button:hover {
          background: var(--accent-hover);
          transform: scale(1.05);
        }

        .time-display {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: monospace;
          font-size: 18px;
          color: var(--text-primary);
          margin-left: 8px;
        }

        .separator {
          color: var(--text-muted);
        }

        .progress-bar {
          position: relative;
          height: 8px;
          background: var(--bg-hover);
          border-radius: 4px;
          cursor: pointer;
          transition: height 0.2s;
        }

        .progress-bar:hover {
          height: 12px;
        }

        .progress-fill {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background: var(--accent-color);
          border-radius: 4px;
          transition: width 0.1s linear;
        }

        .progress-handle {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 16px;
          height: 16px;
          background: var(--accent-light);
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          opacity: 0;
          transition: opacity 0.2s;
        }

        .progress-bar:hover .progress-handle {
          opacity: 1;
        }

        .settings-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          align-items: center;
        }

        .control-group {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }

        .control-group label {
          color: var(--text-secondary);
          font-weight: 500;
        }

        .control-group select,
        .control-group input {
          background: var(--bg-primary);
          color: var(--text-primary);
          border: 1px solid var(--border-primary);
          border-radius: 6px;
          padding: 6px 12px;
          font-size: 14px;
        }

        .control-group select:focus,
        .control-group input:focus {
          outline: none;
          border-color: var(--accent-color);
        }

        .tempo-input {
          width: 70px;
        }

        .unit {
          color: var(--text-muted);
          font-size: 12px;
        }

        .zoom-level {
          min-width: 50px;
          text-align: center;
          color: var(--text-primary);
          font-weight: 600;
        }

        .control-group button {
          background: var(--bg-hover);
          color: var(--text-primary);
          border: 1px solid var(--border-primary);
          border-radius: 4px;
          padding: 4px 12px;
          cursor: pointer;
          font-size: 16px;
          font-weight: bold;
          transition: all 0.2s;
        }

        .control-group button:hover {
          background: var(--bg-tertiary);
          border-color: var(--accent-color);
        }

        .tab-display {
          background: var(--bg-primary);
          border: 1px solid var(--border-primary);
          border-radius: 8px;
          padding: 24px;
          overflow-x: auto;
          overflow-y: hidden;
        }

        .tablature-container {
          min-width: 800px;
          position: relative;
        }

        .tab-header {
          display: flex;
          margin-bottom: 12px;
        }

        .string-labels {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-right: 16px;
        }

        .string-label {
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 14px;
          width: 30px;
          text-align: right;
        }

        .tab-content {
          position: relative;
        }

        .tab-line {
          position: relative;
          height: 30px;
          margin-bottom: 12px;
        }

        .string-line {
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: var(--border-secondary);
        }

        .tab-note {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          background: var(--bg-secondary);
          color: var(--text-primary);
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: 600;
          font-size: 14px;
          min-width: 24px;
          text-align: center;
          border: 2px solid var(--border-primary);
          transition: all 0.2s;
        }

        .tab-note.active {
          background: var(--accent-color);
          color: var(--text-inverse);
          border-color: var(--accent-light);
          transform: translate(-50%, -50%) scale(1.2);
          box-shadow: 0 0 12px var(--accent-color);
        }

        .no-tabs {
          text-align: center;
          padding: 60px 20px;
          color: var(--text-muted);
          font-size: 16px;
        }
      `}</style>
    </div>
  );
};

export default TabPlayer;