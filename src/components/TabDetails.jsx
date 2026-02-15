import { useState } from "react";
import TabPlayer from "./TabPlayer";

export default function TabDetails({ tab, onImport }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleImport = async () => {
    setIsLoading(true);
    try {
      await onImport();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-8 rounded-2xl">
        <h1 className="text-4xl font-bold mb-2">{tab.title}</h1>
        <p className="text-xl text-slate-200 mb-4">{tab.artist || "Unknown Artist"}</p>
        <div className="flex gap-6">
          <div>
            <p className="text-slate-300">Difficulty</p>
            <p className="text-2xl font-bold">{tab.difficulty || "N/A"}</p>
          </div>
          <div>
            <p className="text-slate-300">Tempo</p>
            <p className="text-2xl font-bold">{tab.tempo || 120} BPM</p>
          </div>
          <div>
            <p className="text-slate-300">Votes</p>
            <p className="text-2xl font-bold">{tab.votes || 0}</p>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-slate-800 p-8 rounded-2xl">
        <h2 className="text-2xl font-bold mb-6">Tab Preview</h2>
        
        {/* Songsterr-like Tab Display */}
        <div className="bg-slate-900 p-8 rounded-lg overflow-x-auto mb-6 font-mono">
          <div className="space-y-4">
            {tab.measures && tab.measures.length > 0 ? (
              tab.measures.map((measure, idx) => (
                <div key={idx} className="border-b border-slate-700 pb-4">
                  <div className="text-sm text-slate-500 mb-2">Measure {idx + 1}</div>
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5, 6].map((string) => (
                      <div key={string} className="flex gap-2">
                        <span className="text-slate-500 w-4">E{7 - string}</span>
                        <div className="flex gap-1">
                          {measure.notes && measure.notes.length > 0 ? (
                            measure.notes.map((note, noteIdx) => (
                              <span key={noteIdx} className="inline-block w-8 text-center text-blue-400">
                                {note.string === string ? note.fret : "–"}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-600">No notes</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400">Tab data not available</p>
            )}
          </div>
        </div>

        {/* Player */}
        {tab.measures && tab.measures.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Player</h3>
            <TabPlayer tab={tab} />
          </div>
        )}

        {/* Description */}
        {tab.description && (
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2">Description</h3>
            <p className="text-slate-300">{tab.description}</p>
          </div>
        )}

        {/* Import Button */}
        <button
          onClick={handleImport}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-4 rounded-lg text-lg transition"
        >
          {isLoading ? "Importing..." : "Import This Tab to My Collection"}
        </button>
      </div>
    </div>
  );
}
