// AudioEngine.js - Synthesize and play guitar notes using Tone.js
import * as Tone from 'tone';

class AudioEngine {
  constructor() {
    this.synth = null;
    this.isPlaying = false;
    this.currentPart = null;
    this.currentTime = 0;
    this.duration = 0;
    this.onTimeUpdate = null;
    this.onPlayStateChange = null;
  }

  /**
   * Initialize the audio engine
   */
  async init() {
    if (this.synth) {
      return; // Already initialized
    }

    await Tone.start();
    console.log('Audio engine initialized');

    // Create a polyphonic synth for guitar-like sounds
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: 'triangle' // Triangle wave for warmer, guitar-like tone
      },
      envelope: {
        attack: 0.005,  // Quick attack like a guitar pick
        decay: 0.1,
        sustain: 0.3,
        release: 1.5    // Natural decay
      },
      volume: -8 // Reduce volume to prevent clipping
    }).toDestination();

    // Add reverb for more natural sound
    const reverb = new Tone.Reverb({
      decay: 2,
      wet: 0.2
    }).toDestination();

    this.synth.connect(reverb);

    console.log('Synth created and connected');
  }

  /**
   * Load and prepare tab data for playback
   */
  async loadTabData(tabData) {
    await this.init();
    
    this.stop(); // Stop any current playback
    
    if (!tabData || !tabData.tabs) {
      throw new Error('Invalid tab data');
    }

    this.duration = tabData.duration || 0;
    console.log('Loaded tab data:', tabData);
    
    return tabData;
  }

  /**
   * Play tab data
   */
  async play(tabData, startTime = 0) {
    await this.init();
    
    if (this.isPlaying) {
      this.stop();
    }

    this.isPlaying = true;
    this.currentTime = startTime;
    this._notifyPlayStateChange();

    // Schedule all notes
    const now = Tone.now();
    
    tabData.tabs.forEach(item => {
      if (item.time >= startTime) {
        const scheduleTime = now + (item.time - startTime);
        
        item.notes.forEach(note => {
          // Convert MIDI number to frequency
          const frequency = Tone.Frequency(note.midi, 'midi').toFrequency();
          
          // Play the note
          this.synth.triggerAttackRelease(
            frequency,
            note.duration,
            scheduleTime,
            note.velocity
          );
        });
      }
    });

    // Start transport
    Tone.Transport.start();

    // Update current time
    this._startTimeUpdater();

    console.log('Playback started');
  }

  /**
   * Pause playback
   */
  pause() {
    if (!this.isPlaying) return;

    Tone.Transport.pause();
    this.isPlaying = false;
    this._notifyPlayStateChange();
    this._stopTimeUpdater();
    
    console.log('Playback paused');
  }

  /**
   * Resume playback
   */
  resume() {
    if (this.isPlaying) return;

    Tone.Transport.start();
    this.isPlaying = true;
    this._notifyPlayStateChange();
    this._startTimeUpdater();
    
    console.log('Playback resumed');
  }

  /**
   * Stop playback
   */
  stop() {
    if (this.currentPart) {
      this.currentPart.stop();
      this.currentPart.dispose();
      this.currentPart = null;
    }

    Tone.Transport.stop();
    Tone.Transport.cancel(); // Clear all scheduled events
    
    this.isPlaying = false;
    this.currentTime = 0;
    this._notifyPlayStateChange();
    this._stopTimeUpdater();
    
    console.log('Playback stopped');
  }

  /**
   * Seek to a specific time
   */
  seek(time) {
    const wasPlaying = this.isPlaying;
    this.stop();
    this.currentTime = time;
    
    if (wasPlaying) {
      // Will need to restart playback from new position
      // This requires the tab data, so we'll handle this in the component
    }
    
    this._notifyTimeUpdate();
  }

  /**
   * Play a single note (for editor preview)
   */
  async playNote(midiNote, duration = 0.5, velocity = 0.8) {
    await this.init();
    
    const frequency = Tone.Frequency(midiNote, 'midi').toFrequency();
    this.synth.triggerAttackRelease(frequency, duration, undefined, velocity);
  }

  /**
   * Play a chord (multiple notes at once)
   */
  async playChord(midiNotes, duration = 0.5, velocity = 0.8) {
    await this.init();
    
    const frequencies = midiNotes.map(midi => 
      Tone.Frequency(midi, 'midi').toFrequency()
    );
    
    this.synth.triggerAttackRelease(frequencies, duration, undefined, velocity);
  }

  /**
   * Set tempo (BPM)
   */
  setTempo(bpm) {
    Tone.Transport.bpm.value = bpm;
    console.log('Tempo set to', bpm, 'BPM');
  }

  /**
   * Get current tempo
   */
  getTempo() {
    return Tone.Transport.bpm.value;
  }

  /**
   * Set volume (-60 to 6 dB)
   */
  setVolume(db) {
    if (this.synth) {
      this.synth.volume.value = db;
    }
  }

  /**
   * Clean up resources
   */
  dispose() {
    this.stop();
    
    if (this.synth) {
      this.synth.dispose();
      this.synth = null;
    }
    
    console.log('Audio engine disposed');
  }

  /**
   * Private: Start time updater
   */
  _startTimeUpdater() {
    this._stopTimeUpdater();
    
    this._timeUpdateInterval = setInterval(() => {
      if (this.isPlaying) {
        this.currentTime = Tone.Transport.seconds;
        this._notifyTimeUpdate();
        
        // Auto-stop when reaching the end
        if (this.duration > 0 && this.currentTime >= this.duration) {
          this.stop();
        }
      }
    }, 100); // Update every 100ms
  }

  /**
   * Private: Stop time updater
   */
  _stopTimeUpdater() {
    if (this._timeUpdateInterval) {
      clearInterval(this._timeUpdateInterval);
      this._timeUpdateInterval = null;
    }
  }

  /**
   * Private: Notify time update
   */
  _notifyTimeUpdate() {
    if (this.onTimeUpdate) {
      this.onTimeUpdate(this.currentTime, this.duration);
    }
  }

  /**
   * Private: Notify play state change
   */
  _notifyPlayStateChange() {
    if (this.onPlayStateChange) {
      this.onPlayStateChange(this.isPlaying);
    }
  }
}

// Create a singleton instance
const audioEngine = new AudioEngine();

export default audioEngine;