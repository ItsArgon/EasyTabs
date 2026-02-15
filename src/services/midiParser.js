// Utility to parse MIDI files and convert to tab format
export const parseMidiFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const tabData = extractTabDataFromMidi(data);
        resolve(tabData);
      } catch (error) {
        reject(new Error(`Failed to parse MIDI file: ${error.message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

const extractTabDataFromMidi = (arrayBuffer) => {
  if (!arrayBuffer || arrayBuffer.byteLength < 14) {
    throw new Error("File is too small to be a valid MIDI file (must be at least 14 bytes)");
  }

  const view = new Uint8Array(arrayBuffer);
  
  // Check for MIDI header "MThd"
  // 0x4d = 'M', 0x54 = 'T', 0x68 = 'h', 0x64 = 'd'
  if (view[0] !== 0x4d || view[1] !== 0x54 || view[2] !== 0x68 || view[3] !== 0x64) {
    const headerBytes = Array.from(view.slice(0, 4)).map(b => `0x${b.toString(16).toUpperCase()}`).join(' ');
    const headerString = Array.from(view.slice(0, 4))
      .map(b => String.fromCharCode(b))
      .join("") 
      .replace(/[^\x20-\x7E]/g, "?"); // Replace non-printable chars
    
    // Try to detect common file formats
    let hint = "";
    if (headerString.startsWith("ID3")) {
      hint = " (This appears to be an MP3 file, not MIDI)";
    } else if (headerBytes.startsWith("0x89")) {
      hint = " (This appears to be a PNG image file, not MIDI)";
    } else if (headerBytes.startsWith("0xFF")) {
      hint = " (This might be a corrupted or encrypted MIDI file)";
    }
    
    throw new Error(`Not a valid MIDI file. File starts with: "${headerString}" (${headerBytes})${hint}`);
  }

  // Extract basic information
  const notes = [];
  const tempos = [];
  let currentTempo = 500000; // Default: 120 BPM = 500000 microseconds per beat
  let trackPosition = 0;

  // Skip header (14 bytes)
  let pos = 14;

  // Parse tracks
  while (pos < view.length) {
    // Look for track header "MTrk"
    if (
      view[pos] === 0x4d &&
      view[pos + 1] === 0x54 &&
      view[pos + 2] === 0x72 &&
      view[pos + 3] === 0x6b
    ) {
      pos += 4;

      // Get track length
      const trackLength =
        (view[pos] << 24) |
        (view[pos + 1] << 16) |
        (view[pos + 2] << 8) |
        view[pos + 3];
      pos += 4;

      const trackEnd = pos + trackLength;
      let time = 0;

      // Parse track events
      while (pos < trackEnd) {
        // Read variable-length delta time
        const deltaTime = readVariableLength(view, pos);
        pos += deltaTime.length;
        time += deltaTime.value;

        // Read event
        const eventByte = view[pos];
        pos++;

        if (eventByte === 0xff) {
          // Meta event
          const metaType = view[pos];
          pos++;

          const length = readVariableLength(view, pos);
          pos += length.length;
          const metaLength = length.value;

          if (metaType === 0x51) {
            // Tempo meta event
            currentTempo =
              (view[pos] << 16) |
              (view[pos + 1] << 8) |
              view[pos + 2];
            tempos.push({ time, tempo: currentTempo });
          }

          pos += metaLength;
        } else if ((eventByte & 0xf0) === 0x90) {
          // Note On
          const pitch = view[pos];
          const velocity = view[pos + 1];
          pos += 2;

          if (velocity > 0) {
            notes.push({
              pitch,
              startTime: time,
              velocity,
              string: pitchToString(pitch),
              fret: pitchToFret(pitch)
            });
          }
        } else if ((eventByte & 0xf0) === 0x80) {
          // Note Off
          pos += 2;
        } else if ((eventByte & 0xf0) === 0xb0) {
          // Control Change
          pos += 2;
        } else if ((eventByte & 0xf0) === 0xc0) {
          // Program Change
          pos += 1;
        } else if ((eventByte & 0xf0) === 0xe0) {
          // Pitch Bend
          pos += 2;
        } else if (eventByte === 0xf0 || eventByte === 0xf7) {
          // SysEx
          const length = readVariableLength(view, pos);
          pos += length.length + length.value;
        } else {
          pos++;
        }
      }
    } else {
      pos++;
    }
  }

  // Calculate average tempo
  const avgTempo = tempos.length > 0
    ? Math.round(
        60000000 /
        tempos.reduce((sum, t) => sum + t.tempo, 0) /
        tempos.length
      )
    : 120;

  // Group notes into measures (assuming 120 BPM, 4 beats per measure)
  const measures = groupNotesIntoMeasures(notes, avgTempo);

  return {
    notes,
    tempo: avgTempo,
    measures
  };
};

const readVariableLength = (view, pos) => {
  let value = 0;
  let length = 0;
  let byte;

  do {
    byte = view[pos + length];
    value = (value << 7) | (byte & 0x7f);
    length++;
  } while (byte & 0x80);

  return { value, length };
};

// Convert MIDI pitch (0-127) to guitar string (1-6)
const pitchToString = (pitch) => {
  // Standard tuning: E2(40) A2(45) D3(50) G3(55) B3(59) E4(64)
  const stringPitches = [64, 59, 55, 50, 45, 40]; // High E to Low E
  
  for (let i = 0; i < stringPitches.length; i++) {
    if (pitch >= stringPitches[i] - 12 && pitch <= stringPitches[i]) {
      return i + 1;
    }
  }
  
  return 1; // Default to first string
};

// Convert MIDI pitch to fret number on guitar (0-24)
const pitchToFret = (pitch) => {
  const stringPitches = [64, 59, 55, 50, 45, 40]; // High E to Low E
  
  for (let i = 0; i < stringPitches.length; i++) {
    if (pitch >= stringPitches[i] - 12 && pitch <= stringPitches[i]) {
      return Math.max(0, Math.min(24, pitch - (stringPitches[i] - 12)));
    }
  }
  
  return 0; // Default fret
};

// Group notes into measures
const groupNotesIntoMeasures = (notes, tempo) => {
  const measures = [];
  
  if (notes.length === 0) {
    return [{ notes: [] }];
  }

  // Sort notes by time
  const sortedNotes = [...notes].sort((a, b) => a.startTime - b.startTime);

  const beatsPerMeasure = 4;
  const ticksPerBeat = 480; // Standard MIDI ticks per quarter note
  const ticksPerMeasure = beatsPerMeasure * ticksPerBeat;

  let currentMeasure = 0;
  const measureMap = {};

  for (const note of sortedNotes) {
    const measureIndex = Math.floor(note.startTime / ticksPerMeasure);
    
    if (!measureMap[measureIndex]) {
      measureMap[measureIndex] = [];
    }
    
    measureMap[measureIndex].push({
      string: note.string,
      fret: note.fret,
      velocity: note.velocity
    });
  }

  // Convert map to array
  const maxMeasure = Math.max(...Object.keys(measureMap).map(Number));
  for (let i = 0; i <= maxMeasure; i++) {
    measures.push({
      notes: measureMap[i] || []
    });
  }

  // Ensure at least one measure
  if (measures.length === 0) {
    measures.push({ notes: [] });
  }

  return measures;
};
