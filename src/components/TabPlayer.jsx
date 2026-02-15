import { useEffect, useState, useRef } from "react";

export default function TabPlayer({ tab }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const intervalRef = useRef(null);

  const notes = tab.measures[0].notes;
  const intervalTime = (60 / tab.tempo) * 1000;

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentNoteIndex((prev) => {
          if (prev + 1 >= notes.length) {
            clearInterval(intervalRef.current);
            return 0;
          }
          return prev + 1;
        });
      }, intervalTime);
    }

    return () => clearInterval(intervalRef.current);
  }, [isPlaying]);

  return (
    <div className="bg-slate-800 p-6 rounded-2xl mt-6">
      <h2 className="text-xl mb-4">Player</h2>

      <div className="flex gap-4 text-lg">
        {notes.map((note, index) => (
          <div
            key={index}
            className={`px-3 py-2 rounded ${
              index === currentNoteIndex
                ? "bg-blue-600"
                : "bg-slate-700"
            }`}
          >
            {note.fret}
          </div>
        ))}
      </div>

      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className="mt-4 bg-purple-600 px-4 py-2 rounded-lg"
      >
        {isPlaying ? "Pause" : "Play"}
      </button>
    </div>
  );
}
