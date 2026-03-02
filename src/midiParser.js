// MidiParser.js - Parse MIDI files into playable tab data
import { Midi } from '@tonejs/midi';

/**
 * Parse a MIDI file and extract note data for tabs
 */
export async function parseMidiFile(midiUrl) {
  try {
    const response = await fetch(midiUrl);
    const arrayBuffer = await response.arrayBuffer();
    const midi = new Midi(arrayBuffer);
    
    return {
      name: midi.name || 'Untitled',
      duration: midi.duration,
      durationTicks: midi.durationTicks,
      header: {
        ppq: midi.header.ppq, // Pulses per quarter note
        tempos: midi.header.tempos,
        timeSignatures: midi.header.timeSignatures,
        keySignatures: midi.header.keySignatures
      },
      tracks: midi.tracks.map((track, index) => ({
        id: `track-${index}`,
        name: track.name || `Track ${index + 1}`,
        instrument: track.instrument?.name || 'Unknown',
        channel: track.channel,
        notes: track.notes.map(note => ({
          midi: note.midi, // MIDI note number (0-127)
          name: note.name, // Note name (e.g., "C4", "F#3")
          time: note.time, // Time in seconds
          ticks: note.ticks, // Time in ticks
          duration: note.duration, // Duration in seconds
          durationTicks: note.durationTicks,
          velocity: note.velocity // Velocity (0-1)
        })),
        controlChanges: track.controlChanges,
        pitchBends: track.pitchBends
      }))
    };
  } catch (error) {
    console.error('Error parsing MIDI file:', error);
    throw new Error(`Failed to parse MIDI file: ${error.message}`);
  }
}

/**
 * Convert MIDI note numbers to guitar tab notation
 * Standard tuning: E2(40), A2(45), D3(50), G3(55), B3(59), E4(64)
 */
export function midiToGuitarTab(midiNote, tuning = [40, 45, 50, 55, 59, 64]) {
  const options = [];
  
  // Check each string to see if the note can be played
  tuning.forEach((stringNote, stringIndex) => {
    const fret = midiNote - stringNote;
    // Only consider frets 0-24 (reasonable range for guitar)
    if (fret >= 0 && fret <= 24) {
      options.push({
        string: 6 - stringIndex, // String 1 is highest (E4), String 6 is lowest (E2)
        fret: fret,
        stringIndex: stringIndex
      });
    }
  });
  
  return options;
}

/**
 * Convert parsed MIDI to guitar tablature format
 */
export function convertToGuitarTab(parsedMidi, trackIndex = 0) {
  const track = parsedMidi.tracks[trackIndex];
  if (!track) {
    throw new Error(`Track ${trackIndex} not found`);
  }
  
  // Group notes by time to handle chords
  const notesByTime = new Map();
  
  track.notes.forEach(note => {
    const timeKey = note.time.toFixed(3); // Round to milliseconds
    if (!notesByTime.has(timeKey)) {
      notesByTime.set(timeKey, []);
    }
    notesByTime.get(timeKey).push(note);
  });
  
  // Convert to tab notation
  const tabData = Array.from(notesByTime.entries()).map(([time, notes]) => {
    return {
      time: parseFloat(time),
      notes: notes.map(note => {
        const tabOptions = midiToGuitarTab(note.midi);
        // Pick the most convenient fingering (prefer higher strings for lower notes)
        const bestOption = tabOptions.length > 0 
          ? tabOptions.reduce((best, current) => 
              current.fret < best.fret ? current : best
            )
          : null;
        
        return {
          midi: note.midi,
          name: note.name,
          duration: note.duration,
          velocity: note.velocity,
          tab: bestOption
        };
      }).filter(n => n.tab !== null) // Only keep notes that can be played on guitar
    };
  }).filter(item => item.notes.length > 0);
  
  return {
    trackName: track.name,
    instrument: track.instrument,
    tempo: parsedMidi.header.tempos[0]?.bpm || 120,
    timeSignature: parsedMidi.header.timeSignatures[0] || { numerator: 4, denominator: 4 },
    duration: parsedMidi.duration,
    tabs: tabData
  };
}

/**
 * Get tuning presets
 */
export const TUNING_PRESETS = {
  standard: {
    name: 'Standard',
    notes: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
    midi: [40, 45, 50, 55, 59, 64]
  },
  dropD: {
    name: 'Drop D',
    notes: ['D2', 'A2', 'D3', 'G3', 'B3', 'E4'],
    midi: [38, 45, 50, 55, 59, 64]
  },
  halfStepDown: {
    name: 'Half Step Down',
    notes: ['Eb2', 'Ab2', 'Db3', 'Gb3', 'Bb3', 'Eb4'],
    midi: [39, 44, 49, 54, 58, 63]
  },
  dropC: {
    name: 'Drop C',
    notes: ['C2', 'G2', 'C3', 'F3', 'A3', 'D4'],
    midi: [36, 43, 48, 53, 57, 62]
  },
  openG: {
    name: 'Open G',
    notes: ['D2', 'G2', 'D3', 'G3', 'B3', 'D4'],
    midi: [38, 43, 50, 55, 59, 62]
  }
};

/**
 * Convert note name to MIDI number
 */
export function noteNameToMidi(noteName) {
  const noteMap = {
    'C': 0, 'C#': 1, 'Db': 1,
    'D': 2, 'D#': 3, 'Eb': 3,
    'E': 4,
    'F': 5, 'F#': 6, 'Gb': 6,
    'G': 7, 'G#': 8, 'Ab': 8,
    'A': 9, 'A#': 10, 'Bb': 10,
    'B': 11
  };
  
  const match = noteName.match(/^([A-G][#b]?)(\d+)$/);
  if (!match) {
    throw new Error(`Invalid note name: ${noteName}`);
  }
  
  const [, note, octave] = match;
  return noteMap[note] + (parseInt(octave) + 1) * 12;
}

/**
 * Convert MIDI number to note name
 */
export function midiToNoteName(midi) {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midi / 12) - 1;
  const noteName = noteNames[midi % 12];
  return `${noteName}${octave}`;
}

/**
 * Format time in MM:SS format
 */
export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}