import { useState } from "react";

export default function TabEditor({ tab, onSave }) {
  const [tempo, setTempo] = useState(tab.tempo);
  const [measures, setMeasures] = useState(tab.measures);

  const addNote = () => {
    const updated = [...measures];
    updated[0].notes.push({
      string: 1,
      fret: 0,
      duration: 1
    });
    setMeasures(updated);
  };

  return (
    <div className="bg-slate-800 p-6 rounded-2xl">
      <h2 className="text-xl mb-4">Edit Tab</h2>

      <div className="mb-4">
        <label>Tempo (BPM)</label>
        <input
          type="number"
          value={tempo}
          onChange={(e) => setTempo(Number(e.target.value))}
          className="ml-2 bg-slate-700 px-2 py-1 rounded"
        />
      </div>

      <div className="space-y-2">
        {measures[0].notes.map((note, index) => (
          <div key={index} className="flex gap-4">
            <span>String: {note.string}</span>
            <span>Fret: {note.fret}</span>
          </div>
        ))}
      </div>

      <button
        onClick={addNote}
        className="mt-4 bg-blue-600 px-4 py-2 rounded-lg"
      >
        Add Note
      </button>

      <button
        onClick={() => onSave({ ...tab, tempo, measures })}
        className="mt-4 ml-4 bg-green-600 px-4 py-2 rounded-lg"
      >
        Save
      </button>
    </div>
  );
}
