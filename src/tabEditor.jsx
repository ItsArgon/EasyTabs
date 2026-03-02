import React, { useState, useRef } from 'react';
import { TUNING_PRESETS, midiToNoteName, noteNameToMidi } from './midiParser';
import audioEngine from './audioEngine';

const TabEditor = ({ onSave, initialTab = null }) => {
  const [tabName, setTabName] = useState(initialTab?.title || '');
  const [artist, setArtist] = useState(initialTab?.artist || '');
  const [tuning, setTuning] = useState('standard');
  const [tempo, setTempo] = useState(120);
  const [timeSignature, setTimeSignature] = useState({ numerator: 4, denominator: 4 });
  
  // Tab data structure: array of measures, each measure has beats, each beat has notes
  const [measures, setMeasures] = useState(initialTab?.measures || [
    { beats: Array(4).fill(null).map(() => ({ notes: Array(6).fill(null) })) }
  ]);
  
  const [currentMeasure, setCurrentMeasure] = useState(0);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [currentString, setCurrentString] = useState(0);
  const [selectedDuration, setSelectedDuration] = useState(1); // 1 = quarter note
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState({ measure: 0, beat: 0 });
  
  const canvasRef = useRef(null);

  const strings = TUNING_PRESETS[tuning]?.notes || TUNING_PRESETS.standard.notes;
  const fretCount = 24;

  // Add note to tablature
  const addNote = (stringIndex, fret) => {
    const newMeasures = [...measures];
    const measure = newMeasures[currentMeasure];
    const beat = measure.beats[currentBeat];
    
    // Set the note
    beat.notes[stringIndex] = {
      fret: fret,
      duration: selectedDuration
    };
    
    setMeasures(newMeasures);
    
    // Play the note as preview
    const midiNote = getMidiNoteForStringFret(stringIndex, fret);
    audioEngine.playNote(midiNote, 0.3);
    
    // Auto-advance to next beat
    advanceToNextPosition();
  };

  // Remove note
  const removeNote = (measureIndex, beatIndex, stringIndex) => {
    const newMeasures = [...measures];
    newMeasures[measureIndex].beats[beatIndex].notes[stringIndex] = null;
    setMeasures(newMeasures);
  };

  // Get MIDI note number for a string and fret
  const getMidiNoteForStringFret = (stringIndex, fret) => {
    const tuningMidi = TUNING_PRESETS[tuning]?.midi || TUNING_PRESETS.standard.midi;
    return tuningMidi[5 - stringIndex] + fret; // Reverse string order
  };

  // Advance cursor position
  const advanceToNextPosition = () => {
    let newBeat = currentBeat + 1;
    let newMeasure = currentMeasure;
    
    if (newBeat >= timeSignature.numerator) {
      newBeat = 0;
      newMeasure = currentMeasure + 1;
      
      // Add new measure if needed
      if (newMeasure >= measures.length) {
        const newMeasures = [...measures];
        newMeasures.push({
          beats: Array(timeSignature.numerator).fill(null).map(() => ({ 
            notes: Array(6).fill(null) 
          }))
        });
        setMeasures(newMeasures);
      }
    }
    
    setCurrentMeasure(newMeasure);
    setCurrentBeat(newBeat);
  };

  // Add measure
  const addMeasure = () => {
    setMeasures([...measures, {
      beats: Array(timeSignature.numerator).fill(null).map(() => ({ 
        notes: Array(6).fill(null) 
      }))
    }]);
  };

  // Delete measure
  const deleteMeasure = (index) => {
    if (measures.length === 1) return; // Keep at least one measure
    
    const newMeasures = measures.filter((_, i) => i !== index);
    setMeasures(newMeasures);
    
    if (currentMeasure >= newMeasures.length) {
      setCurrentMeasure(newMeasures.length - 1);
    }
  };

  // Play entire tab
  const playTab = async () => {
    setIsPlaying(true);
    
    // Convert tab to playable format
    const beatsPerMinute = tempo;
    const beatDuration = 60 / beatsPerMinute;
    
    let currentTime = 0;
    
    for (let m = 0; m < measures.length; m++) {
      const measure = measures[m];
      
      for (let b = 0; b < measure.beats.length; b++) {
        const beat = measure.beats[b];
        
        // Update visual position
        setPlaybackPosition({ measure: m, beat: b });
        
        // Collect notes to play
        const notesToPlay = [];
        beat.notes.forEach((note, stringIndex) => {
          if (note && note.fret !== null) {
            const midiNote = getMidiNoteForStringFret(stringIndex, note.fret);
            notesToPlay.push(midiNote);
          }
        });
        
        // Play chord or note
        if (notesToPlay.length > 0) {
          if (notesToPlay.length === 1) {
            await audioEngine.playNote(notesToPlay[0], beatDuration * 0.8);
          } else {
            await audioEngine.playChord(notesToPlay, beatDuration * 0.8);
          }
        }
        
        // Wait for beat duration
        await new Promise(resolve => setTimeout(resolve, beatDuration * 1000));
      }
    }
    
    setIsPlaying(false);
    setPlaybackPosition({ measure: 0, beat: 0 });
  };

  // Stop playback
  const stopPlayback = () => {
    setIsPlaying(false);
    setPlaybackPosition({ measure: 0, beat: 0 });
  };

  // Clear all
  const clearAll = () => {
    if (window.confirm('Are you sure you want to clear all notes?')) {
      setMeasures([{
        beats: Array(timeSignature.numerator).fill(null).map(() => ({ 
          notes: Array(6).fill(null) 
        }))
      }]);
      setCurrentMeasure(0);
      setCurrentBeat(0);
    }
  };

  // Save tab
  const handleSave = () => {
    if (!tabName || !artist) {
      alert('Please enter tab name and artist');
      return;
    }

    const tabData = {
      title: tabName,
      artist: artist,
      tuning: tuning,
      tempo: tempo,
      timeSignature: timeSignature,
      measures: measures,
      createdAt: new Date().toISOString()
    };

    if (onSave) {
      onSave(tabData);
    }
  };

  // Render fretboard
  const renderFretboard = () => {
    return (
      <div className="fretboard">
        <div className="fret-numbers">
          {Array.from({ length: fretCount + 1 }, (_, i) => (
            <div key={i} className="fret-number">{i}</div>
          ))}
        </div>
        
        {strings.map((stringNote, stringIndex) => (
          <div key={stringIndex} className="fretboard-string">
            <div className="string-name">{stringNote}</div>
            {Array.from({ length: fretCount + 1 }, (_, fret) => (
              <button
                key={fret}
                className={`fret-button ${currentString === stringIndex ? 'active-string' : ''}`}
                onClick={() => addNote(stringIndex, fret)}
                onMouseEnter={() => setCurrentString(stringIndex)}
              >
                <span className="fret-marker" />
              </button>
            ))}
          </div>
        ))}
      </div>
    );
  };

  // Render tablature
  const renderTablature = () => {
    return (
      <div className="tablature-editor">
        {measures.map((measure, measureIndex) => (
          <div 
            key={measureIndex} 
            className={`measure ${measureIndex === currentMeasure ? 'current-measure' : ''}`}
          >
            <div className="measure-header">
              <span className="measure-number">M{measureIndex + 1}</span>
              <button 
                className="delete-measure"
                onClick={() => deleteMeasure(measureIndex)}
                disabled={measures.length === 1}
              >
                ×
              </button>
            </div>
            
            <div className="beats">
              {measure.beats.map((beat, beatIndex) => (
                <div 
                  key={beatIndex}
                  className={`beat ${
                    measureIndex === currentMeasure && beatIndex === currentBeat ? 'current-beat' : ''
                  } ${
                    playbackPosition.measure === measureIndex && playbackPosition.beat === beatIndex ? 'playing-beat' : ''
                  }`}
                  onClick={() => {
                    setCurrentMeasure(measureIndex);
                    setCurrentBeat(beatIndex);
                  }}
                >
                  {strings.map((_, stringIndex) => {
                    const note = beat.notes[stringIndex];
                    return (
                      <div key={stringIndex} className="tab-cell">
                        <div className="string-line" />
                        {note && note.fret !== null ? (
                          <div 
                            className="note"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNote(measureIndex, beatIndex, stringIndex);
                            }}
                          >
                            {note.fret}
                          </div>
                        ) : (
                          <div className="empty-note">-</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ))}
        
        <button className="add-measure-btn" onClick={addMeasure}>
          + Add Measure
        </button>
      </div>
    );
  };

  return (
    <div className="tab-editor">
      {/* Header */}
      <div className="editor-header">
        <h2>Tab Editor</h2>
        <div className="header-actions">
          <button className="action-btn save" onClick={handleSave}>
            💾 Save Tab
          </button>
          <button className="action-btn clear" onClick={clearAll}>
            🗑️ Clear All
          </button>
        </div>
      </div>

      {/* Metadata */}
      <div className="metadata-section">
        <div className="form-row">
          <div className="form-group">
            <label>Tab Name *</label>
            <input
              type="text"
              value={tabName}
              onChange={(e) => setTabName(e.target.value)}
              placeholder="Enter tab name"
            />
          </div>
          
          <div className="form-group">
            <label>Artist *</label>
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Enter artist name"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Tuning</label>
            <select value={tuning} onChange={(e) => setTuning(e.target.value)}>
              {Object.entries(TUNING_PRESETS).map(([key, preset]) => (
                <option key={key} value={key}>{preset.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Tempo (BPM)</label>
            <input
              type="number"
              min="40"
              max="240"
              value={tempo}
              onChange={(e) => setTempo(Number(e.target.value))}
            />
          </div>

          <div className="form-group">
            <label>Time Signature</label>
            <div className="time-sig">
              <input
                type="number"
                min="1"
                max="16"
                value={timeSignature.numerator}
                onChange={(e) => setTimeSignature({ ...timeSignature, numerator: Number(e.target.value) })}
                style={{ width: '60px' }}
              />
              <span>/</span>
              <input
                type="number"
                min="1"
                max="16"
                value={timeSignature.denominator}
                onChange={(e) => setTimeSignature({ ...timeSignature, denominator: Number(e.target.value) })}
                style={{ width: '60px' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Playback controls */}
      <div className="playback-controls">
        <button 
          className="play-btn"
          onClick={isPlaying ? stopPlayback : playTab}
          disabled={measures.every(m => m.beats.every(b => b.notes.every(n => !n)))}
        >
          {isPlaying ? '⏹ Stop' : '▶ Play'}
        </button>
        
        <div className="position-indicator">
          Position: Measure {currentMeasure + 1}, Beat {currentBeat + 1}
        </div>
      </div>

      {/* Tablature display */}
      <div className="tab-section">
        <h3>Tablature</h3>
        {renderTablature()}
      </div>

      {/* Fretboard */}
      <div className="fretboard-section">
        <h3>Fretboard (Click to add notes)</h3>
        {renderFretboard()}
      </div>

      <style jsx>{`
        .tab-editor {
          background: var(--bg-secondary);
          border-radius: 12px;
          padding: 24px;
          border: 1px solid var(--border-primary);
        }

        .editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .editor-header h2 {
          color: var(--text-primary);
          margin: 0;
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .action-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .action-btn.save {
          background: var(--accent-color);
          color: var(--text-inverse);
        }

        .action-btn.save:hover {
          background: var(--accent-hover);
        }

        .action-btn.clear {
          background: var(--bg-hover);
          color: var(--text-primary);
          border: 1px solid var(--border-primary);
        }

        .action-btn.clear:hover {
          background: var(--error-bg);
          color: var(--error);
        }

        .metadata-section {
          background: var(--bg-primary);
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 24px;
        }

        .form-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }

        .form-row:last-child {
          margin-bottom: 0;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 14px;
        }

        .form-group input,
        .form-group select {
          background: var(--bg-secondary);
          color: var(--text-primary);
          border: 1px solid var(--border-primary);
          border-radius: 6px;
          padding: 10px;
          font-size: 14px;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: var(--accent-color);
        }

        .time-sig {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .time-sig span {
          color: var(--text-primary);
          font-size: 20px;
          font-weight: bold;
        }

        .playback-controls {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }

        .play-btn {
          padding: 12px 24px;
          background: var(--accent-color);
          color: var(--text-inverse);
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .play-btn:hover:not(:disabled) {
          background: var(--accent-hover);
        }

        .play-btn:disabled {
          background: var(--bg-hover);
          color: var(--text-muted);
          cursor: not-allowed;
        }

        .position-indicator {
          color: var(--text-secondary);
          font-size: 14px;
          font-weight: 600;
        }

        .tab-section,
        .fretboard-section {
          margin-bottom: 32px;
        }

        .tab-section h3,
        .fretboard-section h3 {
          color: var(--text-primary);
          margin-bottom: 16px;
          font-size: 18px;
        }

        .tablature-editor {
          background: var(--bg-primary);
          padding: 20px;
          border-radius: 8px;
          overflow-x: auto;
          display: flex;
          gap: 8px;
          align-items: flex-start;
        }

        .measure {
          border: 2px solid var(--border-primary);
          border-radius: 8px;
          padding: 12px;
          min-width: 200px;
          transition: all 0.3s;
        }

        .measure.current-measure {
          border-color: var(--accent-color);
          box-shadow: 0 0 8px var(--accent-bg-subtle);
        }

        .measure-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .measure-number {
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 12px;
        }

        .delete-measure {
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 20px;
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .delete-measure:hover:not(:disabled) {
          background: var(--error-bg);
          color: var(--error);
        }

        .delete-measure:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .beats {
          display: flex;
          gap: 4px;
        }

        .beat {
          border: 1px solid var(--border-secondary);
          border-radius: 4px;
          padding: 8px 4px;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 40px;
        }

        .beat:hover {
          background: var(--bg-hover);
        }

        .beat.current-beat {
          background: var(--accent-bg-subtle);
          border-color: var(--accent-color);
        }

        .beat.playing-beat {
          background: var(--accent-color);
          animation: pulse 0.5s ease-in-out;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .tab-cell {
          position: relative;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .string-line {
          position: absolute;
          width: 100%;
          height: 1px;
          background: var(--border-secondary);
          top: 50%;
        }

        .note {
          background: var(--accent-color);
          color: var(--text-inverse);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          z-index: 1;
          cursor: pointer;
          transition: all 0.2s;
        }

        .note:hover {
          background: var(--error);
          transform: scale(1.2);
        }

        .empty-note {
          color: var(--text-muted);
          font-size: 12px;
          z-index: 1;
        }

        .add-measure-btn {
          background: var(--bg-hover);
          color: var(--text-secondary);
          border: 2px dashed var(--border-primary);
          border-radius: 8px;
          padding: 20px;
          min-width: 100px;
          cursor: pointer;
          transition: all 0.3s;
          font-weight: 600;
        }

        .add-measure-btn:hover {
          background: var(--bg-tertiary);
          border-color: var(--accent-color);
          color: var(--accent-color);
        }

        .fretboard {
          background: var(--bg-primary);
          padding: 20px;
          border-radius: 8px;
          overflow-x: auto;
        }

        .fret-numbers {
          display: flex;
          gap: 2px;
          margin-bottom: 8px;
          padding-left: 60px;
        }

        .fret-number {
          min-width: 40px;
          text-align: center;
          color: var(--text-muted);
          font-size: 12px;
          font-weight: 600;
        }

        .fretboard-string {
          display: flex;
          align-items: center;
          gap: 2px;
          margin-bottom: 4px;
        }

        .string-name {
          width: 50px;
          text-align: right;
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 14px;
          padding-right: 10px;
        }

        .fret-button {
          min-width: 40px;
          height: 40px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }

        .fret-button:hover {
          background: var(--accent-bg-subtle);
          border-color: var(--accent-color);
        }

        .fret-button.active-string {
          border-color: var(--accent-light);
        }

        .fret-marker {
          position: absolute;
          width: 8px;
          height: 8px;
          background: var(--text-muted);
          border-radius: 50%;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          opacity: 0;
          transition: opacity 0.2s;
        }

        .fret-button:hover .fret-marker {
          opacity: 1;
          background: var(--accent-color);
        }
      `}</style>
    </div>
  );
};

export default TabEditor;